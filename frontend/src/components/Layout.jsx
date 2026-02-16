import axios from 'axios'
import { Database, Link2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const navItems = [
  { to: '/', icon: Database, label: 'Data', end: true },
  { to: '/connectivity', icon: Link2, label: 'Connectivité' },
]

export default function Layout() {
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)

  const restaurantId = 1 // Using restaurant ID 1 for demo

  // Fetch restaurant info on mount
  useEffect(() => {
    fetchRestaurant()
  }, [])

  const fetchRestaurant = async () => {
    try {
      setLoading(true)
      const restaurantRes = await axios.get(`${API_URL}/api/restaurants/${restaurantId}`)
      setRestaurant(restaurantRes.data)
    } catch (err) {
      console.error('Error fetching restaurant:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-base text-slate-900">Social Listening</h1>
                <p className="text-xs text-slate-400">
                  {loading ? 'Chargement...' : restaurant?.name || 'Dashboard'}
                </p>
              </div>
            </div>

            {/* Navigation Tabs - Centered */}
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Restaurant Info */}
            <div className="flex items-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : restaurant && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {restaurant?.name?.split(' ').map(w => w[0]).join('').substring(0, 2) || 'LB'}
                    </span>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-medium text-sm text-slate-900">{restaurant?.name}</p>
                    <p className="text-xs text-slate-400">
                      {restaurant?.address?.split(',').pop()?.trim() || 'Paris'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
