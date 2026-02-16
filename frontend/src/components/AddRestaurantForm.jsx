import axios from 'axios'
import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AddRestaurantForm({ onAdded }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    email_alert: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Le nom du restaurant est requis")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await axios.post(`${API_URL}/api/restaurants`, {
        name: form.name,
        address: form.address || null,
        email_alert: form.email_alert || null
      })
      setSuccess(true)
      setForm({ name: '', address: '', email_alert: '' })
      if (onAdded) onAdded()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'ajout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">➕</span>
        Ajouter un restaurant
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du restaurant *
          </label>
          <input
            type="text"
            placeholder="Ex: Le Petit Bistrot"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse
          </label>
          <input
            type="text"
            placeholder="Ex: 12 Rue de la Paix, Paris"
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email pour les alertes
          </label>
          <input
            type="email"
            placeholder="Ex: owner@restaurant.fr"
            value={form.email_alert}
            onChange={e => setForm({...form, email_alert: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
            ✅ Restaurant ajouté avec succès !
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-coral-500 to-amber-500 text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le restaurant'}
        </button>
      </form>
    </div>
  )
}
