import { ArrowRight, Building2, CheckCircle, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const CATEGORIES = [
  'Restaurant',
  'Boulangerie / Pâtisserie',
  'Boucherie / Charcuterie',
  'Salon de coiffure',
  'Institut de beauté',
  'Pharmacie',
  'Hôtel',
  'Café / Bar',
  'Épicerie / Supermarché',
  'Autre commerce',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [restaurant, setRestaurant] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', address: '' })

  const handleCreateRestaurant = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/restaurants', form)
      setRestaurant(res.data)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGMB = async () => {
    try {
      const res = await api.get('/api/auth/gbp/url')
      window.location.href = res.data.url
    } catch {
      setStep(3)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <span className="text-2xl">📡</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Radar</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s < step
                    ? 'bg-orange-500 text-white'
                    : s === step
                    ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-14 h-0.5 mx-1 transition-colors ${
                    s < step ? 'bg-orange-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          {/* Étape 1 : Infos établissement */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Votre établissement</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Ces informations nous permettent de configurer votre tableau de bord
                </p>
              </div>

              <form onSubmit={handleCreateRestaurant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nom de l'établissement
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="Le Bistrot du Coin"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Adresse{' '}
                    <span className="text-slate-500 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="12 Rue de la Paix, Paris 75002"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-950 border border-red-800 text-red-400 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity"
                >
                  {loading ? 'Création...' : 'Suivant'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}

          {/* Étape 2 : Connexion GMB */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Connectez Google Business</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Synchronisez vos avis Google automatiquement
                </p>
              </div>

              <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🔍</span>
                  <div>
                    <h3 className="font-medium text-white text-sm">Google Business Profile</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Connectez votre fiche GMB pour récupérer vos avis Google, votre note globale et
                      l'analyse de sentiment en temps réel.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnectGMB}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 py-3 rounded-lg font-medium text-slate-800 transition-colors mb-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connecter Google Business Profile
              </button>

              <button
                onClick={() => setStep(3)}
                className="w-full text-slate-500 hover:text-slate-400 text-sm py-2 transition-colors"
              >
                Passer → configurer plus tard
              </button>
            </>
          )}

          {/* Étape 3 : Succès */}
          {step === 3 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Radar est prêt !</h2>
              <p className="text-slate-400 text-sm mb-6">
                <span className="font-medium text-white">{restaurant?.name}</span> est configuré.
                Vous pouvez maintenant suivre vos avis et votre réputation.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-opacity"
              >
                Accéder à mon dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
