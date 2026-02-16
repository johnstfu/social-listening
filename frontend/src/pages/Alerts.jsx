import { AlertTriangle, Bell, CheckCircle, Clock, Mail } from 'lucide-react'

export default function Alerts() {
  // Mock alerts data
  const alerts = [
    {
      id: 1,
      type: 'negative_review',
      restaurant: 'Le Petit Bistrot',
      message: 'Nouvel avis négatif détecté (2⭐)',
      status: 'sent',
      created_at: '2026-02-15T10:30:00',
    },
    {
      id: 2,
      type: 'rating_drop',
      restaurant: 'Sushi Express',
      message: 'Note moyenne en baisse (4.2 → 3.9)',
      status: 'sent',
      created_at: '2026-02-14T15:45:00',
    },
    {
      id: 3,
      type: 'weekly_report',
      restaurant: 'Le Petit Bistrot',
      message: 'Rapport hebdomadaire généré',
      status: 'sent',
      created_at: '2026-02-12T09:00:00',
    },
  ]

  const alertTypes = {
    negative_review: { icon: AlertTriangle, color: 'rose', label: 'Avis négatif' },
    rating_drop: { icon: TrendingDown, color: 'amber', label: 'Baisse note' },
    weekly_report: { icon: Mail, color: 'blue', label: 'Rapport hebdo' },
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alertes</h1>
          <p className="text-slate-500 mt-1">Historique des notifications envoyées</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all">
          <Bell className="w-4 h-4" />
          Configurer
        </button>
      </div>

      {/* Alert Settings Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Paramètres d'alerte</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Avis négatifs</p>
                <p className="text-sm text-slate-500">Immédiat</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Baisse de note</p>
                <p className="text-sm text-slate-500">Seuil: -0.3</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Rapport hebdo</p>
                <p className="text-sm text-slate-500">Dimanche 9h</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const typeInfo = alertTypes[alert.type] || alertTypes.negative_review
            const Icon = typeInfo.icon
            return (
              <div key={alert.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-12 h-12 bg-${typeInfo.color}-100 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${typeInfo.color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{alert.message}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      alert.status === 'sent'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {alert.status === 'sent' ? 'Envoyé' : 'En attente'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{alert.restaurant}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  {new Date(alert.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Missing import
function TrendingDown(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
}
