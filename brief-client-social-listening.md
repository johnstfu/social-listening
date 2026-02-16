# Brief Client: Social Listening MVP

## Identité Projet

| Champ | Valeur |
|-------|--------|
| **Nom projet** | Social Listening MVP |
| **Client** | NikMacron (produit interne) |
| **Date brief** | 2026-02-15 |
| **Phase** | Prototype |
| **Priorité** | Haute |

---

## Contexte

### Problème
Les restaurateurs manquent de visibilité sur leur e-réputation. Ils ne savent pas:
- Ce que les clients disent d'eux en ligne
- Quand un avis négatif est publié
- Comment améliorer leur note

### Solution
Un outil de Social Listening qui:
- Agrège les avis Google Maps
- Analyse le sentiment
- Envoie des alertes email
- Fournit un dashboard responsive

---

## Cible

**Primaire**: Restaurateurs indépendants (10-50 couverts/jour)

**Secondaire**: Petites chaînes locales (2-5 établissements)

---

## Fonctionnalités

### Must Have (P0)

| Fonction | Description |
|----------|-------------|
| Connexion Google Maps | Récupérer les avis via API |
| Dashboard | Visualiser les avis et notes |
| Analyse sentiment | Classer positif/neutre/négatif |
| Alertes email | Notification avis < 2 étoiles |

### Should Have (P1)

| Fonction | Description |
|----------|-------------|
| Historique | Évolution sur 30 jours |
| Graphiques | Tendances visuelles |
| Multi-restaurants | Gérer plusieurs établissements |

### Could Have (P2)

| Fonction | Description |
|----------|-------------|
| TripAdvisor | Source additionnelle |
| Rapports PDF | Export mensuel |
| Réponse avis | Templates de réponse |

---

## Contraintes Techniques

### Stack Obligatoire

| Composant | Technologie |
|-----------|-------------|
| Frontend | React + Tailwind |
| Backend | FastAPI (Python) |
| Database | SQLite |
| Email | SendGrid |

### Contraintes

- **Zéro sur-ingénierie**: Solution minimaliste
- **Responsive**: Mobile-first
- **Déploiement**: Vercel + Railway
- **Budget**: < 10 EUR/mois

---

## Architecture

```
social-listening/
|-- backend/
|   |-- main.py              # FastAPI app
|   |-- models.py            # SQLite models
|   |-- google_places.py     # API Google
|   |-- sentiment.py        # Analyse NLP
|   |-- email_service.py     # SendGrid
|   |-- scheduler.py         # Jobs quotidiens
|   |-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- Dashboard.jsx
|   |   |   |-- ReviewCard.jsx
|   |   |   |-- SentimentChart.jsx
|   |   |-- App.jsx
|   |-- package.json
|   |-- tailwind.config.js
|
|-- README.md
|-- docker-compose.yml
```

---

## API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/restaurants` | GET | Liste restaurants |
| `/api/restaurants/{id}` | GET | Détail restaurant |
| `/api/restaurants/{id}/reviews` | GET | Avis |
| `/api/restaurants/{id}/sentiment` | GET | Analyse |
| `/api/alerts` | POST | Configurer alertes |
| `/api/alerts` | GET | Liste alertes |

---

## Design

### Référence UX
- https://x1vc814dwtb0-d.space.z.ai/

### Palette
- Utiliser design-system.json du projet

### Principes
- Mobile-first
- Cards pour les avis
- Graphiques simples (barres, lignes)
- Alertes visuelles (badges)

---

## Livrables Attendus

1. **Backend fonctionnel** avec API documentée
2. **Frontend responsive** avec dashboard
3. **Documentation** README + API
4. **Tests** unitaires backend

---

## Critères de Succès

| Critère | Mesure |
|---------|--------|
| Performance | < 2s load time |
| Précision sentiment | > 80% |
| Disponibilité | > 99% |
| UX | Testable par restaurateur |

---

## Planning

| Phase | Durée | Livrable |
|-------|-------|----------|
| Backend Core | 3 jours | API + DB |
| Frontend | 3 jours | Dashboard |
| Intégration | 1 jour | Google API |
| Tests | 1 jour | Coverage |

---

## Agents à Convoquer

| Ministère | Agent | Rôle |
|-----------|-------|------|
| Code Backend Python | Ministre Backend Python | API FastAPI |
| Code Frontend | Ministre Frontend | Dashboard React |
| Visibilité Tracking | Ministre Tracking | Intégration APIs |
| Post-Prod | Ministre Post-Prod | Tests |

---

## Notes

- Commencer par le backend (API Google Places)
- Tester avec 1 restaurant pilote
- Itérer rapidement

---

*Brief validé pour production - 2026-02-15*
