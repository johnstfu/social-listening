"""
Social Listening MVP - Models SQLAlchemy
========================================
Modèles de données pour SQLite
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database URL (SQLite pour simplicité)
SQLALCHEMY_DATABASE_URL = "sqlite:///./social_listening.db"

# Engine et Session
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    """Utilisateur de l'application"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    restaurants = relationship("Restaurant", back_populates="user")
    connected_platforms = relationship("ConnectedPlatform", back_populates="user")


class Restaurant(Base):
    """Restaurant monitoré"""
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    google_place_id = Column(String(255), unique=True, nullable=True)
    address = Column(String(500), nullable=True)
    email_alert = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="restaurants")
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="restaurant", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="restaurant", cascade="all, delete-orphan")
    platform_connections = relationship("PlatformConnection", back_populates="restaurant", cascade="all, delete-orphan")
    connected_platforms = relationship("ConnectedPlatform", back_populates="restaurant", cascade="all, delete-orphan")


class Review(Base):
    """Avis client"""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    source = Column(String(50), nullable=False)  # google, tripadvisor, yelp, facebook
    external_id = Column(String(255), nullable=True)  # ID externe de la plateforme
    author = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5
    text = Column(Text, nullable=True)
    date = Column(DateTime, nullable=True)
    sentiment = Column(String(20), nullable=True)  # positive, neutral, negative
    sentiment_score = Column(Float, nullable=True)  # -1 to 1
    sentiment_details = Column(Text, nullable=True)  # JSON avec détails Claude
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    restaurant = relationship("Restaurant", back_populates="reviews")


class Alert(Base):
    """Configuration d'alerte"""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # low_rating, negative_sentiment, keyword
    threshold = Column(Float, nullable=True)  # ex: rating < 2
    email = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    restaurant = relationship("Restaurant", back_populates="alerts")


class AlertLog(Base):
    """Historique des alertes envoyées"""
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), nullable=False)  # sent, failed
    error_message = Column(Text, nullable=True)


class Recommendation(Base):
    """Recommandation d'amélioration pour un restaurant"""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    priority = Column(String(20), nullable=False)  # urgent, high, medium, low
    category = Column(String(50), nullable=False)  # Service, Menu, Ambiance, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)  # Source de la recommandation
    progress = Column(Integer, default=0)  # Nombre d'étapes complétées
    total_steps = Column(Integer, default=4)  # Nombre total d'étapes
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    restaurant = relationship("Restaurant", back_populates="recommendations")
    steps = relationship("RecommendationStep", back_populates="recommendation", cascade="all, delete-orphan")


class RecommendationStep(Base):
    """Étape d'une recommandation"""
    __tablename__ = "recommendation_steps"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    order = Column(Integer, nullable=False)  # Ordre de l'étape

    # Relations
    recommendation = relationship("Recommendation", back_populates="steps")


class PlatformConnection(Base):
    """Connexion à une plateforme d'avis"""
    __tablename__ = "platform_connections"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    platform_name = Column(String(50), nullable=False)  # google, tripadvisor, yelp, facebook
    api_key = Column(String(500), nullable=True)  # Chiffré en production
    place_id = Column(String(255), nullable=True)  # ID du lieu sur la plateforme
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    reviews_count = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)

    # Relations
    restaurant = relationship("Restaurant", back_populates="platform_connections")


class ConnectedPlatform(Base):
    """Plateforme connectée par l'utilisateur (OAuth ou URL-based)"""
    __tablename__ = "connected_platforms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)

    platform = Column(String(50), nullable=False)  # 'google', 'facebook', 'tripadvisor', 'yelp'

    # OAuth tokens (Google, Facebook)
    encrypted_access_token = Column(Text, nullable=True)
    encrypted_refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)

    # URL-based (TripAdvisor, Yelp)
    platform_url = Column(Text, nullable=True)
    platform_business_id = Column(String(255), nullable=True)

    status = Column(String(20), default="active")  # 'active', 'expired'
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    user = relationship("User", back_populates="connected_platforms")
    restaurant = relationship("Restaurant", back_populates="connected_platforms")
