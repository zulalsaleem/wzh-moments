import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import UserDashboard from './pages/UserDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MarketplacePage from './pages/MarketplacePage';
import NotFoundPage from './pages/NotFoundPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import EmailVerificationBanner from './components/common/EmailVerificationBanner';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <EmailVerificationBanner />
          <Routes>
            {/* Public */}
            <Route path="/"           element={<HomePage />} />
            <Route path="/events"     element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/login"      element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute allowedRoles={['user', 'organizer', 'vendor', 'admin']}>
                  <MarketplacePage />
                </ProtectedRoute>
              }
            />

            {/* User — all authenticated roles */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['user', 'organizer', 'vendor', 'admin']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Organizer */}
            <Route
              path="/organizer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Vendor */}
            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Legacy short paths */}
            <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
            <Route path="/vendor"    element={<Navigate to="/vendor/dashboard"    replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                fontWeight: '500',
                fontSize: '14px',
              },
              success: {
                style: { background: '#10b981', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#10b981' },
              },
              error: {
                style: { background: '#ef4444', color: '#fff' },
                iconTheme: { primary: '#fff', secondary: '#ef4444' },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
