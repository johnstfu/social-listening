"""
Social Listening MVP - Google Places Client
===========================================
Client pour l'API Google Places
"""

import httpx
from typing import List, Dict, Optional
import os


class GooglePlacesClient:
    """Client pour interagir avec Google Places API"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GOOGLE_PLACES_API_KEY")
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    async def get_place_id(self, query: str) -> Optional[str]:
        """Rechercher un lieu et obtenir son Place ID"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/findplacefromtext/json",
                params={
                    "input": query,
                    "inputtype": "textquery",
                    "key": self.api_key
                }
            )
            data = response.json()

            if data.get("candidates"):
                return data["candidates"][0].get("place_id")
        return None

    async def get_place_details(self, place_id: str) -> Dict:
        """Obtenir les détails d'un lieu"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/details/json",
                params={
                    "place_id": place_id,
                    "fields": "name,formatted_address,rating,user_ratings_total,reviews",
                    "key": self.api_key
                }
            )
            data = response.json()
            return data.get("result", {})

    def get_reviews(self, place_id: str) -> List[Dict]:
        """Récupérer les avis d'un lieu (synchrone pour simplifier)"""
        import requests

        response = requests.get(
            f"{self.base_url}/details/json",
            params={
                "place_id": place_id,
                "fields": "reviews",
                "key": self.api_key
            }
        )
        data = response.json()

        reviews = []
        for review in data.get("result", {}).get("reviews", []):
            reviews.append({
                "author": review.get("author_name"),
                "rating": review.get("rating"),
                "text": review.get("text"),
                "date": review.get("time")
            })

        return reviews

    async def get_reviews_async(self, place_id: str) -> List[Dict]:
        """Récupérer les avis d'un lieu (asynchrone)"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/details/json",
                params={
                    "place_id": place_id,
                    "fields": "reviews",
                    "key": self.api_key
                }
            )
            data = response.json()

            reviews = []
            for review in data.get("result", {}).get("reviews", []):
                reviews.append({
                    "author": review.get("author_name"),
                    "rating": review.get("rating"),
                    "text": review.get("text"),
                    "date": review.get("time")
                })

            return reviews
