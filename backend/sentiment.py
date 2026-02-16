"""
Social Listening MVP - Sentiment Analyzer
=========================================
Analyse de sentiment avec TextBlob (léger, pas de ML lourd)
"""

from textblob import TextBlob
from typing import Dict


class SentimentAnalyzer:
    """Analyseur de sentiment utilisant TextBlob"""

    def analyze(self, text: str) -> Dict:
        """
        Analyser le sentiment d'un texte

        Returns:
            Dict avec 'label' (positive/neutral/negative) et 'score' (-1 to 1)
        """
        if not text:
            return {"label": "neutral", "score": 0.0}

        blob = TextBlob(text)
        polarity = blob.sentiment.polarity

        # Classification
        if polarity > 0.1:
            label = "positive"
        elif polarity < -0.1:
            label = "negative"
        else:
            label = "neutral"

        return {
            "label": label,
            "score": polarity,
            "subjectivity": blob.sentiment.subjectivity
        }

    def analyze_batch(self, texts: list) -> list:
        """Analyser plusieurs textes"""
        return [self.analyze(text) for text in texts]

    def get_keywords(self, text: str) -> list:
        """Extraire les mots-clés d'un texte"""
        if not text:
            return []

        blob = TextBlob(text)
        # Filtrer les mots courts et les stop words basiques
        keywords = [
            word.lower()
            for word in blob.noun_phrases
            if len(word) > 3
        ]
        return list(set(keywords))[:5]  # Top 5 mots-clés uniques
