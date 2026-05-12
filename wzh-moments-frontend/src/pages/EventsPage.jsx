import { useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import PublicLayout from '../components/layout/PublicLayout';
import EventCard from '../components/features/events/EventCard';
import Loading from '../components/common/Loading';
import { EVENT_CATEGORIES } from '../utils/constants';

export default function EventsPage() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: 'approved',
    page: 1,
  });

  const { events, loading, error, pagination, refetch } = useEvents(filters);

  const update = (patch) => setFilters((prev) => ({ ...prev, ...patch, page: 1 }));

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-14 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Discover Events</h1>
        <p className="text-primary-100 text-lg">
          Find and book amazing events happening around you
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
            />
          </div>

          {/* Category */}
          <select
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Status */}
          <select
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            <option value="approved">Approved</option>
            <option value="live">Live Now</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <Loading message="Loading events..." fullScreen={false} />
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-3">{error}</p>
              <button
                onClick={refetch}
                className="text-sm text-primary-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Calendar className="w-14 h-14 mx-auto mb-4 opacity-25" />
              <p className="text-lg font-medium text-gray-500">No events found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">
                Showing{' '}
                <span className="font-semibold text-gray-700">{pagination.total || events.length}</span>{' '}
                event{pagination.total !== 1 ? 's' : ''}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setFilters((prev) => ({ ...prev, page }))}
                      className={[
                        'w-10 h-10 rounded-lg font-medium text-sm transition-colors',
                        pagination.page === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

    </PublicLayout>
  );
}
