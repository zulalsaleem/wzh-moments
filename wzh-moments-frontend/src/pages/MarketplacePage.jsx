import { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingBag, AlertTriangle } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import RequestCard from '../components/features/requests/RequestCard';
import SubmitProposalModal from '../components/features/requests/SubmitProposalModal';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { REQUEST_CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters]       = useState({ search: '', category: '', minBudget: '', maxBudget: '', page: 1 });
  const [selectedRequest, setSelectedRequest] = useState(null);

  const isVendor   = user?.role === 'vendor';
  const isVerified = user?.isVerified;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'open', limit: '12' });
      if (filters.search)    params.append('search',    filters.search);
      if (filters.category)  params.append('category',  filters.category);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
      params.append('page', filters.page);

      const { data } = await api.get(`${endpoints.userRequests.list}?${params}`);
      setRequests(data.requests ?? []);
      setPagination({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const update = (patch) => setFilters((p) => ({ ...p, ...patch, page: 1 }));

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-600 to-primary-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-purple-200 text-sm font-medium mb-1">Service Marketplace</p>
            <h1 className="text-4xl font-black mb-2">Find Opportunities</h1>
            <p className="text-primary-100 max-w-md">
              Browse service requests from users and send your best proposal to win the job.
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black">{pagination.total}</p>
            <p className="text-purple-200 text-sm">Open Requests</p>
          </div>
        </div>
      </div>

      {/* Vendor verification notice */}
      {isVendor && !isVerified && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Verification required.</span> Your account must be verified by an admin before you can submit proposals.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) => update({ search: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => update({ category: e.target.value })}
              className="w-full md:w-52 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {REQUEST_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min budget"
                value={filters.minBudget}
                onChange={(e) => update({ minBudget: e.target.value })}
                min="0"
                className="w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max budget"
                value={filters.maxBudget}
                onChange={(e) => update({ maxBudget: e.target.value })}
                min="0"
                className="w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <Loading message="Loading requests..." fullScreen={false} />
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No open requests</h3>
            <p className="text-gray-400">Check back later or adjust your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Showing <span className="font-semibold text-gray-800">{pagination.total}</span> open requests
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onSubmitProposal={isVendor && isVerified ? setSelectedRequest : undefined}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setFilters((p) => ({ ...p, page: i + 1 }))}
                    className={[
                      'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                      pagination.page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedRequest && (
        <SubmitProposalModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={fetchRequests}
        />
      )}
    </PublicLayout>
  );
}
