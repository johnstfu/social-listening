"""
Social Listening MVP - Email Service
====================================
Service d'envoi d'emails via SendGrid
"""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import Optional
import os


class EmailService:
    """Service d'envoi d'emails"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("ALERT_FROM_EMAIL", "alerts@social-listening.local")

    def send_alert(
        self,
        to_email: str,
        subject: str,
        content: str,
        restaurant_name: str = ""
    ) -> bool:
        """
        Envoyer une alerte email

        Args:
            to_email: Email du destinataire
            subject: Sujet de l'email
            content: Contenu HTML
            restaurant_name: Nom du restaurant (pour le sujet)

        Returns:
            bool: True si envoyé avec succès
        """
        try:
            message = Mail(
                from_email=Email(self.from_email, "Social Listening"),
                to_emails=To(to_email),
                subject=f"[Alerte] {restaurant_name} - {subject}",
                html_content=Content("text/html", content)
            )

            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)

            return response.status_code in [200, 201, 202]

        except Exception as e:
            print(f"Erreur envoi email: {e}")
            return False

    def send_review_alert(
        self,
        to_email: str,
        restaurant_name: str,
        review_text: str,
        rating: int,
        sentiment: str
    ) -> bool:
        """Envoyer une alerte pour un avis négatif"""

        # Couleur selon le sentiment
        sentiment_color = {
            "positive": "#10B981",
            "neutral": "#F59E0B",
            "negative": "#EF4444"
        }.get(sentiment, "#6B7280")

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF6B4A 0%, #F59E0B 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">⚠️ Alerte Avis</h1>
                <p style="color: white; opacity: 0.9;">{restaurant_name}</p>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; color: #6B7280;">Note: {'⭐' * rating} ({rating}/5)</p>
                    <p style="margin: 5px 0 0 0; color: {sentiment_color}; font-weight: bold;">
                        Sentiment: {sentiment.upper()}
                    </p>
                </div>

                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; color: #374151; font-style: italic;">
                        "{review_text[:500]}{'...' if len(review_text) > 500 else ''}"
                    </p>
                </div>

                <p style="margin-top: 20px; color: #6B7280; font-size: 12px;">
                    Connectez-vous à votre dashboard pour plus de détails.
                </p>
            </div>
        </body>
        </html>
        """

        return self.send_alert(
            to_email=to_email,
            subject="Nouvel avis détecté",
            content=html_content,
            restaurant_name=restaurant_name
        )

    def send_weekly_report(
        self,
        to_email: str,
        restaurant_name: str,
        stats: dict
    ) -> bool:
        """Envoyer un rapport hebdomadaire"""

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #FF6B4A 0%, #F59E0B 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">📊 Rapport Hebdomadaire</h1>
                <p style="color: white; opacity: 0.9;">{restaurant_name}</p>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px;">
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10B981;">{stats.get('positive', 0)}</p>
                        <p style="margin: 5px 0 0 0; color: #6B7280;">Positifs</p>
                    </div>
                    <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #F59E0B;">{stats.get('neutral', 0)}</p>
                        <p style="margin: 5px 0 0 0; color: #6B7280;">Neutres</p>
                    </div>
                    <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #EF4444;">{stats.get('negative', 0)}</p>
                        <p style="margin: 5px 0 0 0; color: #6B7280;">Négatifs</p>
                    </div>
                </div>

                <p style="margin-top: 20px; color: #6B7280; font-size: 12px;">
                    Score moyen: {stats.get('average_score', 0):.2f}/5
                </p>
            </div>
        </body>
        </html>
        """

        return self.send_alert(
            to_email=to_email,
            subject="Rapport hebdomadaire",
            content=html_content,
            restaurant_name=restaurant_name
        )
