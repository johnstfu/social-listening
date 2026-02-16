import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export default function SentimentChart({ sentiment }) {
  if (!sentiment || sentiment.total_reviews === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Aucune donnée disponible
      </div>
    )
  }

  const data = [
    { name: 'Positif', value: sentiment.positive || 0, color: '#10b981' },
    { name: 'Neutre', value: sentiment.neutral || 0, color: '#6366f1' },
    { name: 'Négatif', value: sentiment.negative || 0, color: '#f43f5e' },
  ]

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} avis`, '']}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-slate-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
