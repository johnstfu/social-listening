import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import './index.css'
import Auth from './pages/Auth'
import GbpCallback from './pages/GbpCallback'
import GoogleCallback from './pages/GoogleCallback'
import Onboarding from './pages/Onboarding'
import RadarDashboard from './pages/DashboardV2'
import ReviewsPage from './pages/Reviews'
import RecommendationsPage from './pages/Recommendations'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/auth" replace />
  }
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/oauth/gbp/callback" element={<GbpCallback />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* App protégée */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<RadarDashboard />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
