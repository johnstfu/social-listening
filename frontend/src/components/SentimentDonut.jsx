/**
 * SentimentDonut - Graphique Donut pour la répartition des sentiments
 * Utilise Recharts pour un rendu SVG performant
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  positive: '#22c55e',  // Vert
  neutral: '#6b7280',   // Gris
  negative: '#ef4444'   // Rouge
}

const LABELS = {
  positive: 'Positifs',
  neutral: 'Neutres',
  negative: 'Négatifs'
}

export default function SentimentDonut({ data, total }) {
  // Transformer les données pour Recharts
  const chartData = [
    { name: LABELS.positive, value: data.positive, color: COLORS.positive },
    { name: LABELS.neutral, value: data.neutral, color: COLORS.neutral },
    { name: LABELS.negative, value: data.negative, color: COLORS.negative }
  ]

  // Calculer le centre du donut pour afficher le total
  const CenterLabel = ({ cx, cy }) => (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-slate-900"
    >
      <tspan fontSize="24" fontWeight="bold">{total}</tspan>
      <tspan x={cx} dy="18" fontSize="12" fill="#64748b">avis</tspan>
    </text>
  )

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const percentage = ((item.value / total) * 100).toFixed(0)
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{item.name}</p>
          <p className="text-sm text-slate-600">
            {item.value} avis ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = () => (
    <div className="flex justify-center gap-4 mt-2">
      {chartData.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-600">
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Répartition Sentiment</h3>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {renderLegend()}
    </div>
  )
}
