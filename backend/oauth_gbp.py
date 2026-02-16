"""
Google Business Profile OAuth Integration.

Ce module gère l'authentification OAuth2 avec l'API Google Business Profile
pour récupérer les avis et informations des établissements.
"""

import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration OAuth
GBP_CLIENT_ID = os.getenv("GBP_CLIENT_ID", "")
GBP_CLIENT_SECRET = os.getenv("GBP_CLIENT_SECRET", "")
GBP_REDIRECT_URI = os.getenv("GBP_REDIRECT_URI", "http://localhost:3000/oauth/gbp/callback")

# Scopes requis pour Google Business Profile
# Note: plus.business.login est déprécié, business.manage suffit
GBP_SCOPES = [
    "https://www.googleapis.com/auth/business.manage",
]


@dataclass
class GBPToken:
    """Token OAuth Google Business Profile."""
    access_token: str
    refresh_token: str
    expires_at: datetime
    token_type: str = "Bearer"
    scope: str = ""


@dataclass
class GBPLocation:
    """Établissement Google Business Profile."""
    name: str  # Resource name: "locations/{location_id}"
    title: str  # Nom de l'établissement
    address: str
    phone_number: Optional[str] = None
    website_uri: Optional[str] = None
    location_key: Optional[str] = None  # Place ID


@dataclass
class GBPReview:
    """Avis Google Business Profile."""
    review_id: str
    reviewer: str
    rating: int  # 1-5
    comment: Optional[str]
    create_time: datetime
    update_time: Optional[datetime] = None
    reply: Optional[str] = None


class GoogleBusinessProfileOAuth:
    """Gestion OAuth Google Business Profile."""

    def __init__(self, client_id: str = None, client_secret: str = None, redirect_uri: str = None):
        self.client_id = client_id or GBP_CLIENT_ID
        self.client_secret = client_secret or GBP_CLIENT_SECRET
        self.redirect_uri = redirect_uri or GBP_REDIRECT_URI

    def is_configured(self) -> bool:
        """Vérifie si l'OAuth est configuré."""
        return bool(self.client_id and self.client_secret)

    def get_authorization_url(self, state: str = "default") -> str:
        """
        Génère l'URL d'autorisation OAuth.

        Args:
            state: Paramètre state pour la sécurité CSRF

        Returns:
            URL d'autorisation à ouvrir dans le navigateur
        """
        if not self.is_configured():
            raise ValueError("Google Business Profile OAuth non configuré")

        scope = " ".join(GBP_SCOPES)
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"scope={scope}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state}"
        )

    def exchange_code(self, code: str) -> GBPToken:
        """
        Échange le code d'autorisation contre un token.

        Args:
            code: Code d'autorisation reçu du callback

        Returns:
            GBPToken avec access_token et refresh_token
        """
        response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": self.redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code != 200:
            raise Exception(f"Token exchange failed: {response.text}")

        data = response.json()
        expires_in = data.get("expires_in", 3600)

        return GBPToken(
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token", ""),
            expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
            token_type=data.get("token_type", "Bearer"),
            scope=data.get("scope", ""),
        )

    def refresh_token(self, refresh_token: str) -> GBPToken:
        """
        Rafraîchit le token d'accès.

        Args:
            refresh_token: Token de rafraîchissement

        Returns:
            Nouveau GBPToken
        """
        response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "refresh_token": refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "refresh_token",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code != 200:
            raise Exception(f"Token refresh failed: {response.text}")

        data = response.json()
        expires_in = data.get("expires_in", 3600)

        return GBPToken(
            access_token=data["access_token"],
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
            token_type=data.get("token_type", "Bearer"),
            scope=data.get("scope", ""),
        )

    def get_accounts(self, access_token: str) -> List[Dict]:
        """
        Récupère les comptes Business accessibles.

        Args:
            access_token: Token d'accès OAuth

        Returns:
            Liste des comptes Business
        """
        response = requests.get(
            "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code != 200:
            raise Exception(f"Get accounts failed: {response.text}")

        return response.json().get("accounts", [])

    def get_locations(self, access_token: str, account_name: str) -> List[GBPLocation]:
        """
        Récupère les établissements d'un compte.

        Args:
            access_token: Token d'accès OAuth
            account_name: Nom du compte (ex: "accounts/123456")

        Returns:
            Liste des établissements
        """
        response = requests.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_name}/locations",
            params={
                "readMask": "name,title,storefrontAddress,phoneNumbers,websiteUri,locationKey"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code != 200:
            raise Exception(f"Get locations failed: {response.text}")

        locations = []
        for loc in response.json().get("locations", []):
            address = loc.get("storefrontAddress", {})
            address_str = ", ".join(filter(None, [
                address.get("addressLines", [""])[0] if address.get("addressLines") else "",
                address.get("locality", ""),
                address.get("postalCode", ""),
            ]))

            locations.append(GBPLocation(
                name=loc.get("name", ""),
                title=loc.get("title", ""),
                address=address_str,
                phone_number=loc.get("phoneNumbers", {}).get("primaryPhone", ""),
                website_uri=loc.get("websiteUri", ""),
                location_key=loc.get("locationKey", {}).get("placeId", ""),
            ))

        return locations

    def get_reviews(
        self,
        access_token: str,
        location_name: str,
        page_size: int = 50,
        page_token: str = None
    ) -> List[GBPReview]:
        """
        Récupère les avis d'un établissement.

        Args:
            access_token: Token d'accès OAuth
            location_name: Nom de l'établissement (ex: "locations/123456")
            page_size: Nombre d'avis par page (max 200)
            page_token: Token pour la pagination

        Returns:
            Liste des avis
        """
        params = {
            "pageSize": page_size,
            "orderBy": "updateTime desc",
        }
        if page_token:
            params["pageToken"] = page_token

        response = requests.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/{location_name}/reviews",
            params=params,
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code != 200:
            raise Exception(f"Get reviews failed: {response.text}")

        reviews = []
        for rev in response.json().get("reviews", []):
            # Extraire le rating (étoiles)
            star_rating = rev.get("starRating", "FIVE")
            rating_map = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
            rating = rating_map.get(star_rating, 5)

            # Extraire le commentaire
            comment = rev.get("comment", "")
            if isinstance(comment, dict):
                comment = comment.get("text", "")

            # Extraire le reviewer
            reviewer = rev.get("reviewer", {}).get("displayName", "Anonyme")

            # Dates
            create_time = rev.get("createTime")
            update_time = rev.get("updateTime")

            # Réponse du propriétaire
            reply = None
            if "reviewReply" in rev:
                reply = rev["reviewReply"].get("comment", "")

            reviews.append(GBPReview(
                review_id=rev.get("reviewId", ""),
                reviewer=reviewer,
                rating=rating,
                comment=comment,
                create_time=datetime.fromisoformat(create_time.replace("Z", "+00:00")) if create_time else datetime.utcnow(),
                update_time=datetime.fromisoformat(update_time.replace("Z", "+00:00")) if update_time else None,
                reply=reply,
            ))

        return reviews

    def get_average_rating(self, access_token: str, location_name: str) -> Dict:
        """
        Récupère la note moyenne et le nombre d'avis.

        Args:
            access_token: Token d'accès OAuth
            location_name: Nom de l'établissement

        Returns:
            Dict avec averageRating et totalReviewCount
        """
        response = requests.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/{location_name}",
            params={"readMask": "aggregateRating"},
            headers={"Authorization": f"Bearer {access_token}"}
        )

        if response.status_code != 200:
            raise Exception(f"Get rating failed: {response.text}")

        data = response.json()
        aggregate = data.get("aggregateRating", {})

        return {
            "average_rating": aggregate.get("rating", 0.0),
            "total_reviews": aggregate.get("count", 0),
        }


# Instance globale
gbp_oauth = GoogleBusinessProfileOAuth()
