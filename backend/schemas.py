"""
Radar — Pydantic Schemas
========================
Validation et sérialisation
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ==================== AUTH ====================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    invitation_token: str       # Obligatoire — accès sur invitation SeRious


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== INVITATION (admin SeRious) ====================

class InvitationCreate(BaseModel):
    email: Optional[EmailStr] = None    # pré-remplissage optionnel


class InvitationResponse(BaseModel):
    id: int
    token: str
    email: Optional[str] = None
    used: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== RESTAURANT ====================

class RestaurantCreate(BaseModel):
    name: str
    category: Optional[str] = None
    google_place_id: Optional[str] = None
    gmb_location_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    email_alert: Optional[EmailStr] = None


class RestaurantResponse(RestaurantCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== REVIEW ====================

class ReviewResponse(BaseModel):
    id: int
    restaurant_id: int
    source: str
    author: Optional[str] = None
    rating: int
    text: Optional[str] = None
    date: Optional[datetime] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
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


class RecommendationCreate(BaseModel):
    priority: str
    category: str
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    total_steps: int = 4
    steps: Optional[List[RecommendationStepCreate]] = None


class RecommendationResponse(BaseModel):
    id: int
    restaurant_id: int
    priority: str
    category: str
    title: str
    description: Optional[str] = None
    source: Optional[str] = None
    progress: int
    total_steps: int
    is_completed: bool
    created_at: datetime
    steps: List[RecommendationStepResponse] = []

    class Config:
        from_attributes = True


# ==================== PLATFORM CONNECTION ====================

class PlatformConnectionCreate(BaseModel):
    platform_name: str
    place_id: Optional[str] = None


class PlatformConnectionResponse(PlatformConnectionCreate):
    id: int
    restaurant_id: int
    is_active: bool
    last_sync: Optional[datetime] = None
    reviews_count: int
    avg_rating: float

    class Config:
        from_attributes = True
