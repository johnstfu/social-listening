import { useEffect, useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'
import api from '../lib/api'

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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const restaurantsRes = await api.get('/api/restaurants')
      if (restaurantsRes.data.length === 0) return
      const restaurantId = restaurantsRes.data[0].id
      const res = await api.get(`/api/restaurants/${restaurantId}/reviews`)
      setReviews(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all'
    ? reviews
    : reviews.filter(r => r.sentiment === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-slate-900">
          Tous les avis <span className="text-slate-400 font-normal text-base">({reviews.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          {['all', 'positive', 'neutral', 'negative'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'positive' ? 'Positifs' : f === 'neutral' ? 'Neutres' : 'Négatifs'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aucun avis à afficher</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map((review) => {
            const stars = Array.from({ length: 5 }, (_, i) => i < review.rating)
            return (
              <div key={review.id} className="flex items-start gap-4 p-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
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
                          <Star key={i} className={`w-3 h-3 ${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.text && (
                    <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                  )}
                  {review.date && (
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
