# Social Listening Dashboard

Un dashboard moderne pour suivre et analyser la réputation en ligne de votre établissement.

## Fonctionnalités

- 📊 **KPIs essentiels**: Note moyenne, total avis, score sentiment, taux de réponse
- 📈 **Visualisations**: Répartition des sentiments, évolution temporelle
- 🚨 **Alertes prioritaires**: Avis négatifs nécessitant une réponse
- ⭐ **Points forts**: Ce que vos clients apprécient
- 💡 **Recommandations**: Actions prioritaires pour améliorer votre réputation

## Stack Technique

### Frontend
- React 18 + Vite
- Recharts (visualisations)
- Tailwind CSS
- Lucide React (icônes)

### Backend
- FastAPI (Python)
- SQLAlchemy + SQLite
- OAuth 2.0 (Google, Facebook)

## Installation

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

## Configuration

1. Copiez `.env.example` vers `.env`
2. Configurez vos clés API:
   - Google OAuth: [Console Google Cloud](https://console.cloud.google.com/)
   - Facebook OAuth: [Facebook Developers](https://developers.facebook.com/)

## Déploiement Netlify

1. Connectez votre repository GitHub à Netlify
2. Configurez les variables d'environnement
3. Déployez!

```bash
# Build pour production
npm run build
```

## Licence

MIT
