"""
Analyse de sentiment avancée avec Claude API.

Ce module fournit une analyse de sentiment détaillée utilisant
Claude (Anthropic) pour une compréhension approfondie des avis.

Features:
- Sentiment global (positive/negative/neutral)
- Extraction des topics clés
- Détection des problèmes spécifiques
- Suggestions d'amélioration
- Résumé exécutif
"""

import os
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import requests

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SentimentLabel(Enum):
    """Labels de sentiment."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    MIXED = "mixed"


@dataclass
class SentimentAnalysis:
    """Résultat de l'analyse de sentiment."""
    label: str
    score: float  # -1.0 à 1.0
    confidence: float  # 0.0 à 1.0

    # Détails avancés
    topics: List[str] = None
    issues: List[str] = None
    positives: List[str] = None
    suggestions: List[str] = None
    summary: str = None

    # Métadonnées
    model_used: str = None
    tokens_used: int = 0

    def __post_init__(self):
        if self.topics is None:
            self.topics = []
        if self.issues is None:
            self.issues = []
        if self.positives is None:
            self.positives = []
        if self.suggestions is None:
            self.suggestions = []

    def to_dict(self) -> Dict:
        """Convertit en dictionnaire."""
        return {
            "label": self.label,
            "score": self.score,
            "confidence": self.confidence,
            "topics": self.topics,
            "issues": self.issues,
            "positives": self.positives,
            "suggestions": self.suggestions,
            "summary": self.summary,
            "model_used": self.model_used,
            "tokens_used": self.tokens_used,
        }


class ClaudeSentimentAnalyzer:
    """Analyseur de sentiment utilisant Claude API."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
        self.model = "claude-haiku-3-20240307"  # Modèle économique pour l'analyse
        self.max_tokens = 1024
        self.api_url = "https://api.anthropic.com/v1/messages"

    def is_configured(self) -> bool:
        """Vérifie si Claude API est configuré."""
        return bool(self.api_key)

    def analyze(
        self,
        text: str,
        context: str = None,
        detailed: bool = True
    ) -> SentimentAnalysis:
        """
        Analyse le sentiment d'un texte.

        Args:
            text: Texte à analyser (avis client)
            context: Contexte additionnel (nom restaurant, type cuisine)
            detailed: Si True, inclut topics, issues, suggestions

        Returns:
            SentimentAnalysis avec tous les détails
        """
        if not text or not text.strip():
            return SentimentAnalysis(
                label=SentimentLabel.NEUTRAL.value,
                score=0.0,
                confidence=1.0,
                summary="Avis vide"
            )

        # Si Claude n'est pas configuré, utiliser l'analyseur basique
        if not self.is_configured():
            return self._basic_analysis(text)

        try:
            return self._claude_analysis(text, context, detailed)
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return self._basic_analysis(text)

    def _claude_analysis(
        self,
        text: str,
        context: str = None,
        detailed: bool = True
    ) -> SentimentAnalysis:
        """Analyse avec Claude API."""

        # Construire le prompt
        if detailed:
            prompt = f"""Analyse cet avis client en détail.

{f"Contexte: {context}" if context else ""}

AVIS CLIENT:
"{text}"

Fournis une analyse JSON avec la structure suivante:
{{
    "sentiment": "positive" | "negative" | "neutral" | "mixed",
    "score": <nombre entre -1.0 et 1.0>,
    "confidence": <nombre entre 0.0 et 1.0>,
    "topics": ["topic1", "topic2", ...],
    "issues": ["problème1", "problème2", ...],
    "positives": ["point positif1", "point positif2", ...],
    "suggestions": ["suggestion1", "suggestion2", ...],
    "summary": "Résumé en une phrase"
}}

Réponds UNIQUEMENT avec le JSON, sans texte additionnel."""
        else:
            prompt = f"""Analyse le sentiment de cet avis client.

AVIS: "{text}"

Réponds en JSON:
{{
    "sentiment": "positive" | "negative" | "neutral",
    "score": <nombre entre -1.0 et 1.0>,
    "confidence": <nombre entre 0.0 et 1.0>
}}

Réponds UNIQUEMENT avec le JSON."""

        # Appel API Claude
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        payload = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post(
            self.api_url,
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            raise Exception(f"Claude API error: {response.status_code} - {response.text}")

        data = response.json()

        # Extraire la réponse
        content = data.get("content", [{}])[0].get("text", "{}")
        tokens_used = data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0)

        # Parser le JSON
        try:
            # Nettoyer le contenu (enlever markdown si présent)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            result = json.loads(content.strip())
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse Claude response: {content}")
            return self._basic_analysis(text)

        return SentimentAnalysis(
            label=result.get("sentiment", "neutral"),
            score=float(result.get("score", 0.0)),
            confidence=float(result.get("confidence", 0.5)),
            topics=result.get("topics", []),
            issues=result.get("issues", []),
            positives=result.get("positives", []),
            suggestions=result.get("suggestions", []),
            summary=result.get("summary", ""),
            model_used=self.model,
            tokens_used=tokens_used
        )

    def _basic_analysis(self, text: str) -> SentimentAnalysis:
        """Analyse basique sans API (fallback)."""
        text_lower = text.lower()

        # Mots-clés positifs et négatifs
        positive_words = [
            "excellent", "superbe", "parfait", "délicieux", "merveilleux",
            "fantastique", "génial", "super", "bon", "agréable", "sympa",
            "recommande", "adoré", "aimé", "satisfait", "content", "ravi",
            "fresh", "rapide", "accueillant", "chaleureux", "professionnel"
        ]

        negative_words = [
            "déçu", "décevant", "mauvais", "horrible", "terrible", "nul",
            "cher", "lent", "froid", "sale", "désagréable", "arrogant",
            "incompétent", "jamais", "éviter", "fuir", "honteux", "scandaleux",
            "problème", "erreur", "raté", "manqué", "insatisfait", "frustré"
        ]

        # Compter les occurrences
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)

        # Calculer le score
        total = positive_count + negative_count
        if total == 0:
            score = 0.0
            label = "neutral"
        else:
            score = (positive_count - negative_count) / max(total, 1)

            if score > 0.3:
                label = "positive"
            elif score < -0.3:
                label = "negative"
            else:
                label = "neutral"

        # Extraire les topics basiques
        topics = []
        topic_keywords = {
            "service": ["service", "serveur", "serveuse", "accueil", "personnel"],
            "cuisine": ["plat", "cuisine", "repas", "menu", "goût", "saveur"],
            "ambiance": ["ambiance", "cadre", "décor", "atmosphère", "musique"],
            "prix": ["prix", "cher", "tarif", "facture", "addition", "rapport qualité"],
            "propreté": ["propre", "sale", "hygiène", "salle", "table", "toilettes"],
            "attente": ["attente", "temps", "long", "rapide", "lent"]
        }

        for topic, keywords in topic_keywords.items():
            if any(kw in text_lower for kw in keywords):
                topics.append(topic)

        return SentimentAnalysis(
            label=label,
            score=score,
            confidence=0.6,  # Confiance modérée pour l'analyse basique
            topics=topics,
            model_used="basic",
            tokens_used=0
        )

    def analyze_batch(
        self,
        reviews: List[str],
        context: str = None
    ) -> List[SentimentAnalysis]:
        """
        Analyse plusieurs avis en batch.

        Args:
            reviews: Liste des textes d'avis
            context: Contexte additionnel

        Returns:
            Liste des analyses
        """
        return [self.analyze(review, context) for review in reviews]

    def get_aggregate_sentiment(
        self,
        reviews: List[str],
        context: str = None
    ) -> Dict:
        """
        Obtient un résumé agrégé de plusieurs avis.

        Args:
            reviews: Liste des textes d'avis
            context: Contexte (nom restaurant)

        Returns:
            Dict avec statistiques agrégées
        """
        analyses = self.analyze_batch(reviews, context)

        if not analyses:
            return {"error": "No reviews to analyze"}

        # Agréger les résultats
        total = len(analyses)
        positive = sum(1 for a in analyses if a.label == "positive")
        negative = sum(1 for a in analyses if a.label == "negative")
        neutral = sum(1 for a in analyses if a.label == "neutral")

        avg_score = sum(a.score for a in analyses) / total
        avg_confidence = sum(a.confidence for a in analyses) / total

        # Topics les plus fréquents
        all_topics = []
        for a in analyses:
            all_topics.extend(a.topics)

        topic_counts = {}
        for topic in all_topics:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1

        top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        # Issues les plus fréquentes
        all_issues = []
        for a in analyses:
            all_issues.extend(a.issues)

        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

        top_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "total_reviews": total,
            "sentiment_distribution": {
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
                "percentages": {
                    "positive": round(positive / total * 100, 1),
                    "negative": round(negative / total * 100, 1),
                    "neutral": round(neutral / total * 100, 1),
                }
            },
            "average_score": round(avg_score, 3),
            "average_confidence": round(avg_confidence, 2),
            "top_topics": [{"topic": t, "count": c} for t, c in top_topics],
            "top_issues": [{"issue": i, "count": c} for i, c in top_issues],
        }


# Instance globale
claude_analyzer = ClaudeSentimentAnalyzer()
