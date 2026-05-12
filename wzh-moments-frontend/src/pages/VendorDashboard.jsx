import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, CheckCircle, XCircle, Clock,
  DollarSign, AlertTriangle, Search,
  ShoppingBag, Send, Trash2, ExternalLink,
  RefreshCw, LayoutDashboard, Calendar, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import SubmitProposalModal from '../components/features/requests/SubmitProposalModal';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { formatDate, formatCurrency, getRelativeTime } from '../utils/helpers';
import { REQUEST_CATEGORIES, PROPOSAL_STATUS_COLORS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';

const MENU = [
  { to: '/vendor/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/marketplace',      label: 'Marketplace',  icon: ShoppingBag },
];

// ─── STATUS BADGE ─────────────────────────────────────────────────
const StatusBadge = ({ status, colors }) => {
  const icons = {
    pending:  Clock,
    accepted: CheckCircle,
    rejected: XCircle,
    open:     ShoppingBag,
    assigned: CheckCircle,
  };
  const Icon = icons[status] || Clock;
  const colorMap = colors || {
    pending:  'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full
      text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function VendorDashboard() {
  const { user } = useAuth();

  const [activeTab,        setActiveTab]        = useState('bids');
  const [bids,             setBids]             = useState([]);
  const [requests,         setRequests]         = useState([]);
  const [myProposals,      setMyProposals]      = useState([]);
  const [loadingBids,      setLoadingBids]      = useState(true);
  const [loadingRequests,  setLoadingRequests]  = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [deletingId,       setDeletingId]       = useState(null);
  const [selectedRequest,  setSelectedRequest]  = useState(null);
  const [requestSearch,    setRequestSearch]    = useState('');
  const [requestCategory,  setRequestCategory]  = useState('');

  // ── Fetch helpers ────────────────────────────────────────────────

  const fetchBids = useCallback(async () => {
    setLoadingBids(true);
    try {
      const { data } = await api.get(endpoints.bids.myBids);
      setBids(data.bids ?? data ?? []);
    } catch {
      toast.error('Failed to load bids');
    } finally {
      setLoadingBids(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams({ status: 'open', limit: '20' });
      if (requestSearch)   params.append('search',   requestSearch);
      if (requestCategory) params.append('category', requestCategory);
      const { data } = await api.get(`${endpoints.userRequests.list}?${params}`);
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load marketplace requests');
    } finally {
      setLoadingRequests(false);
    }
  }, [requestSearch, requestCategory]);

  const fetchMyProposals = useCallback(async () => {
    setLoadingProposals(true);
    try {
      const { data } = await api.get(endpoints.userRequests.myProposals);
      setMyProposals(data.proposals ?? []);
    } catch {
      toast.error('Failed to load proposals');
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────

  useEffect(() => { fetchBids(); }, [fetchBids]);

  useEffect(() => {
    if (activeTab === 'marketplace') fetchRequests();
    if (activeTab === 'proposals')   fetchMyProposals();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──────────────────────────────────────────────────────

  const handleWithdrawProposal = async (proposalId) => {
    if (!window.confirm('Withdraw this proposal?')) return;
    setDeletingId(proposalId);
    try {
      await api.delete(endpoints.userRequests.deleteProposal(proposalId));
      toast.success('Proposal withdrawn');
      fetchMyProposals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to withdraw');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────

  const acceptedBids      = bids.filter(b => b.status === 'accepted').length;
  const acceptedProposals = myProposals.filter(p => p.status === 'accepted').length;

  // ── Tab config ───────────────────────────────────────────────────

  const tabs = [
    { id: 'bids',        label: 'Event Bids',      icon: Briefcase,   count: bids.length },
    { id: 'marketplace', label: 'Browse Requests', icon: ShoppingBag, count: null },
    { id: 'proposals',   label: 'My Proposals',    icon: Send,        count: myProposals.length },
  ];

  return (
    <DashboardLayout title="Vendor Dashboard" menuItems={MENU}>

      {/* Verification warning */}
      {!user?.isVerified && (
        <div className="mb-6 flex items-start gap-3 bg-yellow-50 border
          border-yellow-200 rounded-2xl p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">Account Pending Verification</p>
            <p className="text-sm text-yellow-700 mt-1">
              You can browse requests but cannot submit proposals until an admin verifies
              your account.
            </p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bids"     value={bids.length}       icon={Briefcase}   color="blue"   />
        <StatCard label="Accepted Bids"  value={acceptedBids}      icon={CheckCircle} color="green"  />
        <StatCard label="Proposals Sent" value={myProposals.length} icon={Send}       color="purple" />
        <StatCard label="Won Proposals"  value={acceptedProposals} icon={DollarSign}  color="teal"   />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium
                border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB: MY BIDS ─────────────────────────────────────────── */}
      {activeTab === 'bids' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Event Bids</h2>
            <Link to="/events">
              <Button variant="outline" icon={Search} size="sm">Find Events</Button>
            </Link>
          </div>

          {loadingBids ? (
            <Loading fullScreen={false} message="Loading bids..." />
          ) : bids.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No event bids yet</h3>
              <p className="text-gray-400 mb-6">Browse events with requirements to place bids</p>
              <Link to="/events"><Button icon={Search}>Browse Events</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map(bid => {
                const event = bid.eventId ?? bid.event;
                return (
                  <div key={bid._id} className="border border-gray-200 rounded-2xl p-5
                    hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start
                      justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {event?._id ? (
                            <Link
                              to={`/events/${event._id}`}
                              className="font-semibold text-gray-900 hover:text-primary-600
                                transition-colors"
                            >
                              {event.title ?? 'Event'}
                            </Link>
                          ) : (
                            <span className="font-semibold text-gray-900">
                              {event?.title ?? 'Event Bid'}
                            </span>
                          )}
                          <StatusBadge status={bid.status} colors={PROPOSAL_STATUS_COLORS} />
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {bid.proposal}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          {event?.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.date, 'PP')}
                            </span>
                          )}
                          {bid.deliveryTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {bid.deliveryTime}
                            </span>
                          )}
                          <span>Submitted {getRelativeTime(bid.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-2xl font-black text-gray-900">
                          {formatCurrency(bid.amount)}
                        </p>
                      </div>
                    </div>
                    {bid.status === 'accepted' && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-xl
                        p-3 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        Bid accepted! Coordinate with the organizer to proceed.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: BROWSE MARKETPLACE ──────────────────────────────── */}
      {activeTab === 'marketplace' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center
            justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Browse User Requests</h2>
            <Button variant="outline" icon={RefreshCw} size="sm" onClick={fetchRequests}>
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2
                  h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={requestSearch}
                  onChange={e => setRequestSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchRequests()}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={requestCategory}
                onChange={e => setRequestCategory(e.target.value)}
                className="input-field sm:w-52"
              >
                <option value="">All Categories</option>
                {REQUEST_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <Button onClick={fetchRequests} icon={Search}>Search</Button>
            </div>
          </div>

          {/* Unverified notice */}
          {!user?.isVerified && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200
              rounded-2xl flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                You need admin verification to submit proposals. You can browse
                but not bid yet.
              </p>
            </div>
          )}

          {loadingRequests ? (
            <Loading fullScreen={false} message="Loading requests..." />
          ) : requests.length === 0 ? (
            <div className="card text-center py-16">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No open requests found
              </h3>
              <p className="text-gray-400">Try different filters or check back later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map(request => {
                const categoryLabel = REQUEST_CATEGORIES.find(
                  c => c.value === request.category
                )?.label || request.category;

                return (
                  <div key={request._id} className="card hover:shadow-xl transition-all
                    hover:-translate-y-1 group border border-gray-100 flex flex-col">

                    {/* Category + hasProposed badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-secondary-600
                        bg-secondary-50 px-3 py-1 rounded-full">
                        {categoryLabel}
                      </span>
                      {request.hasProposed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1
                          rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Proposed
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2
                      group-hover:text-primary-600 transition-colors">
                      {request.title}
                    </h3>

                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                      {request.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        Budget: {formatCurrency(request.budget)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        {formatDate(request.eventDate, 'PP')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                        <MapPin className="h-4 w-4 text-primary-500 flex-shrink-0" />
                        {request.location}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between pt-3
                      border-t border-gray-100 mb-3 text-xs text-gray-400">
                      <span>
                        {request.proposalCount ?? request.proposalsCount ?? 0} proposals
                      </span>
                      <span>{getRelativeTime(request.createdAt)}</span>
                    </div>

                    {/* Action */}
                    {request.hasProposed ? (
                      <div className="w-full py-2.5 bg-green-50 border border-green-200
                        rounded-xl text-sm text-green-700 font-medium text-center">
                        ✓ Proposal Submitted
                      </div>
                    ) : user?.isVerified ? (
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="w-full flex items-center justify-center gap-2 py-2.5
                          bg-gradient-to-r from-primary-500 to-secondary-500
                          hover:from-primary-600 hover:to-secondary-600 text-white
                          rounded-xl text-sm font-semibold transition-all
                          shadow-md hover:shadow-lg"
                      >
                        <Send className="h-4 w-4" />
                        Submit Proposal
                      </button>
                    ) : (
                      <div className="w-full py-2.5 bg-yellow-50 border border-yellow-200
                        rounded-xl text-xs text-yellow-700 text-center">
                        ⚠️ Verify account to submit proposals
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MY PROPOSALS ────────────────────────────────────── */}
      {activeTab === 'proposals' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Proposals</h2>
            <Button variant="outline" icon={RefreshCw} size="sm" onClick={fetchMyProposals}>
              Refresh
            </Button>
          </div>

          {loadingProposals ? (
            <Loading fullScreen={false} message="Loading proposals..." />
          ) : myProposals.length === 0 ? (
            <div className="text-center py-16">
              <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No proposals yet</h3>
              <p className="text-gray-400 mb-6">
                Browse user requests in the marketplace tab and submit proposals
              </p>
              <Button icon={ShoppingBag} onClick={() => setActiveTab('marketplace')}>
                Browse Requests
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myProposals.map(p => (
                <div key={p._id} className="border border-gray-200 rounded-2xl p-5
                  hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start
                    justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {p.requestId?.title || 'Request'}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${PROPOSAL_STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Client:{' '}
                        <span className="font-medium">
                          {p.requestId?.userId?.name || 'User'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{p.proposal}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {p.deliveryTimeline}
                        </span>
                        <span>{getRelativeTime(p.createdAt)}</span>
                      </div>
                      {p.portfolioLinks?.length > 0 && (
                        <a
                          href={p.portfolioLinks[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs
                            text-primary-600 mt-2 hover:text-primary-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Portfolio
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-2xl font-black text-gray-900">
                        {formatCurrency(p.amount)}
                      </p>
                      {p.status === 'pending' && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          loading={deletingId === p._id}
                          onClick={() => handleWithdrawProposal(p._id)}
                        >
                          Withdraw
                        </Button>
                      )}
                      {p.status === 'accepted' && (
                        <span className="text-xs text-green-600 font-semibold
                          bg-green-50 px-3 py-1 rounded-full">
                          🎉 Won!
                        </span>
                      )}
                    </div>
                  </div>

                  {p.status === 'accepted' && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl
                      p-3 text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      Proposal accepted! Contact the client to proceed.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Proposal Modal */}
      {selectedRequest && (
        <SubmitProposalModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null);
            fetchRequests();
            fetchMyProposals();
          }}
        />
      )}
    </DashboardLayout>
  );
}
