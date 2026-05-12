import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  CalendarHeart, LogOut, Menu, X,
  Home, ChevronRight, Star, Briefcase, Users, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const ROLE_COLORS = {
  user:      { bg: 'bg-blue-500',   light: 'bg-blue-100',   text: 'text-blue-600' },
  organizer: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' },
  vendor:    { bg: 'bg-emerald-500',light: 'bg-emerald-100',text: 'text-emerald-600' },
  admin:     { bg: 'bg-red-500',    light: 'bg-red-100',    text: 'text-red-600' },
};

const ROLE_ICONS = { user: Star, organizer: Briefcase, vendor: Users, admin: Shield };

export default function DashboardLayout({ title, menuItems, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role ?? 'user';
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.user;
  const RoleIcon = ROLE_ICONS[role] ?? Star;

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={[
        'fixed top-0 left-0 h-full w-64 bg-white z-30 flex flex-col',
        'border-r border-gray-100 shadow-xl transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:shadow-none',
      ].join(' ')}>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <CalendarHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base leading-none">WZH Moments</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{role} panel</p>
            </div>
          </Link>
        </div>

        {/* User card */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          {role === 'vendor' && (
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user?.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user?.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
          {(menuItems ?? []).map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => [
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? `${colors.light} ${colors.text} border border-current/20`
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ].join(' ')}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? colors.text : 'text-gray-400'}`} />
                  <span className="flex-1">{label}</span>
                  {badge != null && (
                    <span className="bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                      {badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className={`w-3.5 h-3.5 ${colors.text}`} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link
            to="/events"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <Home className="w-4 h-4 text-gray-400" />
            Browse Events
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <Menu className="w-5 h-5" />
            </button>
            {title && <h1 className="text-lg font-bold text-gray-900">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
