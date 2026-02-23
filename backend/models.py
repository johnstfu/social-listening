"""
Radar — Models SQLAlchemy
=========================
Multi-tenant — PostgreSQL
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./radar_dev.db")

# Railway fournit parfois "postgres://" au lieu de "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs connect_args for threading
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Invitation(Base):
    """Invitation envoyée par SeRious à un nouveau client"""
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True)          # pré-rempli optionnel
    used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)        # None = pas d'expiration
    created_by = Column(String(255), nullable=True)     # email de l'admin SeRious


class User(Base):
    """Utilisateur (client final)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    password_hash = Column(String(255), nullable=True)  # Null si Google OAuth uniquement
    google_id = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)           # SeRious peut désactiver
    is_admin = Column(Boolean, default=False)           # Admin SeRious
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurants = relationship("Restaurant", back_populates="user")
    connected_platforms = relationship("ConnectedPlatform", back_populates="user")


class Restaurant(Base):
    """Établissement monitoré"""
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)       # restaurant, boulangerie, salon, ...
    google_place_id = Column(String(255), nullable=True)
    gmb_location_name = Column(String(255), nullable=True)  # ex: locations/123456
    address = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    email_alert = Column(String(255), nullable=True)    # pour récap hebdo
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="restaurants")
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="restaurant", cascade="all, delete-orphan")
    platform_connections = relationship("PlatformConnection", back_populates="restaurant", cascade="all, delete-orphan")
    connected_platforms = relationship("ConnectedPlatform", back_populates="restaurant", cascade="all, delete-orphan")


class Review(Base):
    """Avis client"""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    source = Column(String(50), nullable=False)         # google, tripadvisor, yelp, facebook
    external_id = Column(String(255), nullable=True)    # ID sur la plateforme source
    author = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=False)            # 1–5
    text = Column(Text, nullable=True)
    date = Column(DateTime, nullable=True)
    sentiment = Column(String(20), nullable=True)       # positive, neutral, negative
    sentiment_score = Column(Float, nullable=True)      # -1.0 à 1.0
    sentiment_details = Column(Text, nullable=True)     # JSON Claude
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="reviews")


class Recommendation(Base):
    """Recommandation IA pour un établissement"""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    priority = Column(String(20), nullable=False)       # urgent, high, medium, low
    category = Column(String(50), nullable=False)       # Service, Qualité, Ambiance, ...
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)
    progress = Column(Integer, default=0)
    total_steps = Column(Integer, default=4)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    order = Column(Integer, nullable=False)

    recommendation = relationship("Recommendation", back_populates="steps")


class PlatformConnection(Base):
    """Connexion OAuth à une plateforme d'avis"""
    __tablename__ = "platform_connections"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    platform_name = Column(String(50), nullable=False)
    place_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    reviews_count = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)

    restaurant = relationship("Restaurant", back_populates="platform_connections")


class ConnectedPlatform(Base):
    """Token OAuth stocké par utilisateur"""
    __tablename__ = "connected_platforms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    platform = Column(String(50), nullable=False)       # google, facebook, ...
    encrypted_access_token = Column(Text, nullable=True)
    encrypted_refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    platform_url = Column(Text, nullable=True)
    platform_business_id = Column(String(255), nullable=True)
    status = Column(String(20), default="active")       # active, expired
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="connected_platforms")
    restaurant = relationship("Restaurant", back_populates="connected_platforms")


class WeeklyReportLog(Base):
    """Log des récaps hebdomadaires envoyés"""
    __tablename__ = "weekly_report_logs"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), nullable=False)         # sent, failed
    error_message = Column(Text, nullable=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
