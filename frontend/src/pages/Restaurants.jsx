import axios from 'axios'
import { Mail, MapPin, MoreVertical, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', email_alert: '' })

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurants`)
      setRestaurants(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/api/restaurants`, form)
      setForm({ name: '', address: '', email_alert: '' })
      setShowForm(false)
      fetchRestaurants()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSeedDemo = async () => {
    try {
      await axios.post(`${API_URL}/api/seed-demo`)
      fetchRestaurants()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Restaurants</h1>
          <p className="text-slate-500 mt-1">Gérez vos établissements monitorés</p>
        </div>
        <div className="flex items-center gap-3">
          {restaurants.length === 0 && (
            <button
              onClick={handleSeedDemo}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all"
            >
              🎲 Charger Démo
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Add Restaurant Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Ajouter un restaurant</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Le Petit Bistrot"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 12 Rue de la Paix, Paris"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email alertes</label>
                <input
                  type="email"
                  value={form.email_alert}
                  onChange={e => setForm({...form, email_alert: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: owner@restaurant.fr"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:opacity-90 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restaurant Cards */}
      {restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🍽️</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun restaurant</h3>
          <p className="text-slate-500 mb-6">Ajoutez votre premier restaurant pour commencer le monitoring.</p>
          <button
            onClick={handleSeedDemo}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all"
          >
            🎲 Charger les données de démo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {restaurant.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{restaurant.name}</h3>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Actif</span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {restaurant.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {restaurant.address}
                  </div>
                )}
                {restaurant.email_alert && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {restaurant.email_alert}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900">--</p>
                  <p className="text-xs text-slate-500">Avis</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">--</p>
                  <p className="text-xs text-slate-500">Note</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">--%</p>
                  <p className="text-xs text-slate-500">Positif</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
