/**
 * CategoryAnalysis - Graphique en barres horizontales empilées
 * Catégories: Service, Ambiance, Prix, etc.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const COLORS = {
  positive: '#22c55e',
  neutral: '#6b7280',
  negative: '#ef4444'
}

// Données mock pour les catégories avec noms courts
const DEFAULT_DATA = [
  { name: 'Service', shortName: 'Service', positive: 18, neutral: 4, negative: 6, total: 28 },
  { name: 'Ambiance', shortName: 'Ambiance', positive: 22, neutral: 3, negative: 3, total: 28 },
  { name: 'Prix', shortName: 'Prix', positive: 12, neutral: 8, negative: 8, total: 28 },
  { name: 'Rapport qualité/prix', shortName: 'Rapport Q/P', positive: 10, neutral: 10, negative: 8, total: 28 },
  { name: 'Propreté', shortName: 'Propreté', positive: 20, neutral: 5, negative: 3, total: 28 },
  { name: 'Emplacement', shortName: 'Emplacement', positive: 25, neutral: 3, negative: 0, total: 28 },
  { name: 'Parking', shortName: 'Parking', positive: 8, neutral: 12, negative: 8, total: 28 }
]

export default function CategoryAnalysis({ data: externalData }) {
  const data = externalData || DEFAULT_DATA

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.value} ({Math.round(entry.value / total * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Analyse par Catégorie</h3>
        <span className="text-xs text-slate-500">Nombre de mentions par catégorie</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 20, bottom: 20 }}
            barSize={16}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 28]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              ticks={[0, 7, 14, 21, 28]}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 11, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />

            {/* Barres empilées */}
            <Bar
              dataKey="positive"
              name="Positif"
              stackId="a"
              fill={COLORS.positive}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="neutral"
              name="Neutre"
              stackId="a"
              fill={COLORS.neutral}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="negative"
              name="Négatif"
              stackId="a"
              fill={COLORS.negative}
              radius={[4, 4, 4, 4]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.positive }} />
          <span className="text-xs text-slate-600">Positif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.neutral }} />
          <span className="text-xs text-slate-600">Neutre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.negative }} />
          <span className="text-xs text-slate-600">Négatif</span>
        </div>
      </div>

      {/* Insights rapides */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">
              <strong>Point fort:</strong> Emplacement (100% positif)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-slate-600">
              <strong>À améliorer:</strong> Parking (29% négatif)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
