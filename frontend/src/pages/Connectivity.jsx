import axios from 'axios'
import {
    CheckCircle,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
    X
} from 'lucide-react'
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Platform icons mapping
const platformIcons = {
  'google': '🔍',
  'google_business': '🏢',
  'tripadvisor': '🦉',
  'yelp': '⭐',
  'facebook': '📘',
}

const availablePlatforms = [
  { name: 'google_business', displayName: 'Google Business', icon: '🏢', type: 'oauth' },
  { name: 'tripadvisor', displayName: 'TripAdvisor', icon: '🦉', type: 'url' },
  { name: 'yelp', displayName: 'Yelp', icon: '⭐', type: 'url' },
  { name: 'facebook', displayName: 'Facebook', icon: '📘', type: 'oauth' },
]

export default function Connectivity() {
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [syncingId, setSyncingId] = useState(null)
  const [addingPlatform, setAddingPlatform] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const restaurantId = 1

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/api/restaurants/${restaurantId}/connections`)
      setPlatforms(response.data)
    } catch (err) {
      console.error('Error fetching connections:', err)
      setError('Impossible de charger les connexions')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (id) => {
    try {
      setSyncingId(id)
      const response = await axios.post(`${API_URL}/api/connections/${id}/sync`)
      setPlatforms(platforms.map(p =>
        p.id === id ? {
          ...p,
          last_sync: response.data.last_sync,
          reviews_count: response.data.reviews_count,
          avg_rating: response.data.avg_rating
        } : p
      ))
    } catch (err) {
      console.error('Error syncing connection:', err)
      setError('Erreur lors de la synchronisation')
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnect = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter cette plateforme ?')) {
      return
    }

    try {
      setDeletingId(id)
      await axios.delete(`${API_URL}/api/connections/${id}`)
      setPlatforms(platforms.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error disconnecting platform:', err)
      setError('Erreur lors de la déconnexion')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddPlatform = async () => {
    if (!selectedPlatform) return

    // Si c'est une plateforme OAuth, rediriger vers l'URL d'autorisation
    if (selectedPlatform.type === 'oauth') {
      try {
        const response = await axios.get(`${API_URL}/api/oauth/${selectedPlatform.name === 'google_business' ? 'gbp' : 'facebook'}/url`)
        window.location.href = response.data.auth_url
      } catch (err) {
        console.error('Error getting OAuth URL:', err)
        setError('Erreur lors de la connexion OAuth')
      }
      return
    }

    // Pour les plateformes URL-based (TripAdvisor, Yelp)
    if (!apiKey || !placeId) return

    try {
      setAddingPlatform(true)
      const response = await axios.post(`${API_URL}/api/restaurants/${restaurantId}/connections`, {
        platform_name: selectedPlatform.name,
        api_key: apiKey,
        place_id: placeId
      })
      setPlatforms([...platforms, response.data])
      setShowAddModal(false)
      setSelectedPlatform(null)
      setApiKey('')
      setPlaceId('')
    } catch (err) {
      console.error('Error adding platform:', err)
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Erreur lors de la connexion de la plateforme')
      }
    } finally {
      setAddingPlatform(false)
    }
  }

  const formatLastSync = (dateString) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${diffDays}j`
  }

  const getPlatformIcon = (platformName) => {
    return platformIcons[platformName.toLowerCase()] || '🔌'
  }

  const getPlatformDisplayName = (platformName) => {
    const platform = availablePlatforms.find(p => p.name === platformName.toLowerCase())
    return platform?.displayName || platformName
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Connectivité</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gérez vos connexions aux plateformes d'avis</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une plateforme
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connected Platforms */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Plateformes connectées</h2>
        </div>

        {platforms.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔌</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune plateforme connectée</h3>
            <p className="text-slate-500 mb-4">
              Connectez vos plateformes d'avis pour commencer à collecter des données.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une plateforme
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {platforms.map((platform) => (
              <div key={platform.id} className="p-4 flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                  {getPlatformIcon(platform.platform_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">{getPlatformDisplayName(platform.platform_name)}</h3>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Connecté
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span>{platform.reviews_count || 0} avis</span>
                    <span>•</span>
                    <span>Note: {platform.avg_rating?.toFixed(1) || 'N/A'}⭐</span>
                    <span>•</span>
                    <span>Sync: {formatLastSync(platform.last_sync)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(platform.id)}
                    disabled={syncingId === platform.id}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingId === platform.id ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    disabled={deletingId === platform.id}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === platform.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Déconnecter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Platforms */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Plateformes disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {availablePlatforms.map((platform) => (
            <button
              key={platform.name}
              onClick={() => {
                setSelectedPlatform(platform)
                setShowAddModal(true)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
            >
              <span>{platform.icon}</span>
              {platform.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => !addingPlatform && setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Ajouter une plateforme</h2>
              <button
                onClick={() => !addingPlatform && setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={addingPlatform}
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Platform Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sélectionnez une plateforme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => setSelectedPlatform(platform)}
                    disabled={addingPlatform}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      selectedPlatform?.name === platform.name
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{platform.icon}</span>
                    <span className="text-sm font-medium">{platform.displayName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* OAuth Platform Info */}
            {selectedPlatform?.type === 'oauth' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>{selectedPlatform.displayName}</strong> utilise une connexion sécurisée OAuth.
                  Cliquez sur "Connecter" pour être redirigé vers la page d'autorisation.
                </p>
              </div>
            )}

            {/* API Key - Only for URL-based platforms */}
            {selectedPlatform?.type !== 'oauth' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Clé API
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Entrez votre clé API"
                  disabled={addingPlatform}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100"
                />
              </div>
            )}

            {/* Place ID - Only for URL-based platforms */}
            {selectedPlatform?.type !== 'oauth' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ID du lieu / Place ID
                </label>
                <input
                  type="text"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="Entrez l'ID de votre établissement"
                  disabled={addingPlatform}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addingPlatform}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPlatform}
                disabled={!selectedPlatform || (selectedPlatform?.type !== 'oauth' && (!apiKey || !placeId)) || addingPlatform}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              >
                {addingPlatform ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    {selectedPlatform?.type === 'oauth' && (
                      <span className="text-lg">
                        {selectedPlatform.name === 'google_business' ? '🔗' : '📘'}
                      </span>
                    )}
                    Connecter {selectedPlatform?.type === 'oauth' ? `avec ${selectedPlatform.displayName}` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-slate-400">
        <p>Les données sont synchronisées automatiquement toutes les 6 heures</p>
      </div>
    </div>
  )
}
