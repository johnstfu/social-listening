import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PLATFORMS = [
  {
    id: 'google',
    name: 'Google Business',
    icon: '🔍',
    description: 'Connectez votre fiche Google Business pour récupérer vos avis Google',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    connected: false
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    icon: '📘',
    description: 'Connectez votre page Facebook pour surveiller les avis et recommandations',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    connected: false
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    icon: '🦉',
    description: 'Entrez l\'URL de votre restaurant TripAdvisor',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    connected: false,
    urlBased: true
  },
  {
    id: 'yelp',
    name: 'Yelp',
    icon: '⭐',
    description: 'Entrez l\'URL de votre restaurant Yelp',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    connected: false,
    urlBased: true
  }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [connectedPlatforms, setConnectedPlatforms] = useState([])
  const [showUrlModal, setShowUrlModal] = useState(null)
  const [url, setUrl] = useState('')

  const handleConnect = (platformId) => {
    const platform = PLATFORMS.find(p => p.id === platformId)

    if (platform.urlBased) {
      setShowUrlModal(platformId)
    } else {
      // OAuth flow - rediriger vers le backend
      window.location.href = `http://localhost:8000/api/platforms/${platformId}/connect`
    }
  }

  const handleUrlSubmit = async () => {
    // TODO: Appeler l'API pour sauvegarder l'URL
    setConnectedPlatforms(prev => [...prev, showUrlModal])
    setShowUrlModal(null)
    setUrl('')
  }

  const handleSkip = () => {
    navigate('/')
  }

  const handleContinue = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Connectez vos plateformes</h1>
          <p className="text-slate-600 mt-2">
            Connectez au moins une plateforme pour commencer à surveiller vos avis
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {connectedPlatforms.length} plateforme(s) connectée(s)
            </span>
            <div className="flex gap-1">
              {PLATFORMS.map((p, i) => (
                <div
                  key={p.id}
                  className={`w-8 h-1 rounded-full ${
                    connectedPlatforms.includes(p.id) ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id)
            return (
              <div
                key={platform.id}
                className={`p-4 rounded-xl border-2 ${platform.color} transition-all`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{platform.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{platform.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{platform.description}</p>
                  </div>
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Connecté</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                      Connecter
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* URL Modal */}
        {showUrlModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Entrez l'URL de votre restaurant
              </h3>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tripadvisor.com/Restaurant_Review..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUrlModal(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUrlSubmit}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-700"
          >
            Passer cette étape
          </button>
          <button
            onClick={handleContinue}
            disabled={connectedPlatforms.length === 0}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-medium flex items-center gap-2"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
