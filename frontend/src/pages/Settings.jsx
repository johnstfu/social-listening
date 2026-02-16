import { Bell, Database, HelpCircle, Mail, Save, Settings as SettingsIcon, Shield, User } from 'lucide-react'
import { useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    email: 'restaurant@exemple.com',
    notifications: {
      negativeReviews: true,
      ratingDrop: true,
      weeklyReport: true,
      competitorMentions: false,
    },
    thresholds: {
      ratingDrop: 0.3,
      negativeRating: 3,
    },
  })

  const handleSave = () => {
    // TODO: Save to backend
    alert('Paramètres sauvegardés !')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-slate-500 mt-1">Configuration de votre compte</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all"
        >
          <Save className="w-4 h-4" />
          Sauvegarder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {[
              { id: 'account', icon: User, label: 'Compte' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'email', icon: Mail, label: 'Email' },
              { id: 'security', icon: Shield, label: 'Sécurité' },
              { id: 'data', icon: Database, label: 'Données' },
              { id: 'help', icon: HelpCircle, label: 'Aide' },
            ].map((item, index) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors ${
                  index === 0 ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500' : 'text-slate-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Informations du compte
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  Changer le mot de passe
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-400" />
              Préférences de notification
            </h2>
            <div className="space-y-4">
              {[
                { key: 'negativeReviews', label: 'Avis négatifs', desc: 'Recevoir une alerte pour chaque avis négatif' },
                { key: 'ratingDrop', label: 'Baisse de note', desc: 'Alerte si la note moyenne baisse significativement' },
                { key: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Recevoir un résumé chaque semaine' },
                { key: 'competitorMentions', label: 'Mentions concurrents', desc: 'Alerte si un concurrent est mentionné' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications[item.key]}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, [item.key]: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Threshold Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-slate-400" />
              Seuils d'alerte
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Baisse de note (seuil)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.thresholds.ratingDrop}
                  onChange={(e) => setSettings({
                    ...settings,
                    thresholds: { ...settings.thresholds, ratingDrop: parseFloat(e.target.value) }
                  })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-sm text-slate-500 mt-1">Déclenche une alerte si la note baisse de cette valeur</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Note négative (seuil)
                </label>
                <input
                  type="number"
                  value={settings.thresholds.negativeRating}
                  onChange={(e) => setSettings({
                    ...settings,
                    thresholds: { ...settings.thresholds, negativeRating: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-sm text-slate-500 mt-1">Avis considéré comme négatif si ≤ cette note</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
