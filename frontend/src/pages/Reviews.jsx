import axios from 'axios'
import { Filter, Search, SortAsc, SortDesc, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReviewCard from '../components/ReviewCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Reviews() {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchReviews()
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

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurants/${selectedRestaurant.id}/reviews`)
      setReviews(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      // Search filter
      if (searchTerm && !review.text?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !review.author?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      // Sentiment filter
      if (sentimentFilter !== 'all' && review.sentiment !== sentimentFilter) {
        return false
      }
      // Rating filter
      if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter)
        if (review.rating !== rating) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return new Date(b.date) - new Date(a.date)
      }
      return new Date(a.date) - new Date(b.date)
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Avis</h1>
          <p className="text-slate-500 mt-1">Tous les avis de vos restaurants</p>
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

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={sentimentFilter}
              onChange={e => setSentimentFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous sentiments</option>
              <option value="positive">😊 Positif</option>
              <option value="neutral">😐 Neutre</option>
              <option value="negative">😞 Négatif</option>
            </select>
          </div>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Toutes notes</option>
            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
            <option value="4">⭐⭐⭐⭐ (4)</option>
            <option value="3">⭐⭐⭐ (3)</option>
            <option value="2">⭐⭐ (2)</option>
            <option value="1">⭐ (1)</option>
          </select>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-all"
          >
            {sortOrder === 'desc' ? (
              <>
                <SortDesc className="w-4 h-4" />
                Plus récents
              </>
            ) : (
              <>
                <SortAsc className="w-4 h-4" />
                Plus anciens
              </>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {(searchTerm || sentimentFilter !== 'all' || ratingFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">Filtres actifs:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                Recherche: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {sentimentFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                Sentiment: {sentimentFilter}
                <button onClick={() => setSentimentFilter('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {ratingFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                Note: {ratingFilter}⭐
                <button onClick={() => setRatingFilter('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-slate-500">
          {filteredReviews.length} avis sur {reviews.length}
        </p>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun avis trouvé</h3>
          <p className="text-slate-500">Essayez de modifier vos filtres de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
