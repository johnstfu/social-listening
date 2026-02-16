import { format, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReviewCard({ review }) {
  const sentimentColors = {
    positive: 'bg-emerald-50 border-emerald-200 hover:shadow-emerald-100',
    neutral: 'bg-amber-50 border-amber-200 hover:shadow-amber-100',
    negative: 'bg-rose-50 border-rose-200 hover:shadow-rose-100'
  }

  const sentimentBadges = {
    positive: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '😊', label: 'Positif' },
    neutral: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '😐', label: 'Neutre' },
    negative: { bg: 'bg-rose-100', text: 'text-rose-700', icon: '😞', label: 'Négatif' }
  }

  const badge = sentimentBadges[review.sentiment] || sentimentBadges.neutral

  // Safe date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return ''
      return format(date, 'dd MMM yyyy', { locale: fr })
    } catch {
      return ''
    }
  }

  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-lg ${sentimentColors[review.sentiment] || 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{review.author || 'Anonyme'}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {review.source || 'Google'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500 mt-1">{review.rating}/5</span>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
        "{review.text || 'Aucun commentaire'}"
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
          <span>{badge.icon}</span>
          {badge.label}
        </span>
        {review.date && (
          <span className="text-xs text-gray-400">
            📅 {formatDate(review.date)}
          </span>
        )}
      </div>
    </div>
  )
}
