"""
Social Listening MVP - Pydantic Schemas
=======================================
Schémas de validation et sérialisation
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ==================== RESTAURANT ====================

class RestaurantBase(BaseModel):
    name: str
    google_place_id: Optional[str] = None
    address: Optional[str] = None
    email_alert: Optional[EmailStr] = None


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantResponse(RestaurantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== REVIEW ====================

class ReviewBase(BaseModel):
    source: str
    author: Optional[str] = None
    rating: int
    text: Optional[str] = None
    date: Optional[datetime] = None


class ReviewCreate(ReviewBase):
    restaurant_id: int


class ReviewResponse(ReviewBase):
    id: int
    restaurant_id: int
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ALERT ====================

class AlertBase(BaseModel):
    restaurant_id: int
    alert_type: str  # low_rating, negative_sentiment, keyword
    threshold: Optional[float] = None
    email: EmailStr


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== SENTIMENT ====================

class SentimentSummary(BaseModel):
    positive: int
    neutral: int
    negative: int
    average_score: float
    total_reviews: int


# ==================== HEALTH ====================

class HealthCheck(BaseModel):
    status: str
    service: str


# ==================== RECOMMENDATION ====================

class RecommendationStepBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int
    is_completed: bool = False


class RecommendationStepCreate(RecommendationStepBase):
    pass


class RecommendationStepResponse(RecommendationStepBase):
    id: int
    recommendation_id: int

    class Config:
        from_attributes = True


class RecommendationBase(BaseModel):
    priority: str  # urgent, high, medium, low
    category: str  # Service, Menu, Ambiance, etc.
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    total_steps: int = 4


class RecommendationCreate(RecommendationBase):
    steps: Optional[List[RecommendationStepCreate]] = None


class RecommendationResponse(RecommendationBase):
    id: int
    restaurant_id: int
    progress: int
    is_completed: bool
    created_at: datetime
    steps: List[RecommendationStepResponse] = []

    class Config:
        from_attributes = True


# ==================== PLATFORM CONNECTION ====================

class PlatformConnectionBase(BaseModel):
    platform_name: str  # google, tripadvisor, yelp, facebook
    api_key: Optional[str] = None
    place_id: Optional[str] = None


class PlatformConnectionCreate(PlatformConnectionBase):
    pass


class PlatformConnectionResponse(PlatformConnectionBase):
    id: int
    restaurant_id: int
    is_active: bool
    last_sync: Optional[datetime] = None
    reviews_count: int
    avg_rating: float

    class Config:
        from_attributes = True
