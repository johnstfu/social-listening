"""
Synchronisation automatique des avis avec APScheduler.

Ce module gère la synchronisation périodique des avis depuis:
- Google Business Profile
- Facebook Pages
- Autres plateformes (TripAdvisor, Yelp via scraping)

Utilise APScheduler pour exécuter des tâches en background.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.pool import ThreadPoolExecutor

from models import SessionLocal, Restaurant, Review, PlatformConnection
from oauth_gbp import gbp_oauth
from oauth_facebook import facebook_oauth
from sentiment import SentimentAnalyzer

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SyncStatus(Enum):
    """Statut de synchronisation."""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    PENDING = "pending"


@dataclass
class SyncResult:
    """Résultat d'une synchronisation."""
    platform: str
    restaurant_id: int
    status: SyncStatus
    new_reviews: int = 0
    updated_reviews: int = 0
    total_reviews: int = 0
    error_message: Optional[str] = None
    synced_at: datetime = None

    def __post_init__(self):
        if self.synced_at is None:
            self.synced_at = datetime.utcnow()


class ReviewSyncScheduler:
    """Gestionnaire de synchronisation automatique des avis."""

    def __init__(self):
        self.scheduler = BackgroundScheduler(
            jobstores={'default': MemoryJobStore()},
            executors={'default': ThreadPoolExecutor(max_workers=3)},
            timezone='Europe/Paris'
        )
        self.sentiment_analyzer = SentimentAnalyzer()
        self._running = False

    def start(self):
        """Démarre le planificateur."""
        if not self._running:
            self.scheduler.start()
            self._running = True
            logger.info("Sync scheduler started")

    def stop(self):
        """Arrête le planificateur."""
        if self._running:
            self.scheduler.shutdown(wait=True)
            self._running = False
            logger.info("Sync scheduler stopped")

    def add_restaurant_sync_job(
        self,
        restaurant_id: int,
        interval_minutes: int = 60,
        platforms: List[str] = None
    ):
        """
        Ajoute un job de synchronisation pour un restaurant.

        Args:
            restaurant_id: ID du restaurant
            interval_minutes: Intervalle en minutes (défaut: 60)
            platforms: Liste des plateformes à synchroniser (défaut: toutes)
        """
        job_id = f"sync_restaurant_{restaurant_id}"

        # Supprimer l'ancien job s'il existe
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

        # Ajouter le nouveau job
        self.scheduler.add_job(
            func=self.sync_restaurant_reviews,
            trigger=IntervalTrigger(minutes=interval_minutes),
            id=job_id,
            args=[restaurant_id, platforms],
            name=f"Sync reviews for restaurant {restaurant_id}",
            replace_existing=True
        )

        logger.info(f"Added sync job for restaurant {restaurant_id} every {interval_minutes}min")

    def add_daily_sync_job(self, hour: int = 6, minute: int = 0):
        """
        Ajoute un job de synchronisation quotidienne pour tous les restaurants.

        Args:
            hour: Heure de la sync (défaut: 6h)
            minute: Minute (défaut: 0)
        """
        self.scheduler.add_job(
            func=self.sync_all_restaurants,
            trigger=CronTrigger(hour=hour, minute=minute),
            id="daily_sync_all",
            name="Daily sync for all restaurants",
            replace_existing=True
        )

        logger.info(f"Added daily sync job at {hour}:{minute:02d}")

    def remove_restaurant_sync_job(self, restaurant_id: int):
        """Supprime le job de synchronisation d'un restaurant."""
        job_id = f"sync_restaurant_{restaurant_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
            logger.info(f"Removed sync job for restaurant {restaurant_id}")

    def sync_all_restaurants(self) -> List[SyncResult]:
        """
        Synchronise tous les restaurants actifs.

        Returns:
            Liste des résultats de synchronisation
        """
        db = SessionLocal()
        try:
            restaurants = db.query(Restaurant).all()
            results = []

            for restaurant in restaurants:
                result = self.sync_restaurant_reviews(restaurant.id)
                results.extend(result)

            logger.info(f"Synced {len(restaurants)} restaurants")
            return results
        finally:
            db.close()

    def sync_restaurant_reviews(
        self,
        restaurant_id: int,
        platforms: List[str] = None
    ) -> List[SyncResult]:
        """
        Synchronise les avis d'un restaurant depuis toutes les plateformes connectées.

        Args:
            restaurant_id: ID du restaurant
            platforms: Liste des plateformes à synchroniser (None = toutes)

        Returns:
            Liste des résultats par plateforme
        """
        db = SessionLocal()
        results = []

        try:
            restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
            if not restaurant:
                return [SyncResult(
                    platform="unknown",
                    restaurant_id=restaurant_id,
                    status=SyncStatus.FAILED,
                    error_message="Restaurant non trouvé"
                )]

            # Récupérer les connexions actives
            connections = db.query(PlatformConnection).filter(
                PlatformConnection.restaurant_id == restaurant_id,
                PlatformConnection.is_active == True
            ).all()

            if not connections:
                logger.info(f"No active connections for restaurant {restaurant_id}")
                return []

            for connection in connections:
                # Filtrer par plateforme si spécifié
                if platforms and connection.platform_name not in platforms:
                    continue

                result = self._sync_platform(db, restaurant, connection)
                results.append(result)

            return results

        except Exception as e:
            logger.error(f"Error syncing restaurant {restaurant_id}: {e}")
            return [SyncResult(
                platform="unknown",
                restaurant_id=restaurant_id,
                status=SyncStatus.FAILED,
                error_message=str(e)
            )]
        finally:
            db.close()

    def _sync_platform(
        self,
        db: Session,
        restaurant: Restaurant,
        connection: PlatformConnection
    ) -> SyncResult:
        """Synchronise une plateforme spécifique."""
        platform = connection.platform_name

        try:
            if platform == "google":
                return self._sync_google(db, restaurant, connection)
            elif platform == "facebook":
                return self._sync_facebook(db, restaurant, connection)
            else:
                # Pour TripAdvisor, Yelp, etc. - scraping à implémenter
                return SyncResult(
                    platform=platform,
                    restaurant_id=restaurant.id,
                    status=SyncStatus.PENDING,
                    error_message="Sync not implemented for this platform"
                )
        except Exception as e:
            logger.error(f"Error syncing {platform} for restaurant {restaurant.id}: {e}")
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message=str(e)
            )

    def _sync_google(
        self,
        db: Session,
        restaurant: Restaurant,
        connection: PlatformConnection
    ) -> SyncResult:
        """Synchronise les avis Google Business Profile."""
        platform = "google"

        # Vérifier si OAuth est configuré
        if not gbp_oauth.is_configured():
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message="Google Business Profile OAuth non configuré"
            )

        # Récupérer le token d'accès (stocké dans api_key ou à récupérer autrement)
        access_token = connection.api_key  # En production, utiliser un stockage sécurisé
        location_name = connection.place_id  # Format: "locations/xxx"

        if not access_token or not location_name:
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message="Token ou location_name manquant"
            )

        try:
            # Récupérer les avis
            reviews = gbp_oauth.get_reviews(access_token, location_name)

            new_count = 0
            updated_count = 0

            for gbp_review in reviews:
                # Vérifier si l'avis existe déjà
                existing = db.query(Review).filter(
                    Review.restaurant_id == restaurant.id,
                    Review.source == "google",
                    Review.external_id == gbp_review.review_id
                ).first()

                # Analyser le sentiment
                sentiment = self.sentiment_analyzer.analyze(gbp_review.comment or "")

                if existing:
                    # Mettre à jour l'avis existant
                    existing.rating = gbp_review.rating
                    existing.text = gbp_review.comment
                    existing.sentiment = sentiment["label"]
                    existing.sentiment_score = sentiment["score"]
                    existing.date = gbp_review.create_time
                    updated_count += 1
                else:
                    # Créer un nouvel avis
                    new_review = Review(
                        restaurant_id=restaurant.id,
                        source="google",
                        external_id=gbp_review.review_id,
                        author=gbp_review.reviewer,
                        rating=gbp_review.rating,
                        text=gbp_review.comment,
                        date=gbp_review.create_time,
                        sentiment=sentiment["label"],
                        sentiment_score=sentiment["score"]
                    )
                    db.add(new_review)
                    new_count += 1

            # Mettre à jour la connexion
            connection.last_sync = datetime.utcnow()
            connection.reviews_count = len(reviews)

            # Récupérer la note moyenne
            try:
                rating_data = gbp_oauth.get_average_rating(access_token, location_name)
                connection.avg_rating = rating_data.get("average_rating", 0.0)
            except:
                pass

            db.commit()

            logger.info(f"Google sync: {new_count} new, {updated_count} updated for restaurant {restaurant.id}")

            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.SUCCESS,
                new_reviews=new_count,
                updated_reviews=updated_count,
                total_reviews=len(reviews)
            )

        except Exception as e:
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message=str(e)
            )

    def _sync_facebook(
        self,
        db: Session,
        restaurant: Restaurant,
        connection: PlatformConnection
    ) -> SyncResult:
        """Synchronise les avis Facebook Pages."""
        platform = "facebook"

        # Vérifier si OAuth est configuré
        if not facebook_oauth.is_configured():
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message="Facebook OAuth non configuré"
            )

        # Récupérer le token d'accès de la page
        page_access_token = connection.api_key
        page_id = connection.place_id

        if not page_access_token or not page_id:
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message="Token ou page_id manquant"
            )

        try:
            # Récupérer les avis
            reviews = facebook_oauth.get_page_reviews(page_access_token, page_id)

            new_count = 0
            updated_count = 0

            for fb_review in reviews:
                # Vérifier si l'avis existe déjà
                existing = db.query(Review).filter(
                    Review.restaurant_id == restaurant.id,
                    Review.source == "facebook",
                    Review.external_id == fb_review.review_id
                ).first()

                # Analyser le sentiment
                sentiment = self.sentiment_analyzer.analyze(fb_review.review_text or "")

                if existing:
                    # Mettre à jour
                    existing.rating = fb_review.rating
                    existing.text = fb_review.review_text
                    existing.sentiment = sentiment["label"]
                    existing.sentiment_score = sentiment["score"]
                    existing.date = fb_review.created_time
                    updated_count += 1
                else:
                    # Créer
                    new_review = Review(
                        restaurant_id=restaurant.id,
                        source="facebook",
                        external_id=fb_review.review_id,
                        author=fb_review.reviewer_name,
                        rating=fb_review.rating,
                        text=fb_review.review_text,
                        date=fb_review.created_time,
                        sentiment=sentiment["label"],
                        sentiment_score=sentiment["score"]
                    )
                    db.add(new_review)
                    new_count += 1

            # Mettre à jour la connexion
            connection.last_sync = datetime.utcnow()
            connection.reviews_count = len(reviews)

            # Récupérer la note moyenne
            try:
                rating_data = facebook_oauth.get_page_ratings_summary(page_access_token, page_id)
                connection.avg_rating = rating_data.get("overall_star_rating", 0.0)
            except:
                pass

            db.commit()

            logger.info(f"Facebook sync: {new_count} new, {updated_count} updated for restaurant {restaurant.id}")

            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.SUCCESS,
                new_reviews=new_count,
                updated_reviews=updated_count,
                total_reviews=len(reviews)
            )

        except Exception as e:
            return SyncResult(
                platform=platform,
                restaurant_id=restaurant.id,
                status=SyncStatus.FAILED,
                error_message=str(e)
            )

    def get_jobs_info(self) -> List[Dict]:
        """Retourne les informations sur les jobs planifiés."""
        jobs = self.scheduler.get_jobs()
        return [
            {
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger),
            }
            for job in jobs
        ]


# Instance globale
sync_scheduler = ReviewSyncScheduler()


def start_sync_scheduler():
    """Démarre le planificateur de synchronisation."""
    sync_scheduler.start()

    # Ajouter la sync quotidienne à 6h
    sync_scheduler.add_daily_sync_job(hour=6, minute=0)


def stop_sync_scheduler():
    """Arrête le planificateur."""
    sync_scheduler.stop()
