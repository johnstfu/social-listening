/**
 * Radar — Dashboard principal
 * Connecté à l'API réelle
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Minus,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import SentimentDonut from '../components/SentimentDonut'
import SentimentTimeline from '../components/SentimentTimeline'
import CategoryAnalysis from '../components/CategoryAnalysis'
import api from '../lib/api'

// ==================== COMPOSANTS ====================

function KpiTile({ label, value, trend, trendLabel, icon: Icon, color, suffix = '' }) {
  const isPositive = trend > 0
  const isNegative = trend < 0
  const trendColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${color || 'text-slate-400'}`} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}{suffix}</span>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend)}</span>
          </div>
        )}
      </div>
      {trendLabel && <p className="text-xs text-slate-400 mt-1">{trendLabel}</p>}
    </div>
  )
}

function SentimentBadge({ sentiment }) {
  const config = {
    positive: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Positif' },
    neutral:  { bg: 'bg-slate-100',   text: 'text-slate-600',   label: 'Neutre' },
    negative: { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Négatif' },
  }
  const c = config[sentiment] || config.neutral
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function ReviewRow({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating)
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-slate-600">
          {(review.author || 'A')[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800">{review.author || 'Anonyme'}</span>
            <span className="text-xs text-slate-400 capitalize">{review.source}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {review.sentiment && <SentimentBadge sentiment={review.sentiment} />}
            <div className="flex">
              {stars.map((filled, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
                />
              ))}
            </div>
          </div>
        </div>
        {review.text && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{review.text}</p>
        )}
        {review.date && (
          <p className="text-xs text-slate-400 mt-1">
            {new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  )
}

function RecommendationCard({ rec }) {
  const priorityConfig = {
    urgent: { badge: 'bg-red-100 text-red-700', label: 'Urgente' },
    high:   { badge: 'bg-orange-100 text-orange-700', label: 'Haute' },
    medium: { badge: 'bg-yellow-100 text-yellow-700', label: 'Moyenne' },
    low:    { badge: 'bg-blue-100 text-blue-700', label: 'Basse' },
  }
  const config = priorityConfig[rec.priority] || priorityConfig.medium

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-xs text-slate-400">{rec.category}</span>
      </div>
      <h4 className="font-medium text-slate-900 text-sm mb-1">{rec.title}</h4>
      {rec.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{rec.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Progression</span>
            <span>{rec.progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${rec.progress}%` }}
            />
          </div>
        </div>
        {rec.is_completed && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
      </div>
      {rec.source && (
        <p className="text-xs text-slate-400 mt-2">{rec.source}</p>
      )}
    </div>
  )
}

function EmptyState({ onSetup }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">📡</span>
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Bienvenue sur Radar</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">
        Configurez votre premier établissement pour commencer à surveiller vos avis.
      </p>
      <button
        onClick={onSetup}
        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Configurer mon établissement
      </button>
    </div>
  )
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function RadarDashboard() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/restaurants')
      setRestaurants(res.data)
      if (res.data.length === 0) {
        navigate('/onboarding')
        return
      }
      await loadRestaurantData(res.data[0])
    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRestaurantData = async (restaurant) => {
    setSelectedRestaurant(restaurant)
    try {
      const [reviewsRes, sentimentRes, recsRes] = await Promise.all([
        api.get(`/api/restaurants/${restaurant.id}/reviews`),
        api.get(`/api/restaurants/${restaurant.id}/sentiment`),
        api.get(`/api/restaurants/${restaurant.id}/recommendations`),
      ])
      setReviews(reviewsRes.data)
      setSentiment(sentimentRes.data)
      setRecommendations(recsRes.data)
    } catch (err) {
      console.error('Erreur données restaurant:', err)
    }
  }

  const handleSync = async () => {
    if (!selectedRestaurant) return
    setSyncing(true)
    try {
      await api.post(`/api/sync/restaurant/${selectedRestaurant.id}`)
      await loadRestaurantData(selectedRestaurant)
    } catch (err) {
      console.error('Erreur sync:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Calcul de la note moyenne à partir des avis
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  // Score sentiment -100 à +100
  const sentimentScore = sentiment?.average_score != null
    ? Math.round(sentiment.average_score * 100)
    : null

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'reviews', label: `Avis (${reviews.length})` },
    { id: 'recommendations', label: `Recommandations (${recommendations.length})` },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (restaurants.length === 0) {
    return <EmptyState onSetup={() => navigate('/onboarding')} />
  }

  return (
    <div>
      {/* Barre restaurant + actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {restaurants.length > 1 ? (
            <select
              value={selectedRestaurant?.id}
              onChange={(e) => {
                const r = restaurants.find(r => r.id === parseInt(e.target.value))
                if (r) loadRestaurantData(r)
              }}
              className="font-semibold text-slate-900 text-lg bg-transparent border-none outline-none cursor-pointer"
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <h1 className="text-lg font-semibold text-slate-900">{selectedRestaurant?.name}</h1>
          )}
          {selectedRestaurant?.address && (
            <span className="text-sm text-slate-400">{selectedRestaurant.address}</span>
          )}
          {selectedRestaurant?.category && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {selectedRestaurant.category}
            </span>
          )}
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sync...' : 'Actualiser'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium relative transition-colors ${
                activeTab === tab.id
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vue d'ensemble */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiTile
              label="Note moyenne"
              value={avgRating}
              suffix={reviews.length > 0 ? '/5' : ''}
              icon={Star}
              color="text-amber-500"
            />
            <KpiTile
              label="Total avis"
              value={sentiment?.total_reviews ?? reviews.length}
              icon={MessageSquare}
              color="text-slate-400"
            />
            <KpiTile
              label="Score sentiment"
              value={sentimentScore !== null ? sentimentScore : '—'}
              suffix={sentimentScore !== null ? '' : ''}
              trendLabel="-100 (négatif) → +100 (positif)"
              icon={sentimentScore !== null && sentimentScore >= 0 ? TrendingUp : TrendingDown}
              color={sentimentScore !== null && sentimentScore >= 0 ? 'text-emerald-500' : 'text-red-500'}
            />
            <KpiTile
              label="Recommandations"
              value={recommendations.filter(r => !r.is_completed).length}
              trendLabel="en attente"
              icon={AlertTriangle}
              color="text-orange-500"
            />
          </div>

          {/* Sentiment */}
          {sentiment && sentiment.total_reviews > 0 && (
            <section>
              <h2 className="text-base font-semibold text-slate-900 mb-3">Répartition sentiment</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SentimentDonut
                  data={{
                    positive: sentiment.positive,
                    neutral: sentiment.neutral,
                    negative: sentiment.negative,
                  }}
                  total={sentiment.total_reviews}
                />
                <SentimentTimeline />
              </div>
            </section>
          )}

          {/* Derniers avis */}
          {reviews.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">Derniers avis</h2>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Voir tout
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4">
                {reviews.slice(0, 5).map((review) => (
                  <ReviewRow key={review.id} review={review} />
                ))}
              </div>
            </section>
          )}

          {/* Recommandations IA */}
          {recommendations.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">Recommandations IA</h2>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Voir tout
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.slice(0, 4).map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state si pas d'avis */}
          {reviews.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-700 mb-1">Aucun avis pour le moment</h3>
              <p className="text-sm text-slate-400">
                Connectez Google Business Profile pour synchroniser vos avis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Avis */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucun avis à afficher</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 px-4">
              {reviews.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommandations */}
      {activeTab === 'recommendations' && (
        <div>
          {recommendations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Aucune recommandation pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
