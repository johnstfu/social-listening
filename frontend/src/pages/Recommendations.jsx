import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import api from '../lib/api'

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      const restaurantsRes = await api.get('/api/restaurants')
      if (restaurantsRes.data.length === 0) return
      const restaurantId = restaurantsRes.data[0].id
      const res = await api.get(`/api/restaurants/${restaurantId}/recommendations`)
      setRecommendations(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const priorityConfig = {
    urgent: { badge: 'bg-red-100 text-red-700', label: 'Urgente' },
    high:   { badge: 'bg-orange-100 text-orange-700', label: 'Haute' },
    medium: { badge: 'bg-yellow-100 text-yellow-700', label: 'Moyenne' },
    low:    { badge: 'bg-blue-100 text-blue-700', label: 'Basse' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pending = recommendations.filter(r => !r.is_completed)
  const done = recommendations.filter(r => r.is_completed)

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 mb-6">
        Recommandations IA{' '}
        <span className="text-slate-400 font-normal text-base">({recommendations.length})</span>
      </h1>

      {recommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Aucune recommandation pour le moment</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                En cours ({pending.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.map((rec) => {
                  const config = priorityConfig[rec.priority] || priorityConfig.medium
                  return (
                    <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-slate-400">{rec.category}</span>
                      </div>
                      <h4 className="font-medium text-slate-900 text-sm mb-1">{rec.title}</h4>
                      {rec.description && (
                        <p className="text-xs text-slate-500 mb-3">{rec.description}</p>
                      )}
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progression</span>
                          <span>{rec.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${rec.progress}%` }}
                          />
                        </div>
                      </div>
                      {rec.source && (
                        <p className="text-xs text-slate-400 mt-2">{rec.source}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Terminées ({done.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {done.map((rec) => (
                  <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{rec.title}</span>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-400">{rec.category}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
