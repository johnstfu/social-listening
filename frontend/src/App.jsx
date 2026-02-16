import axios from 'axios'
import { useEffect, useState } from 'react'
import AddRestaurantForm from './components/AddRestaurantForm'
import Dashboard from './components/Dashboard'
import ReviewCard from './components/ReviewCard'
import SentimentChart from './components/SentimentChart'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [sentiment, setSentiment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Charger les restaurants
  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurants`)
      setRestaurants(response.data)
      if (response.data.length > 0) {
        selectRestaurant(response.data[0])
      } else {
        setSelectedRestaurant(null)
        setReviews([])
        setSentiment(null)
      }
    } catch (error) {
      console.error('Erreur chargement restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant)
    try {
      // Charger les avis
      const reviewsRes = await axios.get(`${API_URL}/api/restaurants/${restaurant.id}/reviews`)
      setReviews(reviewsRes.data)

      // Charger le sentiment
      const sentimentRes = await axios.get(`${API_URL}/api/restaurants/${restaurant.id}/sentiment`)
      setSentiment(sentimentRes.data)
    } catch (error) {
      console.error('Erreur chargement données:', error)
    }
  }

  const handleSeedDemo = async () => {
    setSeeding(true)
    try {
      const res = await axios.post(`${API_URL}/api/seed-demo`)
      alert(`✅ ${res.data.message}\n\nRestaurants: ${res.data.restaurants}\nAvis: ${res.data.reviews}`)
      await fetchRestaurants()
    } catch (error) {
      alert('Erreur: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSeeding(false)
    }
  }

  const handleSync = async () => {
    if (!selectedRestaurant) return
    setSyncing(true)
    try {
      const res = await axios.post(`${API_URL}/api/restaurants/${selectedRestaurant.id}/sync-mock`)
      alert(`🔄 ${res.data.message}`)
      await selectRestaurant(selectedRestaurant)
    } catch (error) {
      alert('Erreur: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Social Listening</h1>
                <p className="text-sm text-gray-300">Monitoring avis restaurants</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Restaurant Selector */}
              {restaurants.length > 0 && (
                <select
                  value={selectedRestaurant?.id || ''}
                  onChange={(e) => {
                    const restaurant = restaurants.find(r => r.id === parseInt(e.target.value))
                    if (restaurant) selectRestaurant(restaurant)
                  }}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}

              {/* Sync Button */}
              {selectedRestaurant && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {syncing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Sync...
                    </>
                  ) : (
                    <>
                      🔄 Sync Google
                    </>
                  )}
                </button>
              )}

              {/* Demo Button */}
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-opacity"
              >
                {seeding ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Chargement...
                  </>
                ) : (
                  <>
                    🎲 Charger Démo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {selectedRestaurant && sentiment && (
          <>
            {/* Dashboard KPIs */}
            <Dashboard
              restaurant={selectedRestaurant}
              sentiment={sentiment}
            />

            {/* Chart */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analyse Sentiment</h2>
              <SentimentChart sentiment={sentiment} />
            </div>

            {/* Reviews List */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Derniers Avis</h2>
                <span className="text-sm text-gray-500">{reviews.length} avis au total</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviews.slice(0, 9).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              {reviews.length > 9 && (
                <div className="mt-4 text-center">
                  <button className="text-coral-600 hover:text-coral-700 font-medium">
                    Voir tous les avis ({reviews.length - 9} de plus)
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {restaurants.length === 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Formulaire */}
            <AddRestaurantForm onAdded={fetchRestaurants} />

            {/* Message */}
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🍽️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bienvenue sur Social Listening
              </h3>
              <p className="text-gray-500 mb-6">
                Ajoutez votre premier restaurant ou chargez les données de démonstration pour découvrir l'interface.
              </p>
              <button
                onClick={handleSeedDemo}
                disabled={seeding}
                className="bg-gradient-to-r from-coral-500 to-amber-500 text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {seeding ? 'Chargement...' : '🎲 Charger les données de démo'}
              </button>
              <p className="mt-4 text-sm text-gray-400">
                2 restaurants • 20 avis • Analyse de sentiment
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Social Listening MVP v1.0</span>
            <span>Propulsé par NikMacron Framework</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
