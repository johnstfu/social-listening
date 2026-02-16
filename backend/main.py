"""
Social Listening MVP - Backend FastAPI
======================================
API de monitoring des avis restaurants
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
import requests

from models import Base, engine, SessionLocal, Restaurant, Review, Alert, Recommendation, RecommendationStep, PlatformConnection, User, ConnectedPlatform
from schemas import (
    RestaurantCreate, RestaurantResponse, ReviewResponse, AlertCreate, AlertResponse,
    RecommendationCreate, RecommendationResponse, RecommendationStepResponse,
    PlatformConnectionCreate, PlatformConnectionResponse
)
from google_places import GooglePlacesClient
from sentiment import SentimentAnalyzer
from email_service import EmailService
from oauth_gbp import GoogleBusinessProfileOAuth, gbp_oauth
from oauth_facebook import FacebookPagesOAuth, facebook_oauth
from sentiment_claude import ClaudeSentimentAnalyzer, claude_analyzer
from sync_scheduler import sync_scheduler, start_sync_scheduler, stop_sync_scheduler

# Configuration
app = FastAPI(
    title="Social Listening API",
    description="API de monitoring des avis restaurants",
    version="1.0.0"
)

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Social Listening API",
        "version": "1.0.0",
        "docs": "/docs",
        "frontend": "http://localhost:3000"
    }

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production: spécifier les domaines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Créer les tables
Base.metadata.create_all(bind=engine)

# Services
google_client = GooglePlacesClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
sentiment_analyzer = SentimentAnalyzer()
email_service = EmailService(api_key=os.getenv("SENDGRID_API_KEY"))

# Auth configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Google OAuth config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")


def create_jwt_token(user_id: int):
    """Créer un token JWT"""
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"user_id": user_id, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ==================== AUTH ====================

@app.post("/api/auth/register")
def register(email: str, password: str, db: Session = Depends(get_db)):
    """Inscription utilisateur"""
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Hasher le mot de passe
    password_hash = pwd_context.hash(password)

    # Créer l'utilisateur
    user = User(email=email, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Générer le token JWT
    token = create_jwt_token(user.id)

    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}


@app.post("/api/auth/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    """Connexion utilisateur"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    token = create_jwt_token(user.id)

    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}


@app.get("/api/auth/me")
def get_current_user(token: str = None, db: Session = Depends(get_db)):
    """Récupérer l'utilisateur connecté"""
    if not token:
        raise HTTPException(status_code=401, detail="Token manquant")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

    return {"id": user.id, "email": user.email}


# ==================== GOOGLE OAUTH ====================

@app.get("/api/auth/google/url")
def get_google_oauth_url():
    """Génère l'URL de connexion Google OAuth"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth non configuré")

    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=email profile&"
        f"access_type=offline"
    )
    return {"url": url}


@app.get("/api/auth/google/callback")
def google_oauth_callback(code: str, db: Session = Depends(get_db)):
    """Callback Google OAuth - échange le code contre un token"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth non configuré")

    # Échanger le code contre un token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erreur échange token Google")

    token_data = response.json()
    access_token = token_data.get("access_token")

    # Récupérer les infos utilisateur
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    userinfo_response = requests.get(userinfo_url, headers=headers)

    if userinfo_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Erreur récupération infos Google")

    userinfo = userinfo_response.json()
    email = userinfo.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email non fourni par Google")

    # Vérifier si l'utilisateur existe déjà
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Créer l'utilisateur sans mot de passe (OAuth uniquement)
        user = User(email=email, password_hash="")
        db.add(user)
        db.commit()
        db.refresh(user)

    # Générer le token JWT
    jwt_token = create_jwt_token(user.id)

    return {"access_token": jwt_token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}


# ==================== HELPERS ====================

def get_current_user_id(token: str = None, db: Session = None) -> int:
    """Extraire l'user_id du token JWT"""
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except:
        return None


# ==================== RESTAURANTS ====================

@app.get("/api/restaurants", response_model=List[RestaurantResponse])
def list_restaurants(token: str = None, db: Session = Depends(get_db)):
    """Liste les restaurants de l'utilisateur connecté"""
    user_id = get_current_user_id(token, db)
    if user_id:
        restaurants = db.query(Restaurant).filter(Restaurant.user_id == user_id).all()
    else:
        # Mode démo: retourner tous les restaurants
        restaurants = db.query(Restaurant).all()
    return restaurants


@app.get("/api/restaurants/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: int, token: str = None, db: Session = Depends(get_db)):
    """Détail d'un restaurant"""
    user_id = get_current_user_id(token, db)
    query = db.query(Restaurant).filter(Restaurant.id == restaurant_id)
    if user_id:
        query = query.filter(Restaurant.user_id == user_id)
    restaurant = query.first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")
    return restaurant


@app.post("/api/restaurants", response_model=RestaurantResponse)
def create_restaurant(restaurant: RestaurantCreate, token: str = None, db: Session = Depends(get_db)):
    """Ajouter un nouveau restaurant à monitorer"""
    user_id = get_current_user_id(token, db)
    # Créer le restaurant
    db_restaurant = Restaurant(
        name=restaurant.name,
        google_place_id=restaurant.google_place_id,
        address=restaurant.address,
        email_alert=restaurant.email_alert,
        user_id=user_id
    )
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)

    # Récupérer les avis initiaux
    reviews = google_client.get_reviews(restaurant.google_place_id)
    for review_data in reviews:
        sentiment = sentiment_analyzer.analyze(review_data["text"])
        db_review = Review(
            restaurant_id=db_restaurant.id,
            source="google",
            author=review_data.get("author", "Anonyme"),
            rating=review_data["rating"],
            text=review_data["text"],
            date=review_data.get("date"),
            sentiment=sentiment["label"],
            sentiment_score=sentiment["score"]
        )
        db.add(db_review)

    db.commit()
    return db_restaurant


# ==================== REVIEWS ====================

@app.get("/api/restaurants/{restaurant_id}/reviews", response_model=List[ReviewResponse])
def get_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    """Récupérer les avis d'un restaurant"""
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).order_by(Review.date.desc()).all()
    return reviews


@app.get("/api/restaurants/{restaurant_id}/sentiment")
def get_sentiment_summary(restaurant_id: int, db: Session = Depends(get_db)):
    """Résumé du sentiment pour un restaurant"""
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).all()

    if not reviews:
        return {"positive": 0, "neutral": 0, "negative": 0, "average_score": 0}

    positive = sum(1 for r in reviews if r.sentiment == "positive")
    neutral = sum(1 for r in reviews if r.sentiment == "neutral")
    negative = sum(1 for r in reviews if r.sentiment == "negative")
    avg_score = sum(r.sentiment_score for r in reviews) / len(reviews)

    return {
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "average_score": round(avg_score, 2),
        "total_reviews": len(reviews)
    }


# ==================== ALERTS ====================

@app.get("/api/alerts", response_model=List[AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    """Liste toutes les alertes configurées"""
    alerts = db.query(Alert).all()
    return alerts


@app.post("/api/alerts", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Créer une nouvelle alerte"""
    db_alert = Alert(
        restaurant_id=alert.restaurant_id,
        alert_type=alert.alert_type,
        threshold=alert.threshold,
        email=alert.email,
        is_active=True
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@app.get("/api/restaurants/{restaurant_id}/alerts")
def get_restaurant_alerts(restaurant_id: int, db: Session = Depends(get_db)):
    """Récupérer les alertes pour un restaurant spécifique"""
    from datetime import datetime, timedelta

    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    # Récupérer les avis récents pour générer des alertes intelligentes
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).order_by(Review.date.desc()).limit(20).all()

    alerts = []

    # Alerte: Avis négatifs récents
    negative_reviews = [r for r in reviews if r.rating <= 2]
    if len(negative_reviews) >= 3:
        alerts.append({
            "id": f"neg-{restaurant_id}",
            "severity": "warning",
            "title": f"Tendance négative - {len(negative_reviews)} avis négatifs récents",
            "description": f"{len(negative_reviews)} avis de 2 étoiles ou moins dans les 20 derniers avis",
            "recommendation": "Analysez les commentaires pour identifier les problèmes récurrents",
            "created_at": datetime.now().isoformat()
        })

    # Alerte: Avis 1 étoile
    one_star = [r for r in reviews if r.rating == 1]
    if one_star:
        alert_review = one_star[0]
        alerts.append({
            "id": f"critical-{restaurant_id}-{alert_review.id}",
            "severity": "critical",
            "title": f"Avis 1 étoile - {alert_review.author or 'Client'}",
            "description": alert_review.text[:100] + "..." if len(alert_review.text or "") > 100 else alert_review.text,
            "recommendation": "Contactez le client pour résoudre le problème",
            "created_at": alert_review.date.isoformat() if alert_review.date else datetime.now().isoformat()
        })

    # Alerte: Note moyenne basse
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
    if avg_rating < 3.5:
        alerts.append({
            "id": f"rating-{restaurant_id}",
            "severity": "warning",
            "title": f"Note moyenne basse ({avg_rating:.1f}⭐)",
            "description": "La note moyenne récente est inférieure à 3.5",
            "recommendation": "Identifiez les axes d'amélioration prioritaires",
            "created_at": datetime.now().isoformat()
        })

    # Alerte positive: Bonne performance
    if avg_rating >= 4.0 and len(reviews) >= 5:
        alerts.append({
            "id": f"positive-{restaurant_id}",
            "severity": "info",
            "title": "Excellentes performances récentes",
            "description": f"Note moyenne de {avg_rating:.1f}⭐ sur les {len(reviews)} derniers avis",
            "recommendation": "Partagez ces bonnes performances sur vos réseaux",
            "created_at": datetime.now().isoformat()
        })

    return alerts


# ==================== RECOMMENDATIONS ====================

@app.get("/api/restaurants/{restaurant_id}/recommendations", response_model=List[RecommendationResponse])
def list_recommendations(restaurant_id: int, db: Session = Depends(get_db)):
    """Liste des recommandations pour un restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    recommendations = db.query(Recommendation).filter(
        Recommendation.restaurant_id == restaurant_id
    ).order_by(Recommendation.created_at.desc()).all()
    return recommendations


@app.post("/api/restaurants/{restaurant_id}/recommendations", response_model=RecommendationResponse)
def create_recommendation(restaurant_id: int, recommendation: RecommendationCreate, db: Session = Depends(get_db)):
    """Créer une nouvelle recommandation pour un restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    db_recommendation = Recommendation(
        restaurant_id=restaurant_id,
        priority=recommendation.priority,
        category=recommendation.category,
        title=recommendation.title,
        description=recommendation.description,
        source=recommendation.source,
        total_steps=recommendation.total_steps,
        progress=0,
        is_completed=False
    )
    db.add(db_recommendation)
    db.commit()
    db.refresh(db_recommendation)

    # Créer les étapes si fournies
    if recommendation.steps:
        for step_data in recommendation.steps:
            db_step = RecommendationStep(
                recommendation_id=db_recommendation.id,
                title=step_data.title,
                description=step_data.description,
                order=step_data.order,
                is_completed=False
            )
            db.add(db_step)
        db.commit()
        db.refresh(db_recommendation)

    return db_recommendation


@app.get("/api/recommendations/{recommendation_id}/steps", response_model=List[RecommendationStepResponse])
def list_recommendation_steps(recommendation_id: int, db: Session = Depends(get_db)):
    """Liste des étapes d'une recommandation"""
    recommendation = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommandation non trouvée")

    steps = db.query(RecommendationStep).filter(
        RecommendationStep.recommendation_id == recommendation_id
    ).order_by(RecommendationStep.order).all()
    return steps


@app.post("/api/recommendations/{recommendation_id}/complete", response_model=RecommendationResponse)
def complete_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    """Marquer une recommandation comme terminée"""
    recommendation = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommandation non trouvée")

    recommendation.is_completed = True
    recommendation.progress = recommendation.total_steps

    # Marquer toutes les étapes comme complétées
    steps = db.query(RecommendationStep).filter(RecommendationStep.recommendation_id == recommendation_id).all()
    for step in steps:
        step.is_completed = True

    db.commit()
    db.refresh(recommendation)
    return recommendation


@app.post("/api/recommendations/{recommendation_id}/steps/{step_id}/complete", response_model=RecommendationStepResponse)
def complete_step(recommendation_id: int, step_id: int, db: Session = Depends(get_db)):
    """Compléter une étape d'une recommandation"""
    recommendation = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommandation non trouvée")

    step = db.query(RecommendationStep).filter(
        RecommendationStep.id == step_id,
        RecommendationStep.recommendation_id == recommendation_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Étape non trouvée")

    step.is_completed = True
    db.commit()

    # Mettre à jour le progrès de la recommandation
    steps = db.query(RecommendationStep).filter(RecommendationStep.recommendation_id == recommendation_id).all()
    completed_count = sum(1 for s in steps if s.is_completed)
    recommendation.progress = completed_count

    if completed_count >= recommendation.total_steps:
        recommendation.is_completed = True

    db.commit()
    db.refresh(step)
    return step


# ==================== PLATFORM CONNECTIONS ====================

@app.get("/api/restaurants/{restaurant_id}/connections", response_model=List[PlatformConnectionResponse])
def list_connections(restaurant_id: int, db: Session = Depends(get_db)):
    """Liste des connexions de plateformes pour un restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    connections = db.query(PlatformConnection).filter(
        PlatformConnection.restaurant_id == restaurant_id
    ).all()
    return connections


@app.post("/api/restaurants/{restaurant_id}/connections", response_model=PlatformConnectionResponse)
def create_connection(restaurant_id: int, connection: PlatformConnectionCreate, db: Session = Depends(get_db)):
    """Ajouter une connexion de plateforme pour un restaurant"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    # Vérifier si une connexion pour cette plateforme existe déjà
    existing = db.query(PlatformConnection).filter(
        PlatformConnection.restaurant_id == restaurant_id,
        PlatformConnection.platform_name == connection.platform_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Connexion {connection.platform_name} déjà existante")

    db_connection = PlatformConnection(
        restaurant_id=restaurant_id,
        platform_name=connection.platform_name,
        api_key=connection.api_key,
        place_id=connection.place_id,
        is_active=True,
        reviews_count=0,
        avg_rating=0.0
    )
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    return db_connection


@app.delete("/api/connections/{connection_id}")
def delete_connection(connection_id: int, db: Session = Depends(get_db)):
    """Supprimer une connexion de plateforme"""
    connection = db.query(PlatformConnection).filter(PlatformConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connexion non trouvée")

    db.delete(connection)
    db.commit()
    return {"message": "Connexion supprimée", "id": connection_id}


@app.post("/api/connections/{connection_id}/sync", response_model=PlatformConnectionResponse)
def sync_connection(connection_id: int, db: Session = Depends(get_db)):
    """Synchroniser une connexion de plateforme"""
    from datetime import datetime
    import random

    connection = db.query(PlatformConnection).filter(PlatformConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connexion non trouvée")

    # Simuler une synchronisation (en production, appeler l'API de la plateforme)
    connection.last_sync = datetime.utcnow()
    connection.reviews_count += random.randint(1, 5)
    connection.avg_rating = round(random.uniform(3.5, 4.8), 1)

    db.commit()
    db.refresh(connection)
    return connection


# ==================== PLATFORMS ====================

@app.get("/api/platforms")
def list_platforms(db: Session = Depends(get_db)):
    """Liste les plateformes disponibles"""
    return [
        {"id": "google", "name": "Google Business", "icon": "🔍", "type": "oauth"},
        {"id": "facebook", "name": "Facebook Pages", "icon": "📘", "type": "oauth"},
        {"id": "tripadvisor", "name": "TripAdvisor", "icon": "🦉", "type": "url"},
        {"id": "yelp", "name": "Yelp", "icon": "⭐", "type": "url"}
    ]


@app.get("/api/platforms/{platform_id}/connect")
def connect_platform(platform_id: str, db: Session = Depends(get_db)):
    """Génère l'URL OAuth pour la plateforme"""
    if platform_id == "google":
        # Google OAuth URL
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        redirect_uri = "http://localhost:8000/api/platforms/google/callback"
        scope = "https://www.googleapis.com/auth/business.manage"
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&access_type=offline&prompt=consent"
        return {"auth_url": auth_url}

    elif platform_id == "facebook":
        # Facebook OAuth URL
        client_id = os.getenv("FACEBOOK_APP_ID")
        redirect_uri = "http://localhost:8000/api/platforms/facebook/callback"
        scope = "pages_show_list,pages_read_engagement"
        auth_url = f"https://www.facebook.com/v19.0/dialog/oauth?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&response_type=code"
        return {"auth_url": auth_url}

    else:
        raise HTTPException(status_code=400, detail="Plateforme non supportée")


@app.get("/api/platforms/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    """Callback OAuth Google"""
    # TODO: Échanger le code contre un token
    # Pour l'instant, on simule une connexion réussie
    return {"status": "connected", "platform": "google"}


@app.get("/api/platforms/facebook/callback")
def facebook_callback(code: str, db: Session = Depends(get_db)):
    """Callback OAuth Facebook"""
    # TODO: Échanger le code contre un token
    return {"status": "connected", "platform": "facebook"}


# ==================== GOOGLE BUSINESS PROFILE OAUTH ====================

@app.get("/api/oauth/gbp/url")
def get_gbp_oauth_url(state: str = "default"):
    """
    Génère l'URL d'autorisation OAuth pour Google Business Profile.

    Scopes requis:
    - business.manage: Gérer les établissements
    - plus.business.login: Accès aux avis
    """
    if not gbp_oauth.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Google Business Profile OAuth non configuré. Ajoutez GBP_CLIENT_ID et GBP_CLIENT_SECRET au .env"
        )

    try:
        auth_url = gbp_oauth.get_authorization_url(state=state)
        return {"auth_url": auth_url, "provider": "google_business_profile"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/oauth/gbp/callback")
def gbp_oauth_callback(code: str, state: str = "default", db: Session = Depends(get_db)):
    """
    Callback OAuth Google Business Profile.

    Échange le code d'autorisation contre un token d'accès.
    """
    if not gbp_oauth.is_configured():
        raise HTTPException(status_code=500, detail="GBP OAuth non configuré")

    try:
        # Échanger le code contre un token
        token = gbp_oauth.exchange_code(code)

        # Récupérer les comptes Business accessibles
        accounts = gbp_oauth.get_accounts(token.access_token)

        return {
            "status": "connected",
            "platform": "google_business_profile",
            "access_token": token.access_token,
            "refresh_token": token.refresh_token,
            "expires_at": token.expires_at.isoformat(),
            "accounts": accounts,
            "accounts_count": len(accounts)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur OAuth GBP: {str(e)}")


@app.get("/api/oauth/gbp/locations")
def get_gbp_locations(access_token: str, account_name: str):
    """
    Récupère les établissements d'un compte Google Business Profile.

    Args:
        access_token: Token d'accès OAuth
        account_name: Nom du compte (ex: "accounts/123456")
    """
    try:
        locations = gbp_oauth.get_locations(access_token, account_name)
        return {
            "locations": [
                {
                    "name": loc.name,
                    "title": loc.title,
                    "address": loc.address,
                    "phone_number": loc.phone_number,
                    "website_uri": loc.website_uri,
                    "location_key": loc.location_key
                }
                for loc in locations
            ],
            "count": len(locations)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/oauth/gbp/reviews")
def get_gbp_reviews(access_token: str, location_name: str, page_size: int = 50):
    """
    Récupère les avis d'un établissement Google Business Profile.

    Args:
        access_token: Token d'accès OAuth
        location_name: Nom de l'établissement (ex: "locations/123456")
        page_size: Nombre d'avis par page (max 200)
    """
    try:
        reviews = gbp_oauth.get_reviews(access_token, location_name, page_size)
        return {
            "reviews": [
                {
                    "review_id": rev.review_id,
                    "reviewer": rev.reviewer,
                    "rating": rev.rating,
                    "comment": rev.comment,
                    "create_time": rev.create_time.isoformat(),
                    "update_time": rev.update_time.isoformat() if rev.update_time else None,
                    "reply": rev.reply
                }
                for rev in reviews
            ],
            "count": len(reviews)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/oauth/gbp/rating")
def get_gbp_rating(access_token: str, location_name: str):
    """
    Récupère la note moyenne et le nombre d'avis d'un établissement.

    Args:
        access_token: Token d'accès OAuth
        location_name: Nom de l'établissement
    """
    try:
        rating_data = gbp_oauth.get_average_rating(access_token, location_name)
        return rating_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/oauth/gbp/refresh")
def refresh_gbp_token(refresh_token: str):
    """
    Rafraîchit le token d'accès Google Business Profile.

    Args:
        refresh_token: Token de rafraîchissement
    """
    if not gbp_oauth.is_configured():
        raise HTTPException(status_code=500, detail="GBP OAuth non configuré")

    try:
        token = gbp_oauth.refresh_token(refresh_token)
        return {
            "access_token": token.access_token,
            "expires_at": token.expires_at.isoformat(),
            "token_type": token.token_type
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== FACEBOOK PAGES OAUTH ====================

@app.get("/api/oauth/facebook/url")
def get_facebook_oauth_url(state: str = "default"):
    """
    Génère l'URL d'autorisation OAuth pour Facebook Pages.

    Scopes requis:
    - pages_show_list: Voir les pages gérées
    - pages_read_engagement: Lire les avis et notes
    - pages_read_user_content: Lire le contenu utilisateur
    """
    if not facebook_oauth.is_configured():
        raise HTTPException(
            status_code=500,
            detail="Facebook OAuth non configuré. Ajoutez FACEBOOK_APP_ID et FACEBOOK_APP_SECRET au .env"
        )

    try:
        auth_url = facebook_oauth.get_authorization_url(state=state)
        return {"auth_url": auth_url, "provider": "facebook_pages"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/oauth/facebook/callback")
def facebook_oauth_callback(code: str, state: str = "default", db: Session = Depends(get_db)):
    """
    Callback OAuth Facebook Pages.

    Échange le code d'autorisation contre un token d'accès.
    """
    if not facebook_oauth.is_configured():
        raise HTTPException(status_code=500, detail="Facebook OAuth non configuré")

    try:
        # Échanger le code contre un token court
        short_token = facebook_oauth.exchange_code(code)

        # Obtenir un token long durée (60 jours)
        long_token = facebook_oauth.get_long_lived_token(short_token.access_token)

        # Récupérer les pages de l'utilisateur
        pages = facebook_oauth.get_user_pages(long_token.access_token)

        return {
            "status": "connected",
            "platform": "facebook_pages",
            "access_token": long_token.access_token,
            "expires_at": long_token.expires_at.isoformat(),
            "pages": [
                {
                    "page_id": page.page_id,
                    "name": page.name,
                    "category": page.category,
                    "fan_count": page.fan_count,
                    "overall_star_rating": page.overall_star_rating,
                    "rating_count": page.rating_count,
                    "picture_url": page.picture_url,
                }
                for page in pages
            ],
            "pages_count": len(pages)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur OAuth Facebook: {str(e)}")


@app.get("/api/oauth/facebook/pages")
def get_facebook_pages(access_token: str):
    """
    Récupère les pages Facebook de l'utilisateur.

    Args:
        access_token: Token d'accès utilisateur
    """
    try:
        pages = facebook_oauth.get_user_pages(access_token)
        return {
            "pages": [
                {
                    "page_id": page.page_id,
                    "name": page.name,
                    "category": page.category,
                    "access_token": page.access_token,  # Token spécifique à la page
                    "fan_count": page.fan_count,
                    "overall_star_rating": page.overall_star_rating,
                    "rating_count": page.rating_count,
                }
                for page in pages
            ],
            "count": len(pages)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/oauth/facebook/reviews")
def get_facebook_reviews(page_access_token: str, page_id: str, limit: int = 25):
    """
    Récupère les avis d'une page Facebook.

    Args:
        page_access_token: Token d'accès de la page
        page_id: ID de la page Facebook
        limit: Nombre d'avis (max 100)
    """
    try:
        reviews = facebook_oauth.get_page_reviews(page_access_token, page_id, limit)
        return {
            "reviews": [
                {
                    "review_id": rev.review_id,
                    "reviewer_name": rev.reviewer_name,
                    "reviewer_id": rev.reviewer_id,
                    "rating": rev.rating,
                    "review_text": rev.review_text,
                    "created_time": rev.created_time.isoformat(),
                    "recommendation_type": rev.recommendation_type,
                }
                for rev in reviews
            ],
            "count": len(reviews)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/oauth/facebook/ratings")
def get_facebook_ratings(page_access_token: str, page_id: str):
    """
    Récupère le résumé des notes d'une page Facebook.

    Args:
        page_access_token: Token d'accès de la page
        page_id: ID de la page
    """
    try:
        ratings = facebook_oauth.get_page_ratings_summary(page_access_token, page_id)
        return ratings
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/oauth/facebook/debug")
def debug_facebook_token(access_token: str):
    """
    Debug un token Facebook pour voir ses informations.

    Args:
        access_token: Token à analyser
    """
    try:
        debug_info = facebook_oauth.debug_token(access_token)
        return debug_info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== CLAUDE SENTIMENT ANALYSIS ====================

@app.post("/api/sentiment/analyze")
def analyze_sentiment(text: str, context: str = None, detailed: bool = True):
    """
    Analyse le sentiment d'un texte avec Claude API.

    Args:
        text: Texte de l'avis à analyser
        context: Contexte additionnel (nom restaurant, type cuisine)
        detailed: Si True, inclut topics, issues, suggestions
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Texte vide")

    try:
        result = claude_analyzer.analyze(text, context, detailed)
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sentiment/analyze-batch")
def analyze_sentiment_batch(reviews: List[str], context: str = None):
    """
    Analyse plusieurs avis en batch.

    Args:
        reviews: Liste des textes d'avis
        context: Contexte additionnel
    """
    if not reviews:
        raise HTTPException(status_code=400, detail="Liste d'avis vide")

    try:
        results = claude_analyzer.analyze_batch(reviews, context)
        return {
            "results": [r.to_dict() for r in results],
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/restaurants/{restaurant_id}/sentiment-aggregate")
def get_aggregate_sentiment(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Obtient un résumé agrégé des sentiments pour un restaurant.

    Utilise Claude API pour une analyse approfondie.
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).all()

    if not reviews:
        return {"error": "Aucun avis à analyser"}

    # Récupérer les textes
    review_texts = [r.text for r in reviews if r.text]

    if not review_texts:
        return {"error": "Aucun texte d'avis disponible"}

    try:
        aggregate = claude_analyzer.get_aggregate_sentiment(review_texts, restaurant.name)

        # Ajouter les stats de la DB
        aggregate["db_stats"] = {
            "total_reviews_in_db": len(reviews),
            "reviews_with_text": len(review_texts),
            "average_rating": round(sum(r.rating for r in reviews) / len(reviews), 2) if reviews else 0,
        }

        return aggregate
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sentiment/status")
def get_sentiment_status():
    """Vérifie le statut de l'analyseur de sentiment."""
    return {
        "claude_api_configured": claude_analyzer.is_configured(),
        "model": claude_analyzer.model,
        "fallback_available": True
    }


# ==================== SYNC SCHEDULER ====================

@app.post("/api/sync/start")
def start_sync():
    """Démarre le planificateur de synchronisation."""
    try:
        start_sync_scheduler()
        return {"status": "started", "jobs": sync_scheduler.get_jobs_info()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sync/stop")
def stop_sync():
    """Arrête le planificateur de synchronisation."""
    try:
        stop_sync_scheduler()
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync/jobs")
def get_sync_jobs():
    """Liste les jobs de synchronisation planifiés."""
    return {"jobs": sync_scheduler.get_jobs_info()}


@app.post("/api/sync/restaurant/{restaurant_id}")
def sync_restaurant_now(restaurant_id: int, platforms: List[str] = None, db: Session = Depends(get_db)):
    """
    Synchronise immédiatement les avis d'un restaurant.

    Args:
        restaurant_id: ID du restaurant
        platforms: Liste des plateformes à synchroniser (None = toutes)
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    try:
        results = sync_scheduler.sync_restaurant_reviews(restaurant_id, platforms)
        return {
            "restaurant_id": restaurant_id,
            "results": [
                {
                    "platform": r.platform,
                    "status": r.status.value,
                    "new_reviews": r.new_reviews,
                    "updated_reviews": r.updated_reviews,
                    "total_reviews": r.total_reviews,
                    "error_message": r.error_message,
                }
                for r in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sync/restaurant/{restaurant_id}/schedule")
def schedule_restaurant_sync(
    restaurant_id: int,
    interval_minutes: int = 60,
    platforms: List[str] = None,
    db: Session = Depends(get_db)
):
    """
    Planifie la synchronisation automatique d'un restaurant.

    Args:
        restaurant_id: ID du restaurant
        interval_minutes: Intervalle en minutes (défaut: 60)
        platforms: Liste des plateformes (None = toutes)
    """
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    try:
        sync_scheduler.add_restaurant_sync_job(restaurant_id, interval_minutes, platforms)
        return {
            "status": "scheduled",
            "restaurant_id": restaurant_id,
            "interval_minutes": interval_minutes,
            "platforms": platforms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sync/restaurant/{restaurant_id}/schedule")
def unschedule_restaurant_sync(restaurant_id: int):
    """Supprime la planification de synchronisation d'un restaurant."""
    try:
        sync_scheduler.remove_restaurant_sync_job(restaurant_id)
        return {"status": "unscheduled", "restaurant_id": restaurant_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/platforms/{platform_id}/connect-url")
def connect_url_platform(platform_id: str, url: str, db: Session = Depends(get_db)):
    """Connecte une plateforme basée sur URL (TripAdvisor, Yelp)"""
    if platform_id not in ["tripadvisor", "yelp"]:
        raise HTTPException(status_code=400, detail="Cette plateforme utilise OAuth")

    # Valider l'URL
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="URL invalide")

    # TODO: Sauvegarder en base de données
    return {"status": "connected", "platform": platform_id, "url": url}


@app.get("/api/users/{user_id}/connections")
def list_user_connections(user_id: int, db: Session = Depends(get_db)):
    """Liste les connexions de l'utilisateur"""
    connections = db.query(ConnectedPlatform).filter(ConnectedPlatform.user_id == user_id).all()
    return connections


@app.delete("/api/connections/{connection_id}")
def disconnect_platform(connection_id: int, db: Session = Depends(get_db)):
    """Déconnecte une plateforme"""
    connection = db.query(ConnectedPlatform).filter(ConnectedPlatform.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connexion non trouvée")
    db.delete(connection)
    db.commit()
    return {"status": "disconnected"}


# ==================== DEMO DATA ====================

@app.post("/api/seed-demo")
def seed_demo_data(db: Session = Depends(get_db)):
    """Créer des données de démonstration"""
    from datetime import datetime, timedelta
    import random

    # Vérifier si déjà peuplé
    if db.query(Restaurant).count() > 0:
        return {"message": "Demo data already exists", "restaurants": db.query(Restaurant).count()}

    # Restaurant 1: Le Petit Bistrot
    r1 = Restaurant(
        name="Le Petit Bistrot",
        address="12 Rue de la Paix, Paris 75002",
        email_alert="owner@petitbistrot.fr"
    )
    db.add(r1)
    db.commit()
    db.refresh(r1)

    # Avis pour Le Petit Bistrot
    reviews_r1 = [
        {"author": "Marie D.", "rating": 5, "text": "Excellent repas ! Le service était impeccable et les produits frais. Je recommande vivement.", "sentiment": "positive", "score": 0.85},
        {"author": "Jean P.", "rating": 4, "text": "Très bonne cuisine française classique. Un peu bruyant le soir mais ambiance sympa.", "sentiment": "positive", "score": 0.62},
        {"author": "Sophie L.", "rating": 2, "text": "Déçu par mon expérience... plat froid et serveur désagréable. Prix trop élevé pour la qualité.", "sentiment": "negative", "score": -0.75},
        {"author": "Thomas R.", "rating": 5, "text": "Le meilleur bistro du quartier ! Escargots et coq au vin parfaits.", "sentiment": "positive", "score": 0.91},
        {"author": "Claire M.", "rating": 4, "text": "Bonne adresse, cadre chaleureux. Manque un peu de choix pour les végétariens.", "sentiment": "positive", "score": 0.55},
        {"author": "Pierre G.", "rating": 3, "text": "Correct sans plus. Classique mais sans surprise. Service un peu lent.", "sentiment": "neutral", "score": 0.12},
        {"author": "Emma W.", "rating": 5, "text": "Magnifique découverte ! Le chef maîtrise parfaitement sa cuisine. À refaire !", "sentiment": "positive", "score": 0.88},
        {"author": "Lucas B.", "rating": 4, "text": "Très sympa pour un déjeuner d'affaires. Rapport qualité-prix correct.", "sentiment": "positive", "score": 0.58},
        {"author": "Camille D.", "rating": 2, "text": "Attente interminable malgré réservation. Déçue par l'accueil.", "sentiment": "negative", "score": -0.65},
        {"author": "Antoine F.", "rating": 5, "text": "Toujours aussi bon ! Mon adresse préférée depuis 2 ans.", "sentiment": "positive", "score": 0.92},
    ]

    for i, rv in enumerate(reviews_r1):
        review = Review(
            restaurant_id=r1.id,
            source="google",
            author=rv["author"],
            rating=rv["rating"],
            text=rv["text"],
            date=datetime.now() - timedelta(days=random.randint(1, 30)),
            sentiment=rv["sentiment"],
            sentiment_score=rv["score"]
        )
        db.add(review)

    # Restaurant 2: Sushi Express
    r2 = Restaurant(
        name="Sushi Express",
        address="45 Avenue de la République, Lyon 69003",
        email_alert="manager@sushiexpress.fr"
    )
    db.add(r2)
    db.commit()
    db.refresh(r2)

    # Avis pour Sushi Express
    reviews_r2 = [
        {"author": "Yuki T.", "rating": 5, "text": "Sushis frais et délicieux ! Le saumon fond dans la bouche. Livraison rapide.", "sentiment": "positive", "score": 0.89},
        {"author": "Marc L.", "rating": 3, "text": "Sushis corrects mais pas extraordinaires. Prix un peu élevé pour la qualité.", "sentiment": "neutral", "score": 0.08},
        {"author": "Julie R.", "rating": 4, "text": "Très bon pour un quick lunch. Les menus du midi sont bien pensés.", "sentiment": "positive", "score": 0.65},
        {"author": "Kevin H.", "rating": 2, "text": "Poisson pas très frais dans mon chirashi. Je ne recommande pas.", "sentiment": "negative", "score": -0.72},
        {"author": "Aiko M.", "rating": 5, "text": "Enfin des vrais sushis japonais ! Le chef est authentique.", "sentiment": "positive", "score": 0.94},
        {"author": "David P.", "rating": 4, "text": "Bon rapport qualité-prix. Service efficace et souriant.", "sentiment": "positive", "score": 0.61},
        {"author": "Sarah K.", "rating": 3, "text": "Moyen. Les makis étaient un peu mous, mais les tempuras étaient bons.", "sentiment": "neutral", "score": 0.15},
        {"author": "Nicolas B.", "rating": 1, "text": "Intoxication alimentaire après avoir mangé là-bas. À éviter !", "sentiment": "negative", "score": -0.95},
        {"author": "Lisa C.", "rating": 4, "text": "J'adore leurs sushis ! Seul bémol: l'attente le weekend.", "sentiment": "positive", "score": 0.67},
        {"author": "Hugo M.", "rating": 5, "text": "Le meilleur rapport qualité-prix de Lyon. Mon resto sushi préféré !", "sentiment": "positive", "score": 0.87},
    ]

    for i, rv in enumerate(reviews_r2):
        review = Review(
            restaurant_id=r2.id,
            source="google",
            author=rv["author"],
            rating=rv["rating"],
            text=rv["text"],
            date=datetime.now() - timedelta(days=random.randint(1, 30)),
            sentiment=rv["sentiment"],
            sentiment_score=rv["score"]
        )
        db.add(review)

    db.commit()

    return {
        "message": "Demo data created successfully!",
        "restaurants": 2,
        "reviews": len(reviews_r1) + len(reviews_r2)
    }


@app.post("/api/restaurants/{restaurant_id}/sync-mock")
def sync_mock_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    """Simuler une synchronisation Google Places (mock)"""
    from datetime import datetime, timedelta
    import random

    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant non trouvé")

    # Générer 3-5 nouveaux avis mockés
    new_reviews_count = random.randint(3, 5)
    names = ["Alex M.", "Sam D.", "Chris L.", "Taylor R.", "Jordan K.", "Morgan P.", "Casey B."]
    texts_positive = [
        "Super expérience, je reviendrai !",
        "Excellente découverte, cuisine raffinée.",
        "Service impeccable et produits frais.",
        "Cadre agréable et repas délicieux.",
        "Parfait pour un dîner en amoureux."
    ]
    texts_negative = [
        "Déçu par la qualité des plats.",
        "Service trop lent et inattentif.",
        "Prix excessif pour ce qui est servi.",
        "Bruit insupportable, impossible de discuter."
    ]
    texts_neutral = [
        "Correct sans plus, classique.",
        "Bon mais sans surprise particulière.",
        "Peut mieux faire sur certains points."
    ]

    for i in range(new_reviews_count):
        # Générer sentiment aléatoire avec biais positif
        rand = random.random()
        if rand > 0.3:
            text = random.choice(texts_positive)
            sentiment, score = "positive", random.uniform(0.5, 0.95)
            rating = random.choice([4, 5])
        elif rand > 0.1:
            text = random.choice(texts_neutral)
            sentiment, score = "neutral", random.uniform(-0.1, 0.3)
            rating = 3
        else:
            text = random.choice(texts_negative)
            sentiment, score = "negative", random.uniform(-0.9, -0.4)
            rating = random.choice([1, 2])

        review = Review(
            restaurant_id=restaurant_id,
            source="google",
            author=random.choice(names),
            rating=rating,
            text=text,
            date=datetime.now() - timedelta(days=random.randint(0, 7)),
            sentiment=sentiment,
            sentiment_score=score
        )
        db.add(review)

    db.commit()

    return {
        "message": f"Synchronisation simulée: {new_reviews_count} nouveaux avis",
        "new_reviews": new_reviews_count,
        "restaurant": restaurant.name
    }


@app.post("/api/seed-demo-recommendations")
def seed_demo_recommendations(db: Session = Depends(get_db)):
    """Créer des données de démonstration pour les recommandations et connexions"""
    from datetime import datetime, timedelta

    # Vérifier si le restaurant 1 existe
    restaurant = db.query(Restaurant).filter(Restaurant.id == 1).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant avec ID 1 non trouvé. Exécutez d'abord /api/seed-demo")

    # Vérifier si des recommandations existent déjà
    existing_recs = db.query(Recommendation).filter(Recommendation.restaurant_id == 1).count()
    if existing_recs > 0:
        return {"message": "Les recommandations de démo existent déjà", "count": existing_recs}

    # Créer 5 recommandations avec étapes
    recommendations_data = [
        {
            "priority": "urgent",
            "category": "Service",
            "title": "Améliorer la rapidité du service",
            "description": "Les avis mentionnent fréquemment des temps d'attente trop longs. Mettre en place des actions pour accélérer le service.",
            "source": "Analyse des avis négatifs - Décembre 2024",
            "total_steps": 4,
            "steps": [
                {"title": "Analyser les pics d'affluence", "description": "Identifier les créneaux horaires où le service est le plus lent", "order": 1},
                {"title": "Former le personnel", "description": "Organiser une formation sur l'efficacité du service", "order": 2},
                {"title": "Optimiser la cuisine", "description": "Revoir l'organisation en cuisine pour réduire les temps de préparation", "order": 3},
                {"title": "Mesurer les améliorations", "description": "Suivre les temps de service sur 2 semaines", "order": 4}
            ]
        },
        {
            "priority": "high",
            "category": "Menu",
            "title": "Ajouter des options végétariennes",
            "description": "Plusieurs clients regrettent le manque de choix pour les végétariens. Enrichir la carte avec des plats créatifs.",
            "source": "Feedback clients - Commentaires récurrents",
            "total_steps": 4,
            "steps": [
                {"title": "Étudier la concurrence", "description": "Analyser les menus végétariens des restaurants similaires", "order": 1},
                {"title": "Développer 3 nouveaux plats", "description": "Créer des recettes végétariennes authentiques", "order": 2},
                {"title": "Tester avec des clients", "description": "Organiser une dégustation avec un panel de clients", "order": 3},
                {"title": "Lancer sur la carte", "description": "Intégrer les nouveaux plats au menu", "order": 4}
            ]
        },
        {
            "priority": "medium",
            "category": "Ambiance",
            "title": "Réduire le niveau sonore",
            "description": "Le bruit est mentionné comme point négatif. Installer des solutions d'absorption acoustique.",
            "source": "Avis Google - 15 mentions",
            "total_steps": 4,
            "steps": [
                {"title": "Faire un diagnostic acoustique", "description": "Mesurer le niveau sonore et identifier les sources", "order": 1},
                {"title": "Choisir des solutions", "description": "Sélectionner des panneaux acoustiques décoratifs", "order": 2},
                {"title": "Installer les équipements", "description": "Mettre en place les solutions acoustiques", "order": 3},
                {"title": "Évaluer l'impact", "description": "Mesurer l'amélioration et recueillir les avis clients", "order": 4}
            ]
        },
        {
            "priority": "medium",
            "category": "Service",
            "title": "Personnaliser l'accueil client",
            "description": "Améliorer l'expérience d'accueil pour fidéliser la clientèle. Former les serveurs à la personnalisation.",
            "source": "Benchmark concurrence",
            "total_steps": 4,
            "steps": [
                {"title": "Créer un guide d'accueil", "description": "Définir les standards d'accueil personnalisé", "order": 1},
                {"title": "Former l'équipe", "description": "Session de formation sur la personnalisation", "order": 2},
                {"title": "Mettre en place un CRM", "description": "Outil pour mémoriser les préférences clients", "order": 3},
                {"title": "Collecter les retours", "description": "Évaluer la satisfaction client post-formation", "order": 4}
            ]
        },
        {
            "priority": "low",
            "category": "Menu",
            "title": "Mettre à jour la carte des vins",
            "description": "La carte des vins n'a pas été mise à jour depuis 2 ans. Proposer de nouveaux vins en accord avec les plats.",
            "source": "Revue annuelle du menu",
            "total_steps": 4,
            "steps": [
                {"title": "Auditer la carte actuelle", "description": "Analyser les ventes et identifier les vins peu vendus", "order": 1},
                {"title": "Sélectionner de nouveaux vins", "description": "Déguster et choisir 10 nouvelles références", "order": 2},
                {"title": "Former l'équipe aux accords", "description": "Apprendre les associations mets-vins", "order": 3},
                {"title": "Lancer la nouvelle carte", "description": "Imprimer et présenter la nouvelle carte", "order": 4}
            ]
        }
    ]

    created_recommendations = 0
    created_steps = 0

    for rec_data in recommendations_data:
        db_rec = Recommendation(
            restaurant_id=1,
            priority=rec_data["priority"],
            category=rec_data["category"],
            title=rec_data["title"],
            description=rec_data["description"],
            source=rec_data["source"],
            total_steps=rec_data["total_steps"],
            progress=0,
            is_completed=False
        )
        db.add(db_rec)
        db.commit()
        db.refresh(db_rec)
        created_recommendations += 1

        for step_data in rec_data["steps"]:
            db_step = RecommendationStep(
                recommendation_id=db_rec.id,
                title=step_data["title"],
                description=step_data["description"],
                order=step_data["order"],
                is_completed=False
            )
            db.add(db_step)
            created_steps += 1

    db.commit()

    # Créer 4 connexions de plateformes
    connections_data = [
        {
            "platform_name": "google",
            "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
            "reviews_count": 156,
            "avg_rating": 4.2
        },
        {
            "platform_name": "tripadvisor",
            "place_id": "d123456789",
            "reviews_count": 89,
            "avg_rating": 4.0
        },
        {
            "platform_name": "yelp",
            "place_id": "WavvLdfdP6g8aZTtbBQHTw",
            "reviews_count": 42,
            "avg_rating": 3.8
        },
        {
            "platform_name": "facebook",
            "place_id": "123456789012345",
            "reviews_count": 67,
            "avg_rating": 4.4
        }
    ]

    created_connections = 0
    for conn_data in connections_data:
        # Vérifier si la connexion existe déjà
        existing = db.query(PlatformConnection).filter(
            PlatformConnection.restaurant_id == 1,
            PlatformConnection.platform_name == conn_data["platform_name"]
        ).first()

        if not existing:
            db_conn = PlatformConnection(
                restaurant_id=1,
                platform_name=conn_data["platform_name"],
                place_id=conn_data["place_id"],
                is_active=True,
                last_sync=datetime.utcnow() - timedelta(hours=2),
                reviews_count=conn_data["reviews_count"],
                avg_rating=conn_data["avg_rating"]
            )
            db.add(db_conn)
            created_connections += 1

    db.commit()

    return {
        "message": "Données de démo créées avec succès!",
        "recommendations": created_recommendations,
        "steps": created_steps,
        "connections": created_connections
    }


# ==================== SAVE OAUTH CONNECTION ====================

@app.post("/api/oauth/save-connection")
def save_oauth_connection(
    platform: str,
    access_token: str,
    refresh_token: str = None,
    expires_at: str = None,
    location_name: str = None,
    location_title: str = None,
    location_address: str = None,
    token: str = None,
    db: Session = Depends(get_db)
):
    """
    Sauvegarde une connexion OAuth après autorisation.

    Crée automatiquement un restaurant si aucun n'existe pour l'utilisateur.
    """
    # Récupérer l'utilisateur
    user_id = get_current_user_id(token, db)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

    # Vérifier si l'utilisateur a déjà un restaurant
    restaurant = db.query(Restaurant).filter(Restaurant.user_id == user_id).first()

    if not restaurant:
        # Créer un restaurant avec les infos de l'établissement
        restaurant = Restaurant(
            user_id=user_id,
            name=location_title or "Mon Établissement",
            address=location_address or "",
            google_place_id=location_name
        )
        db.add(restaurant)
        db.commit()
        db.refresh(restaurant)

    # Vérifier si une connexion existe déjà pour cette plateforme
    existing = db.query(ConnectedPlatform).filter(
        ConnectedPlatform.user_id == user_id,
        ConnectedPlatform.platform == platform
    ).first()

    if existing:
        # Mettre à jour la connexion existante
        existing.encrypted_access_token = access_token
        if refresh_token:
            existing.encrypted_refresh_token = refresh_token
        if expires_at:
            from datetime import datetime
            existing.token_expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        existing.restaurant_id = restaurant.id
        existing.status = "active"
        existing.last_sync_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {"status": "updated", "connection_id": existing.id, "restaurant_id": restaurant.id}

    # Créer une nouvelle connexion
    from datetime import datetime
    new_connection = ConnectedPlatform(
        user_id=user_id,
        restaurant_id=restaurant.id,
        platform=platform,
        encrypted_access_token=access_token,
        encrypted_refresh_token=refresh_token,
        token_expires_at=datetime.fromisoformat(expires_at.replace('Z', '+00:00')) if expires_at else None,
        status="active"
    )
    db.add(new_connection)
    db.commit()
    db.refresh(new_connection)

    return {
        "status": "created",
        "connection_id": new_connection.id,
        "restaurant_id": restaurant.id,
        "platform": platform
    }


# ==================== HEALTH ====================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "social-listening-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
