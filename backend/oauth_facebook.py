"""
Facebook Pages OAuth Integration.

Ce module gère l'authentification OAuth2 avec l'API Facebook Graph
pour récupérer les avis et informations des pages Facebook.
"""

import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass


# Configuration OAuth
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")
FACEBOOK_REDIRECT_URI = os.getenv("FACEBOOK_REDIRECT_URI", "http://localhost:3000/oauth/facebook/callback")

# Scopes requis pour Facebook Pages
FACEBOOK_SCOPES = [
    "pages_show_list",           # Voir les pages gérées
    "pages_read_engagement",     # Lire les avis et notes
    "pages_read_user_content",   # Lire le contenu utilisateur
    "business_management",       # Gestion business (optionnel)
]

# Version de l'API Facebook Graph
FACEBOOK_API_VERSION = "v19.0"


@dataclass
class FacebookToken:
    """Token OAuth Facebook."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 5184000  # ~60 jours par défaut
    expires_at: datetime = None
    refresh_token: Optional[str] = None  # Facebook n'utilise pas de refresh token classique

    def __post_init__(self):
        if self.expires_at is None:
            self.expires_at = datetime.utcnow() + timedelta(seconds=self.expires_in)


@dataclass
class FacebookPage:
    """Page Facebook."""
    page_id: str
    name: str
    category: str
    access_token: str  # Token spécifique à la page
    picture_url: Optional[str] = None
    fan_count: int = 0
    overall_star_rating: float = 0.0
    rating_count: int = 0


@dataclass
class FacebookReview:
    """Avis Facebook."""
    review_id: str
    reviewer_name: str
    reviewer_id: Optional[str]
    rating: int  # 1-5
    review_text: Optional[str]
    created_time: datetime
    recommendation_type: Optional[str] = None  # "positive" ou "negative"


class FacebookPagesOAuth:
    """Gestion OAuth Facebook Pages."""

    def __init__(self, app_id: str = None, app_secret: str = None, redirect_uri: str = None):
        self.app_id = app_id or FACEBOOK_APP_ID
        self.app_secret = app_secret or FACEBOOK_APP_SECRET
        self.redirect_uri = redirect_uri or FACEBOOK_REDIRECT_URI
        self.api_version = FACEBOOK_API_VERSION

    def is_configured(self) -> bool:
        """Vérifie si l'OAuth est configuré."""
        return bool(self.app_id and self.app_secret)

    def get_authorization_url(self, state: str = "default") -> str:
        """
        Génère l'URL d'autorisation OAuth.

        Args:
            state: Paramètre state pour la sécurité CSRF

        Returns:
            URL d'autorisation à ouvrir dans le navigateur
        """
        if not self.is_configured():
            raise ValueError("Facebook OAuth non configuré")

        scope = ",".join(FACEBOOK_SCOPES)
        return (
            f"https://www.facebook.com/{self.api_version}/dialog/oauth?"
            f"client_id={self.app_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"scope={scope}&"
            f"response_type=code&"
            f"state={state}"
        )

    def exchange_code(self, code: str) -> FacebookToken:
        """
        Échange le code d'autorisation contre un token.

        Args:
            code: Code d'autorisation reçu du callback

        Returns:
            FacebookToken avec access_token
        """
        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/oauth/access_token",
            params={
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "redirect_uri": self.redirect_uri,
                "code": code,
            }
        )

        if response.status_code != 200:
            raise Exception(f"Token exchange failed: {response.text}")

        data = response.json()

        return FacebookToken(
            access_token=data["access_token"],
            token_type=data.get("token_type", "Bearer"),
            expires_in=data.get("expires_in", 5184000),
        )

    def get_long_lived_token(self, short_lived_token: str) -> FacebookToken:
        """
        Convertit un token court en token long (60 jours).

        Args:
            short_lived_token: Token court durée

        Returns:
            FacebookToken long durée
        """
        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": self.app_id,
                "client_secret": self.app_secret,
                "fb_exchange_token": short_lived_token,
            }
        )

        if response.status_code != 200:
            raise Exception(f"Long-lived token exchange failed: {response.text}")

        data = response.json()

        return FacebookToken(
            access_token=data["access_token"],
            token_type=data.get("token_type", "Bearer"),
            expires_in=data.get("expires_in", 5184000),
        )

    def get_user_pages(self, user_access_token: str) -> List[FacebookPage]:
        """
        Récupère les pages Facebook de l'utilisateur.

        Args:
            user_access_token: Token d'accès utilisateur

        Returns:
            Liste des pages avec leurs tokens d'accès
        """
        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/me/accounts",
            params={
                "access_token": user_access_token,
                "fields": "id,name,category,picture,fan_count,overall_star_rating,rating_count,access_token"
            }
        )

        if response.status_code != 200:
            raise Exception(f"Get pages failed: {response.text}")

        pages = []
        for page_data in response.json().get("data", []):
            picture_url = None
            if "picture" in page_data and "data" in page_data["picture"]:
                picture_url = page_data["picture"]["data"].get("url")

            pages.append(FacebookPage(
                page_id=page_data["id"],
                name=page_data["name"],
                category=page_data.get("category", ""),
                access_token=page_data["access_token"],
                picture_url=picture_url,
                fan_count=page_data.get("fan_count", 0),
                overall_star_rating=page_data.get("overall_star_rating", 0.0),
                rating_count=page_data.get("rating_count", 0),
            ))

        return pages

    def get_page_info(self, page_access_token: str, page_id: str) -> Dict:
        """
        Récupère les informations d'une page.

        Args:
            page_access_token: Token d'accès de la page
            page_id: ID de la page

        Returns:
            Informations de la page
        """
        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/{page_id}",
            params={
                "access_token": page_access_token,
                "fields": "id,name,category,about,description,phone,emails,website,single_line_address,location,rating_count,overall_star_rating"
            }
        )

        if response.status_code != 200:
            raise Exception(f"Get page info failed: {response.text}")

        return response.json()

    def get_page_reviews(
        self,
        page_access_token: str,
        page_id: str,
        limit: int = 25,
        after: str = None
    ) -> List[FacebookReview]:
        """
        Récupère les avis/ratings d'une page Facebook.

        Args:
            page_access_token: Token d'accès de la page
            page_id: ID de la page
            limit: Nombre d'avis par page (max 100)
            after: Curseur pour la pagination

        Returns:
            Liste des avis
        """
        params = {
            "access_token": page_access_token,
            "fields": "reviewer{id,name},rating,review_text,created_time,recommendation_type",
            "limit": min(limit, 100),
        }
        if after:
            params["after"] = after

        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/{page_id}/ratings",
            params=params
        )

        if response.status_code != 200:
            # L'API peut retourner une erreur si la page n'a pas de ratings
            if "rating_count" in response.text:
                return []
            raise Exception(f"Get reviews failed: {response.text}")

        reviews = []
        data = response.json()

        for rev in data.get("data", []):
            reviewer = rev.get("reviewer", {})
            created_time = rev.get("created_time")

            reviews.append(FacebookReview(
                review_id=rev.get("id", ""),
                reviewer_name=reviewer.get("name", "Anonyme"),
                reviewer_id=reviewer.get("id"),
                rating=rev.get("rating", 0),
                review_text=rev.get("review_text"),
                created_time=datetime.fromisoformat(created_time.replace("Z", "+00:00")) if created_time else datetime.utcnow(),
                recommendation_type=rev.get("recommendation_type"),
            ))

        return reviews

    def get_page_ratings_summary(self, page_access_token: str, page_id: str) -> Dict:
        """
        Récupère le résumé des notes d'une page.

        Args:
            page_access_token: Token d'accès de la page
            page_id: ID de la page

        Returns:
            Dict avec overall_star_rating et rating_count
        """
        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/{page_id}",
            params={
                "access_token": page_access_token,
                "fields": "overall_star_rating,rating_count"
            }
        )

        if response.status_code != 200:
            raise Exception(f"Get ratings summary failed: {response.text}")

        data = response.json()

        return {
            "overall_star_rating": data.get("overall_star_rating", 0.0),
            "rating_count": data.get("rating_count", 0),
        }

    def debug_token(self, access_token: str) -> Dict:
        """
        Debug un token pour voir ses informations.

        Args:
            access_token: Token à debuguer

        Returns:
            Informations sur le token
        """
        response = requests.get(
            f"https://graph.facebook.com/{self.api_version}/debug_token",
            params={
                "input_token": access_token,
                "access_token": f"{self.app_id}|{self.app_secret}",  # App token
            }
        )

        if response.status_code != 200:
            raise Exception(f"Debug token failed: {response.text}")

        return response.json().get("data", {})


# Instance globale
facebook_oauth = FacebookPagesOAuth()
