/**
 * Social Listening Dashboard - UX/UI Optimized Version
 * Based on user's recommendations
 */

import { useState, useEffect } from 'react'
import {
  Star, TrendingUp, TrendingDown, MessageCircle, CheckCircle,
  RefreshCw, AlertTriangle, ThumbsUp, ExternalLink, Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Demo data - would come from API in production
const DEMO_DATA = {
  restaurant: {
    name: "Le Petit Bistrot",
    address: "Paris, France",
    platform: "Google My Business"
  },
  metrics: {
    avgRating: { value: 4.2, max: 5, trend: 0.3, trendLabel: "vs mois dernier" },
    totalReviews: { value: 156, trend: 12, trendLabel: "ce mois" },
    sentimentScore: { value: 72, trend: 5, trendLabel: "vs mois dernier" },
    responseRate: { value: 85, trend: 3, trendLabel: "vs mois dernier" }
  },
  sentiment: [
    { label: 'Positifs', emoji: '😊', value: 72, count: 112, color: '#10B981' },
    { label: 'Neutres', emoji: '😐', value: 20, count: 31, color: '#6B7280' },
    { label: 'Négatifs', emoji: '😞', value: 8, count: 13, color: '#EF4444' }
  ],
  timeline: [
    { month: 'Jan', score: 65 },
    { month: 'Fév', score: 68 },
    { month: 'Mar', score: 70 },
    { month: 'Avr', score: 71 },
    { month: 'Mai', score: 72 },
    { month: 'Juin', score: 72 }
  ],
  alerts: [
    {
      id: 1,
      type: 'urgent',
      platform: 'Google My Business',
      title: '5 avis négatifs mentionnent "temps d\'attente"',
      context: '📊 Tendance : 5 mentions en 7 jours (vs 1/semaine habituellement)\n📉 Impact estimé : -0.2 pts note si non traité',
      action1: 'Voir les 5 avis',
      action2: 'Plan d\'action IA'
    },
    {
      id: 2,
      type: 'warning',
      platform: 'Google My Business',
      title: '3 avis sans réponse depuis 7 jours',
      context: '📊 Impact : Votre taux de réponse passe de 85% à 82%',
      action1: 'Répondre maintenant'
    }
  ],
  strengths: [
    {
      id: 1,
      emoji: '😊',
      title: 'Accueil chaleureux',
      mentions: 45,
      example: '"Service très attentionné" - Marie L.'
    },
    {
      id: 2,
      emoji: '🍽️',
      title: 'Cuisine authentique',
      mentions: 38,
      example: '"Bœuf bourguignon excellent" - Jean D.'
    },
    {
      id: 3,
      emoji: '❤️',
      title: 'Cadre romantique',
      mentions: 32,
      example: '"Parfait pour un tête-à-tête" - Sophie M.'
    }
  ],
  recommendations: [
    {
      id: 1,
      priority: 'high',
      priorityLabel: 'PRIORITAIRE',
      time: '15min',
      title: 'Répondre aux 5 avis négatifs récents',
      why: 'Montrer votre réactivité + améliorer perception',
      impact: '+15% visibilité GMB estimée',
      actions: ['Voir templates de réponse', 'Accéder aux avis'],
      aiTips: ['Répondre sous 24h max', 'Montrer empathie + actions correctives', 'Personnaliser chaque réponse']
    },
    {
      id: 2,
      priority: 'medium',
      priorityLabel: 'MOYEN TERME',
      time: '1 semaine',
      title: 'Résoudre problème "temps d\'attente"',
      why: 'Sujet récurrent (8 mentions en 14j)',
      impact: '+20% satisfaction client estimée',
      actions: ['Plan d\'action détaillé']
    },
    {
      id: 3,
      priority: 'low',
      priorityLabel: 'EN COURS',
      time: '',
      status: '✓ 2/4 actions complétées',
      progress: 50,
      title: 'Augmenter volume d\'avis positifs',
      actions: ['Voir progression']
    }
  ]
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 600, margin: 0 }}>{payload[0].payload.month}</p>
        <p style={{ color: '#10B981', fontWeight: 600, margin: '4px 0 0' }}>
          {payload[0].value}% positif
        </p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setLastUpdate(new Date())
    }, 1000)
  }

  const data = DEMO_DATA

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 600, color: '#111827' }}>
            {data.restaurant.name}
          </h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
            📍 {data.restaurant.address} • {data.restaurant.platform}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={handleRefresh}
            style={{
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        background: 'white',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '6px',
          background: '#EFF6FF',
          color: '#3B82F6',
          fontSize: '14px',
          fontWeight: 500
        }}>
          <span>📊</span>
          <span>Dashboard</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '6px',
          color: '#6B7280',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          <span>⚙️</span>
          <span>Configuration API</span>
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

        {/* KPIs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Note Moyenne */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>Note moyenne</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 600, color: '#111827' }}>
                {data.metrics.avgRating.value}
              </span>
              <span style={{ color: '#6B7280' }}>/{data.metrics.avgRating.max}</span>
              <span style={{
                fontSize: '14px',
                color: data.metrics.avgRating.trend >= 0 ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {data.metrics.avgRating.trend >= 0 ? '↗' : '↘'} {Math.abs(data.metrics.avgRating.trend)}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {data.metrics.avgRating.trendLabel}
            </span>
          </div>

          {/* Total Avis */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>Total avis</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 600, color: '#111827' }}>
                {data.metrics.totalReviews.value}
              </span>
              <span style={{
                fontSize: '14px',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                ↗ +{data.metrics.totalReviews.trend}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {data.metrics.totalReviews.trendLabel}
            </span>
          </div>

          {/* Score Sentiment */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>Score sentiment</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 600, color: '#10B981' }}>
                {data.metrics.sentimentScore.value}
              </span>
              <span style={{ color: '#6B7280' }}>%</span>
              <span style={{
                fontSize: '14px',
                color: data.metrics.sentimentScore.trend >= 0 ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {data.metrics.sentimentScore.trend >= 0 ? '↗' : '↘'} {Math.abs(data.metrics.sentimentScore.trend)}%
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {data.metrics.sentimentScore.trendLabel}
            </span>
          </div>

          {/* Taux de réponse */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>Taux de réponse</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 600, color: '#111827' }}>
                {data.metrics.responseRate.value}
              </span>
              <span style={{ color: '#6B7280' }}>%</span>
              <span style={{
                fontSize: '14px',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                ↗ +{data.metrics.responseRate.trend}%
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {data.metrics.responseRate.trendLabel}
            </span>
          </div>
        </div>

        {/* 2 Columns: Evolution + Sentiment */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Evolution Chart */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              Évolution du score sentiment
            </h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              Répartition des sentiments ({data.metrics.totalReviews.value} avis)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.sentiment.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.emoji} {item.label}
                  </span>
                  <div style={{ background: '#F3F4F6', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{
                      background: item.color,
                      height: '100%',
                      width: `${item.value}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: item.color, textAlign: 'right' }}>
                    {item.value}% ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 Alertes GMB <span style={{ fontSize: '12px', fontWeight: 400, color: '#6B7280' }}>(détectées par IA)</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.alerts.map(alert => (
              <div key={alert.id} style={{
                background: alert.type === 'urgent' ? '#FEF2F2' : '#FFFBEB',
                borderLeft: `4px solid ${alert.type === 'urgent' ? '#DC2626' : '#F59E0B'}`,
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: alert.type === 'urgent' ? '#DC2626' : '#F59E0B',
                    color: 'white'
                  }}>
                    {alert.type === 'urgent' ? '🔴 URGENT' : '🟡 ATTENTION'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>{alert.platform}</span>
                </div>
                <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                  {alert.title}
                </h4>
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#6B7280',
                  whiteSpace: 'pre-line',
                  marginBottom: '12px'
                }}>
                  {alert.context}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}>
                    {alert.action1} →
                  </button>
                  {alert.action2 && (
                    <button style={{
                      background: 'white',
                      color: '#3B82F6',
                      border: '1px solid #3B82F6',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}>
                      {alert.action2}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2 Columns: Strengths + Recommendations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          {/* Points Forts */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💪 Vos points forts GMB
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.strengths.map(strength => (
                <div key={strength.id} style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{strength.emoji}</span>
                    <h4 style={{ flex: 1, margin: 0, fontSize: '16px', fontWeight: 500, color: '#111827' }}>
                      {strength.title}
                    </h4>
                    <span style={{
                      background: '#D1FAE5',
                      color: '#059669',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>
                      +{strength.mentions}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0' }}>
                    Mentionné dans {strength.mentions} avis positifs
                  </p>
                  <p style={{
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: '#4B5563',
                    marginTop: '8px',
                    paddingLeft: '12px',
                    borderLeft: '3px solid #D1FAE5'
                  }}>
                    {strength.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommandations */}
          <div style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 Recommandations IA <span style={{ fontSize: '12px', fontWeight: 400, color: '#6B7280' }}>(générées automatiquement)</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.recommendations.map(rec => (
                <div key={rec.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: rec.priority === 'high' ? '#FEE2E2' : rec.priority === 'medium' ? '#FEF3C7' : '#D1FAE5',
                      color: rec.priority === 'high' ? '#DC2626' : rec.priority === 'medium' ? '#D97706' : '#059669'
                    }}>
                      {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} {rec.priorityLabel}
                    </span>
                    {rec.time && (
                      <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⏱️ {rec.time}
                      </span>
                    )}
                    {rec.status && (
                      <span style={{ fontSize: '12px', color: '#059669' }}>
                        {rec.status}
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 500, color: '#111827' }}>
                    {rec.title}
                  </h4>
                  <div style={{
                    background: '#F9FAFB',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '4px 0' }}><strong>Pourquoi :</strong> {rec.why}</p>
                    <p style={{ margin: '4px 0' }}><strong>Impact :</strong> {rec.impact}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {rec.actions.map((action, i) => (
                      <button key={i} style={{
                        background: i === 0 ? '#3B82F6' : 'white',
                        color: i === 0 ? 'white' : '#3B82F6',
                        border: i === 0 ? 'none' : '1px solid #3B82F6',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}>
                        {action}
                      </button>
                    ))}
                  </div>
                  {rec.aiTips && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#EFF6FF',
                      borderLeft: '3px solid #3B82F6',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}>
                      <p style={{ margin: '0 0 8px', fontWeight: 500 }}>💡 <strong>L'IA recommande :</strong></p>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {rec.aiTips.map((tip, i) => (
                          <li key={i} style={{ margin: '4px 0' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rec.progress && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ background: '#F3F4F6', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: '#10B981', height: '100%', width: `${rec.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
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
