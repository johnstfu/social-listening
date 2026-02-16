import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Generate mock data for the last 30 days
const generateChartData = () => {
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 29)

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Generate sentiment scores between -1 and 1
    const positiveScore = Math.random() * 0.8 + 0.1 // 0.1 to 0.9
    const negativeScore = -(Math.random() * 0.6 + 0.1) // -0.7 to -0.1

    data.push({
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      positifs: parseFloat(positiveScore.toFixed(2)),
      negatifs: parseFloat(negativeScore.toFixed(2)),
    })
  }
  return data
}

export default function SentimentLineChart({ sentiment }) {
  const chartData = generateChartData()

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickLine={{ stroke: '#e2e8f0' }}
            axisLine={{ stroke: '#e2e8f0' }}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              backgroundColor: 'white'
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="positifs"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Positifs"
          />
          <Line
            type="monotone"
            dataKey="negatifs"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Négatifs"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
