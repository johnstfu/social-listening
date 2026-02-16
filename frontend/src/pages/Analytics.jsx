import axios from 'axios'
import { BarChart3, PieChart, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import SentimentChart from '../components/SentimentChart'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Analytics() {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [sentiment, setSentiment] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchData()
    }
  }, [selectedRestaurant])

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurants`)
      setRestaurants(response.data)
      if (response.data.length > 0) {
        setSelectedRestaurant(response.data[0])
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [sentimentRes, reviewsRes] = await Promise.all([
        axios.get(`${API_URL}/api/restaurants/${selectedRestaurant.id}/sentiment`),
        axios.get(`${API_URL}/api/restaurants/${selectedRestaurant.id}/reviews`)
      ])
      setSentiment(sentimentRes.data)
      setReviews(reviewsRes.data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Calculate analytics
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const avgSentimentScore = sentiment?.average_score?.toFixed(2) || 0

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Analyse détaillée des performances</p>
        </div>
        <select
          value={selectedRestaurant?.id || ''}
          onChange={(e) => {
            const restaurant = restaurants.find(r => r.id === parseInt(e.target.value))
            setSelectedRestaurant(restaurant)
          }}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
        >
          {restaurants.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Score Sentiment</p>
              <p className="text-3xl font-bold mt-1">{avgSentimentScore}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm mt-4">Moyenne: {avgSentimentScore > 0 ? 'Positif' : avgSentimentScore < 0 ? 'Négatif' : 'Neutre'}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Note Moyenne</p>
              <p className="text-3xl font-bold mt-1">{avgRating}/5</p>
            </div>
            <BarChart3 className="w-8 h-8 text-amber-200" />
          </div>
          <p className="text-amber-100 text-sm mt-4">{reviews.length} avis analysés</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Avis Positifs</p>
              <p className="text-3xl font-bold mt-1">{sentiment?.positive || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
          <p className="text-emerald-100 text-sm mt-4">
            {sentiment?.total_reviews > 0
              ? Math.round((sentiment.positive / sentiment.total_reviews) * 100)
              : 0}% du total
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm">Avis Négatifs</p>
              <p className="text-3xl font-bold mt-1">{sentiment?.negative || 0}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-rose-200" />
          </div>
          <p className="text-rose-100 text-sm mt-4">À surveiller</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Distribution Sentiment
          </h2>
          <SentimentChart sentiment={sentiment} />
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            Distribution Notes
          </h2>
          <div className="space-y-4">
            {ratingDistribution.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-4">
                <div className="w-20 text-sm text-slate-600">
                  {'⭐'.repeat(rating)}
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-slate-600 text-right">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
