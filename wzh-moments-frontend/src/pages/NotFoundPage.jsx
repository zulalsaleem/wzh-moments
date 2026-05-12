import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';

export default function NotFoundPage() {
  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 px-4">
        <div className="text-center max-w-lg">
          {/* 404 */}
          <div className="relative mb-8 select-none">
            <p className="text-[9rem] sm:text-[11rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-100 to-secondary-100 leading-none">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                <Search className="h-10 w-10 text-gray-300" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-3">Page Not Found</h1>
          <p className="text-gray-500 mb-8 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Home className="h-5 w-5" />
              Go Home
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:border-primary-300 hover:bg-primary-50 transition-all"
            >
              <Search className="h-5 w-5" />
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
