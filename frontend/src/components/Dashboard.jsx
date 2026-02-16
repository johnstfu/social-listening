
export default function Dashboard({ restaurant, sentiment }) {
  const totalReviews = sentiment.total_reviews || 0
  const positivePercent = totalReviews > 0 ? Math.round((sentiment.positive / totalReviews) * 100) : 0
  const negativePercent = totalReviews > 0 ? Math.round((sentiment.negative / totalReviews) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Total Reviews */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Avis</p>
            <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
          </div>
        </div>
      </div>

      {/* Positive */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">😊</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Positifs</p>
            <p className="text-2xl font-bold text-green-600">
              {sentiment.positive}
              <span className="text-sm font-normal text-gray-400 ml-1">({positivePercent}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Neutral */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">😐</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Neutres</p>
            <p className="text-2xl font-bold text-yellow-600">{sentiment.neutral}</p>
          </div>
        </div>
      </div>

      {/* Negative */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">😟</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Négatifs</p>
            <p className="text-2xl font-bold text-red-600">
              {sentiment.negative}
              <span className="text-sm font-normal text-gray-400 ml-1">({negativePercent}%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
