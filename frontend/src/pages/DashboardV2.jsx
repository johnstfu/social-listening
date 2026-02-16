/**
 * Dashboard Social Listening & Sentiment Analysis
 * Le Petit Bistrot Parisien (MOCK-UP)
 *
 * Architecture:
 * - En-tête KPIs (4 tuiles)
 * - Répartition Sentiment (Donut + Évolution)
 * - Plateformes (4 cartes)
 * - Analyse par Catégorie (Aires empilées)
 * - Mots-clés (Graphique diffus)
 * - Recommandations IA (Cartes actionnables)
 * - Alertes Temps Réel (Flux)
 * - Intégration GMB
 */

import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Star, MessageSquare, AlertTriangle,
  RefreshCw, Building2, Bell, ChevronRight, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'
import SentimentDonut from '../components/SentimentDonut'
import SentimentTimeline from '../components/SentimentTimeline'
import CategoryAnalysis from '../components/CategoryAnalysis'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ==================== MOCK DATA ====================
const MOCK_DATA = {
  restaurant: {
    name: "Le Petit Bistrot Parisien",
    address: "12 Rue de la Paix, Paris 75002"
  },
  kpis: {
    avgRating: { value: 3.6, max: 5, trend: -0.2, trendLabel: "vs mois dernier" },
    reviews30Days: { value: 29 },
    totalReviews: { value: 30 },
    sentimentScore: { value: -58, trend: -12, trendLabel: "vs période précédente", description: "Indice de -100 (très négatif) à +100 (très positif)" },
    unreadAlerts: 3
  },
  sentiment: {
    positive: 60,
    neutral: 17,
    negative: 23,
    total: 30
  },
  platforms: [
    { name: 'Google', icon: 'Google', rating: 3.6, reviews: 156, sentiment: 0.30, color: '#4285f4' },
    { name: 'TripAdvisor', icon: 'Owl', rating: 4.0, reviews: 89, sentiment: 0.34, color: '#00af87' },
    { name: 'Yelp', icon: 'Star', rating: 3.8, reviews: 42, sentiment: 0.22, color: '#d32323' },
    { name: 'Facebook', icon: 'Facebook', rating: 4.4, reviews: 67, sentiment: 0.41, color: '#1877f2' }
  ],
  categories: [
    { name: 'Service', shortName: 'Service', positive: 18, neutral: 4, negative: 6 },
    { name: 'Ambiance', shortName: 'Ambiance', positive: 22, neutral: 3, negative: 3 },
    { name: 'Prix', shortName: 'Prix', positive: 12, neutral: 8, negative: 8 },
    { name: 'Rapport qualité/prix', shortName: 'Rapport Q/P', positive: 10, neutral: 10, negative: 8 },
    { name: 'Propreté', shortName: 'Propreté', positive: 20, neutral: 5, negative: 3 },
    { name: 'Emplacement', shortName: 'Emplacement', positive: 25, neutral: 3, negative: 0 },
    { name: 'Parking', shortName: 'Parking', positive: 8, neutral: 12, negative: 8 }
  ],
  keywords: [
    { word: 'accueil', mentions: 15, sentiment: 'positive' },
    { word: 'attente', mentions: 12, sentiment: 'negative' },
    { word: 'qualité', mentions: 10, sentiment: 'positive' },
    { word: 'prix', mentions: 9, sentiment: 'neutral' },
    { word: 'service', mentions: 8, sentiment: 'positive' },
    { word: 'bruit', mentions: 7, sentiment: 'negative' },
    { word: 'cadre', mentions: 6, sentiment: 'positive' },
    { word: 'végétarien', mentions: 5, sentiment: 'neutral' }
  ],
  recommendations: [
    {
      id: 1,
      priority: 'urgent',
      domain: 'Service',
      title: 'Améliorer la gestion des temps d\'attente',
      description: 'Les avis mentionnent fréquemment des temps d\'attente trop longs.',
      source: 'Analyse IA - 12 avis négatifs',
      progress: 25,
      date: '2024-02-15'
    },
    {
      id: 2,
      priority: 'high',
      domain: 'Menu',
      title: 'Revoir la qualité du bæuf bourguignon',
      description: 'Plusieurs clients signalent une qualité insuffisante.',
      source: 'Analyse IA - 5 mentions',
      progress: 0,
      date: '2024-02-14'
    },
    {
      id: 3,
      priority: 'medium',
      domain: 'Réseaux Sociaux',
      title: 'Répondre aux avis négatifs',
      description: '8 avis négatifs sans réponse depuis 30 jours.',
      source: 'Audit Google Business',
      progress: 50,
      date: '2024-02-13'
    },
    {
      id: 4,
      priority: 'low',
      domain: 'Ambiance',
      title: 'Enrichir la carte des vins',
      description: 'Demandes clients pour plus de choix.',
      source: 'Feedback clients',
      progress: 75,
      date: '2024-02-10'
    }
  ],
  alerts: [
    {
      id: 1,
      severity: 'critical',
      title: 'Avis 1 étoile - Intoxication alimentaire alléguée',
      description: 'Un client mentionne une intoxication. Vérification recommandée.',
      time: 'Il y a 2h',
      read: false
    },
    {
      id: 2,
      severity: 'warning',
      title: 'Tendance négative sur les temps d\'attente',
      description: '5 avis mentionnent l\'attente ces 7 derniers jours.',
      time: 'Il y a 5h',
      read: false
    },
    {
      id: 3,
      severity: 'info',
      title: 'Excellents avis sur le brunch du dimanche',
      description: 'Note moyenne de 4.8 sur les avis brunch.',
      time: 'Hier',
      read: true
    }
  ]
}

// ==================== COMPOSANTS DE BASE ====================

// Tuile KPI
function KpiTile({ label, value, trend, trendLabel, icon: Icon, color, suffix = '' }) {
  const isPositive = trend > 0
  const isNegative = trend < 0
  const trendColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {Icon && <Icon className={`w-5 h-5 ${color || 'text-slate-400'}`} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}{suffix}</span>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      {trendLabel && (
        <p className="text-xs text-slate-400 mt-1">{trendLabel}</p>
      )}
    </div>
  )
}

// Carte Plateforme
function PlatformCard({ platform }) {
  const platformIcons = {
    'Google': 'Google',
    'Owl': 'Owl',
    'Star': 'Star',
    'Facebook': 'Facebook'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: platform.color }}
        >
          {platform.name[0]}
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">{platform.name}</h4>
          <p className="text-sm text-slate-500">{platform.reviews} avis</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="font-semibold text-slate-900">{platform.rating}</span>
        </div>
        <div className={`text-sm font-medium ${platform.sentiment > 0 ? 'text-emerald-600' : platform.sentiment < 0 ? 'text-red-600' : 'text-slate-500'}`}>
          {platform.sentiment > 0 ? '+' : ''}{platform.sentiment.toFixed(2)}
        </div>
      </div>
    </div>
  )
}

// Carte Recommandation
function RecommendationCard({ recommendation, onAction }) {
  const priorityConfig = {
    urgent: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Urgente' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'Haute' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', label: 'Moyenne' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Basse' }
  }

  const config = priorityConfig[recommendation.priority]

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-xs text-slate-500">{recommendation.domain}</span>
      </div>
      <h4 className="font-semibold text-slate-900 mb-1">{recommendation.title}</h4>
      <p className="text-sm text-slate-600 mb-3">{recommendation.description}</p>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Progression</span>
          <span>{recommendation.progress}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${recommendation.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{recommendation.source}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onAction?.('view', recommendation)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Voir les actions
          </button>
          <button
            onClick={() => onAction?.('complete', recommendation)}
            className="text-xs text-slate-600 hover:text-slate-700 font-medium"
          >
            Marquer terminée
          </button>
        </div>
      </div>
    </div>
  )
}

// Alerte
function AlertItem({ alert, onMarkRead, onResolve }) {
  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Bell, iconColor: 'text-blue-600' }
  }

  const config = severityConfig[alert.severity]
  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3 ${!alert.read ? 'ring-1 ring-slate-300' : ''}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 text-sm">{alert.title}</h4>
          <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
          <p className="text-xs text-slate-400 mt-1">{alert.time}</p>
        </div>
        <div className="flex gap-1">
          {!alert.read && (
            <button
              onClick={() => onMarkRead?.(alert.id)}
              className="p-1 hover:bg-white rounded transition-colors"
              title="Marquer comme lu"
            >
              <CheckCircle className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLastUpdate(new Date())
      setLoading(false)
    }, 1000)
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'reviews', label: 'Avis' },
    { id: 'recommendations', label: 'Recommandations' },
    { id: 'alerts', label: 'Alertes' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h1 className="font-semibold text-slate-900">{MOCK_DATA.restaurant.name}</h1>
                <p className="text-sm text-slate-500">{MOCK_DATA.restaurant.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">{MOCK_DATA.kpis.unreadAlerts} alertes</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Indicateurs clés</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiTile
                  label="Note Moyenne"
                  value={MOCK_DATA.kpis.avgRating.value}
                  suffix={`/${MOCK_DATA.kpis.avgRating.max}`}
                  trend={MOCK_DATA.kpis.avgRating.trend}
                  trendLabel={MOCK_DATA.kpis.avgRating.trendLabel}
                  icon={Star}
                  color="text-amber-500"
                />
                <KpiTile
                  label="Avis sur 30 jours"
                  value={MOCK_DATA.kpis.reviews30Days.value}
                  icon={MessageSquare}
                  color="text-blue-500"
                />
                <KpiTile
                  label="Total avis"
                  value={MOCK_DATA.kpis.totalReviews.value}
                  icon={MessageSquare}
                  color="text-slate-500"
                />
                <KpiTile
                  label="Score Sentiment"
                  value={MOCK_DATA.kpis.sentimentScore.value}
                  trend={MOCK_DATA.kpis.sentimentScore.trend}
                  trendLabel={MOCK_DATA.kpis.sentimentScore.trendLabel}
                  icon={TrendingDown}
                  color="text-red-500"
                />
                <KpiTile
                  label="Alertes non lues"
                  value={MOCK_DATA.kpis.unreadAlerts}
                  icon={AlertTriangle}
                  color="text-red-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * Score Sentiment: indice de -100 (très négatif) à +100 (très positif), basé sur l'analyse des avis
              </p>
            </section>

            {/* Section Répartition Sentiment */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Répartition Sentiment</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SentimentDonut
                  data={MOCK_DATA.sentiment}
                  total={MOCK_DATA.sentiment.total}
                />
                <SentimentTimeline />
              </div>
            </section>

            {/* Section Analyse par Catégorie */}
            <section>
              <CategoryAnalysis data={MOCK_DATA.categories} />
            </section>

            {/* Plateformes */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Plateformes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {MOCK_DATA.platforms.map((platform, index) => (
                  <PlatformCard key={index} platform={platform} />
                ))}
              </div>
            </section>

            {/* Recommandations */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Recommandations IA</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_DATA.recommendations.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onAction={(action, rec) => console.log(action, rec)}
                  />
                ))}
              </div>
            </section>

            {/* Alertes */}
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Alertes Temps Réel</h2>
              <div className="space-y-2">
                {MOCK_DATA.alerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onMarkRead={(id) => console.log('Mark read:', id)}
                    onResolve={(id) => console.log('Resolve:', id)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Section Avis en cours de développement</p>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_DATA.recommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAction={(action, rec) => console.log(action, rec)}
              />
            ))}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="max-w-2xl mx-auto space-y-2">
            {MOCK_DATA.alerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onMarkRead={(id) => console.log('Mark read:', id)}
                onResolve={(id) => console.log('Resolve:', id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Social Listening Agent v1.0</span>
            <span>Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
