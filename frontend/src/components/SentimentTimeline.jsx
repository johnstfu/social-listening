/**
 * SentimentTimeline - Graphique d'évolution temporelle du sentiment
 * Courbes bipolaires (-1 à +1) distinguant sentiments positifs et négatifs
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'
import { format, subDays } from 'date-fns'

// Générer des données mock pour 30 jours (un point tous les 3 jours pour lisibilité)
function generateMockData() {
  const data = []
  for (let i = 29; i >= 0; i -= 3) {
    const date = subDays(new Date(), i)
    const positiveScore = Math.random() * 0.6 + 0.2  // 0.2 à 0.8
    const negativeScore = -(Math.random() * 0.4 + 0.1)  // -0.5 à -0.1

    data.push({
      date: format(date, 'dd MMM'),
      positive: positiveScore,
      negative: negativeScore,
    })
  }
  return data
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
}

export default function SentimentTimeline({ data: externalData }) {
  const data = externalData || generateMockData()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value > 0 ? '+' : ''}{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Évolution sur 30 jours</h3>
        <span className="text-xs text-slate-500">Score de -1 (négatif) à +1 (positif)</span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              width={40}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Ligne de référence à 0 */}
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

            {/* Zone positive (fond vert) */}
            <Area
              type="monotone"
              dataKey="positive"
              stroke="none"
              fill="url(#positiveGradient)"
              fillOpacity={0.3}
            />

            {/* Zone négative (fond rouge) */}
            <Area
              type="monotone"
              dataKey="negative"
              stroke="none"
              fill="url(#negativeGradient)"
              fillOpacity={0.3}
            />

            {/* Courbe positive */}
            <Line
              type="monotone"
              dataKey="positive"
              name="Positif"
              stroke={COLORS.positive}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.positive }}
            />

            {/* Courbe négative */}
            <Line
              type="monotone"
              dataKey="negative"
              name="Négatif"
              stroke={COLORS.negative}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.negative }}
            />

            {/* Définition des gradients */}
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.positive} stopOpacity={0.4} />
                <stop offset="100%" stopColor={COLORS.positive} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={COLORS.negative} stopOpacity={0.4} />
                <stop offset="100%" stopColor={COLORS.negative} stopOpacity={0} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.positive }} />
          <span className="text-xs text-slate-600">Sentiment positif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS.negative }} />
          <span className="text-xs text-slate-600">Sentiment négatif</span>
        </div>
      </div>
    </div>
  )
}
