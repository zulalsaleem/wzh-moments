import { Link } from 'react-router-dom';
import { Sparkles, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">WZH Moments</span>
            </div>
            <p className="text-sm leading-relaxed mb-4 max-w-xs">
              The modern event management platform with real-time tracking.
              Know what's happening at your event, live.
            </p>
            <div className="flex gap-3">
              {[ExternalLink, ExternalLink, ExternalLink].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              {['Browse Events', 'Create Event', 'Vendor Marketplace', 'Real-time Tracking'].map((item) => (
                <li key={item}>
                  <Link to="/events" className="hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Sign In',      path: '/login' },
                { label: 'Register',     path: '/register' },
                { label: 'Dashboard',    path: '/dashboard' },
                { label: 'Admin Panel',  path: '/admin' },
              ].map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2025 WZH Moments. Final Year Project.</p>
          <p className="text-sm flex items-center gap-1">
            Built with <Heart className="h-4 w-4 text-red-500 fill-red-500 mx-0.5" /> by Wali, Zulal &amp; Haris
          </p>
        </div>
      </div>
    </footer>
  );
}
