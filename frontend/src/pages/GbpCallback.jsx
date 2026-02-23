import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

export default function GbpCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [locations, setLocations] = useState([])
  const [step, setStep] = useState('connecting') // connecting, select_account, select_location, done

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      setError('Code d\'autorisation manquant')
      setLoading(false)
      return
    }

    // Échanger le code contre un token
    api.get(`/api/oauth/gbp/callback?code=${code}&state=${state || 'default'}`)
      .then(res => {
        // Sauvegarder le token dans localStorage
        if (res.data.access_token) {
          localStorage.setItem('gbp_access_token', res.data.access_token)
        }
        if (res.data.refresh_token) {
          localStorage.setItem('gbp_refresh_token', res.data.refresh_token)
        }
        if (res.data.expires_at) {
          localStorage.setItem('gbp_expires_at', res.data.expires_at)
        }

        if (res.data.accounts && res.data.accounts.length > 0) {
          setAccounts(res.data.accounts)
          setStep('select_account')
        } else {
          setError('Aucun compte Google Business trouvé')
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Erreur connexion Google Business')
        setLoading(false)
      })
  }, [searchParams])

  const handleSelectAccount = (accountName) => {
    setSelectedAccount(accountName)
    setLoading(true)

    const token = localStorage.getItem('gbp_access_token')
    api.get(`/api/oauth/gbp/locations?access_token=${token}&account_name=${accountName}`)
      .then(res => {
        setLocations(res.data.locations || [])
        setStep('select_location')
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Erreur récupération des établissements')
        setLoading(false)
      })
  }

  const handleSelectLocation = async (location) => {
    setLoading(true)

    // Récupérer les tokens
    const token = localStorage.getItem('token')
    const gbpAccessToken = localStorage.getItem('gbp_access_token')
    const gbpRefreshToken = localStorage.getItem('gbp_refresh_token')
    const gbpExpiresAt = localStorage.getItem('gbp_expires_at')

    try {
      // Sauvegarder la connexion dans le backend
      const response = await api.post(`/api/oauth/save-connection`, null, {
        params: {
          platform: 'google_business',
          access_token: gbpAccessToken,
          refresh_token: gbpRefreshToken,
          expires_at: gbpExpiresAt,
          location_name: location.name,
          location_title: location.title,
          location_address: location.address,
        }
      })

      console.log('Connection saved:', response.data)

      // Rediriger vers la page de connectivité
      setStep('done')
      setTimeout(() => {
        navigate('/?connected=gbp')
      }, 2000)
    } catch (err) {
      console.error('Error saving connection:', err)
      setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde de la connexion')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Erreur de connexion</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">
            {step === 'connecting' && 'Connexion à Google Business...'}
            {step === 'select_account' && 'Chargement des établissements...'}
          </p>
        </div>
      </div>
    )
  }

  if (step === 'select_account') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-lg w-full">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 text-center">Sélectionnez un compte</h2>
          <p className="text-slate-600 text-center mb-6">Choisissez le compte Google Business à connecter</p>

          <div className="space-y-3">
            {accounts.map((account, index) => (
              <button
                key={index}
                onClick={() => handleSelectAccount(account.name)}
                className="w-full p-4 border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-950/20 transition text-left"
              >
                <div className="font-medium text-white">{account.accountName || account.name}</div>
                <div className="text-sm text-slate-500">{account.type || 'Business'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'select_location') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2 text-center">Sélectionnez votre établissement</h2>
          <p className="text-slate-600 text-center mb-6">{locations.length} établissement(s) trouvé(s)</p>

          {locations.length === 0 ? (
            <p className="text-center text-slate-500">Aucun établissement trouvé pour ce compte</p>
          ) : (
            <div className="space-y-3">
              {locations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(location)}
                  className="w-full p-4 border border-slate-200 rounded-xl hover:border-orange-500 hover:bg-orange-950/20 transition text-left"
                >
                  <div className="font-medium text-white">{location.title}</div>
                  <div className="text-sm text-slate-500">{location.address}</div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 px-6 py-2 border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 transition"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connexion réussie!</h2>
          <p className="text-slate-600">Votre établissement Google Business est maintenant connecté.</p>
          <p className="text-sm text-slate-500 mt-2">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return null
}
