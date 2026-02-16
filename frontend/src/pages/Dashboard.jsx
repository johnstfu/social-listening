/**
 * Social Listening Dashboard
 * Clean, modern UX/UI inspired by best practices
 *
 * Structure:
 * 1. Hero KPIs (4 essential metrics)
 * 2. Main Charts (Sentiment + Evolution)
 * 3. Alerts (urgent items needing action)
 * 4. Strengths (positive highlights)
 * 5. Recommendations (actionable items)
 */

import { useState } from 'react'
import {
  Star, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, RefreshCw, MessageCircle, ThumbsUp,
  ExternalLink, Clock, ArrowRight
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as Tooltip2, ResponsiveContainer as ResponsiveContainer2 } from 'recharts'

// Demo data - would come from API in production
const DEMO_DATA = {
  restaurant: {
    name: "Le Petit Bistrot",
    address: "Paris, France"
  },
  metrics: {
    avgRating: 4.2,
    totalReviews: 156,
    sentimentScore: 72,
    responseRate: 85
  },
  sentiment: [
    { name: 'Positifs', value: 72, color: '#22c55e' },
    { name: 'Neutres', value: 15, color: '#6b7280' },
    { name: 'Négatifs', value: 13, color: '#ef4444' }
  ],
  timeline: [
    { date: 'Jan', score: 65 },
    { date: 'Fév', score: 68 },
    { date: 'Mar', score: 70 },
    { date: 'Avr', score: 72 },
    { date: 'Mai', score: 75 },
    { date: 'Juin', score: 72 }
  ],
  alerts: [
    { id: 1, type: 'negative', platform: 'Google', rating: 2, text: "Temps d'attente trop long...", urgent: true },
    { id: 2, type: 'negative', platform: 'TripAdvisor', rating: 3, text: " Qualité food moyens...", urgent: false },
    { id: 3, type: 'warning', platform: 'Facebook', text: "8 avis sans réponse depuis 30j", urgent: false }
  ],
  strengths: [
    { id: 1, text: "Accueil chaleureux", mentions: 45, platform: "Multi-plateformes" },
    { id: 2, text: "Cuisine authentique", mentions: 38, platform: "Google" },
    { id: 3, text: "Cadre romantique", mentions: 32, platform: "TripAdvisor" }
  ],
  recommendations: [
    { id: 1, priority: 'high', title: "Répondre aux avis négatifs", impact: "+15% visibilité", effort: "10min" },
    { id: 2, priority: 'medium', title: "Améliorer les temps d'attente", impact: "+20% satisfaction", effort: "1 sem" },
    { id: 3, priority: 'low', title: "Demander des avis clients", impact: "+10% confiance", effort: "En cours" }
  ]
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-slate-300">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

const TimelineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-emerald-400">Score: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const data = DEMO_DATA

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">{data.restaurant.name}</h1>
                <p className="text-sm text-slate-500">{data.restaurant.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">Note moyenne</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{data.metrics.avgRating}</span>
              <span className="text-slate-400">/5</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">Total avis</span>
              <MessageCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{data.metrics.totalReviews}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">Score sentiment</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-emerald-600">{data.metrics.sentimentScore}</span>
              <span className="text-slate-400">%</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm">Taux de réponse</span>
              <CheckCircle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{data.metrics.responseRate}</span>
              <span className="text-slate-400">%</span>
            </div>
          </div>
        </section>

        {/* Main Charts Row */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Sentiment Donut */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">Répartition des sentiments</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.sentiment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.sentiment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-slate-600 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">Évolution du score</h3>
            <div className="h-64">
              <ResponsiveContainer2 width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip2 content={<TimelineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#16a34a' }}
                  />
                </LineChart>
              </ResponsiveContainer2>
            </div>
          </div>
        </section>

        {/* Alerts & Strengths Row */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Alerts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-slate-900">Alertes prioritaires</h3>
            </div>
            <div className="space-y-3">
              {data.alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${
                    alert.urgent
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.platform}
                        </span>
                        {alert.rating && (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < alert.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{alert.text}</p>
                    </div>
                    {alert.urgent && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-900">Points forts</h3>
            </div>
            <div className="space-y-3">
              {data.strengths.map(strength => (
                <div
                  key={strength.id}
                  className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900">{strength.text}</p>
                    <span className="text-emerald-600 font-semibold">+{strength.mentions}</span>
                  </div>
                  <p className="text-xs text-slate-500">{strength.platform}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-slate-900">Recommandations</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.recommendations.map(rec => (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {rec.priority === 'high' ? '🔴 Prioritaire' :
                     rec.priority === 'medium' ? '🟡 Moyen' : '🟢 En cours'}
                  </span>
                </div>
                <h4 className="font-medium text-slate-900 mb-3">{rec.title}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Impact: <span className="text-emerald-600 font-medium">{rec.impact}</span></span>
                  <span className="text-slate-400">{rec.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-4">
          <p className="text-sm text-slate-400">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </footer>
      </main>
    </div>
  )
}
