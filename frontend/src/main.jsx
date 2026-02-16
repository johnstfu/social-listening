import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import './index.css'
import Auth from './pages/Auth'
import Connectivity from './pages/Connectivity'
import Dashboard from './pages/Dashboard'
import DashboardV2 from './pages/DashboardV2'
import GoogleCallback from './pages/GoogleCallback'
import GbpCallback from './pages/GbpCallback'
import Onboarding from './pages/Onboarding'

// Composant pour protéger les routes
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  const demo = localStorage.getItem('demo')

  if (!token && !demo) {
    return <Navigate to="/auth" replace />
  }

  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Route publique pour l'authentification */}
        <Route path="/auth" element={<Auth />} />

        {/* Callback Google OAuth */}
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Callback Google Business Profile OAuth */}
        <Route path="/oauth/gbp/callback" element={<GbpCallback />} />

        {/* Route publique pour l'onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Routes protégées */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="connectivity" element={<Connectivity />} />
          <Route path="dashboard-v2" element={<DashboardV2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
