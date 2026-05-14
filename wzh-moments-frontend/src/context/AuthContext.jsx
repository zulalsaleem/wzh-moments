import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import endpoints from '../api/endpoints';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verify token and load user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      api.get(endpoints.auth.me)
        .then((res) => setUser(res.data.user ?? res.data))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const redirectAfterLogin = (role) => {
    switch (role) {
      case 'admin':     navigate('/admin'); break;
      case 'organizer': navigate('/organizer/dashboard'); break;
      case 'vendor':    navigate('/vendor/dashboard'); break;
      default:          navigate('/dashboard');
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post(endpoints.auth.register, userData);
      const { token, user: u, requiresVerification } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      if (requiresVerification) {
        localStorage.setItem('pendingVerificationEmail', userData.email);
      }
      setUser(u);
      if (requiresVerification) {
        toast.success('Account created! Check your email for the OTP.');
        navigate('/verify-email', { state: { email: userData.email } });
      } else {
        toast.success('Registration successful! Welcome to WZH Moments!');
        redirectAfterLogin(u.role);
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const login = async (credentials) => {
    try {
      const res = await api.post(endpoints.auth.login, credentials);
      const { token, user: u } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      toast.success(`Welcome back, ${u.name}!`);
      redirectAfterLogin(u.role);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isOrganizer: user?.role === 'organizer',
        isVendor: user?.role === 'vendor',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
