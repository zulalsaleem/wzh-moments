import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Ticket, DollarSign, Clock, MapPin, X,
  ShoppingBag, Plus, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import RequestCard from '../components/features/requests/RequestCard';
import CreateRequestModal from '../components/features/requests/CreateRequestModal';
import ViewProposalsModal from '../components/features/requests/ViewProposalsModal';
import AvatarUpload from '../components/common/AvatarUpload';
import SubmitReviewModal from '../components/features/reviews/SubmitReviewModal';
import { formatDate, formatCurrency, getStatusColor } from '../utils/helpers';

const MENU = [
  { to: '/dashboard',   label: 'My Dashboard', icon: Ticket },
  { to: '/marketplace', label: 'Marketplace',  icon: ShoppingBag },
];

const TABS = ['My Bookings', 'My Requests'];

export default function UserDashboard() {
  const { user, updateUser } = useAuth();
  const [tab, setTab]               = useState('My Bookings');
  const [bookings, setBookings]     = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const { data } = await api.get(endpoints.bookings.myBookings);
      setBookings(data.bookings ?? data ?? []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { data } = await api.get(endpoints.userRequests.myRequests);
      setRequests(data.requests ?? []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchRequests();
  }, [fetchBookings, fetchRequests]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    setCancellingId(bookingId);
    try {
      await api.delete(endpoints.bookings.cancel(bookingId));
      toast.success('Booking cancelled');
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: 'cancelled', canCancel: false } : b)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this request? All pending proposals will be rejected.')) return;
    try {
      await api.delete(endpoints.userRequests.cancel(requestId));
      toast.success('Request cancelled');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const handleCompleteRequest = async (requestId) => {
    if (!window.confirm('Mark this request as completed?')) return;
    try {
      await api.patch(endpoints.userRequests.complete(requestId));
      toast.success('Marked as completed!');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const confirmed  = bookings.filter((b) => b.status === 'confirmed');
  const upcoming   = bookings.filter((b) => b.isUpcoming && b.status === 'confirmed');
  const totalSpent = bookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const openReqs   = requests.filter((r) => r.status === 'open').length;

  return (
    <DashboardLayout title="My Dashboard" menuItems={MENU}>
      {/* Profile section */}
      <div className="flex items-center gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <AvatarUpload
          currentImage={user?.profileImage}
          name={user?.name ?? 'User'}
          size="lg"
          onUploadSuccess={(data) => updateUser({ profileImage: data.profileImage })}
        />
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">
            Welcome back, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">Click the camera icon to update your profile photo</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bookings" value={bookings.length}        icon={Ticket}      color="blue"   />
        <StatCard label="Upcoming"        value={upcoming.length}        icon={Calendar}    color="purple" />
        <StatCard label="Total Spent"     value={formatCurrency(totalSpent)} icon={DollarSign} color="teal" />
        <StatCard label="Open Requests"   value={openReqs}               icon={ShoppingBag} color="green"  />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t}
            {t === 'My Requests' && requests.length > 0 && (
              <span className="ml-1.5 bg-primary-100 text-primary-700 text-xs rounded-full px-1.5 py-0.5">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── My Bookings tab ── */}
      {tab === 'My Bookings' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Your Bookings</h3>
            <Link to="/events" className="text-sm text-primary-600 hover:underline">Browse more events →</Link>
          </div>

          {loadingBookings ? (
            <Loading message="Loading bookings..." fullScreen={false} />
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-gray-500">No bookings yet</p>
              <p className="text-sm mt-1">Browse events and book your first one!</p>
              <Link to="/events">
                <Button className="mt-4" size="sm">Browse Events</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {bookings.map((booking) => {
                const event = booking.eventId;
                return (
                  <div key={booking._id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          to={`/events/${event?._id}`}
                          className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {event?.title ?? 'Event'}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {event?.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.date, 'PPP')}
                          </span>
                        )}
                        {event?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          {booking.numberOfTickets ?? 1} ticket{(booking.numberOfTickets ?? 1) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
                        {!booking.totalAmount ? 'Free' : formatCurrency(booking.totalAmount)}
                      </span>
                      {booking.canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBooking(booking._id)}
                          loading={cancellingId === booking._id}
                          className="text-red-600 hover:bg-red-50 !px-2"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── My Requests tab ── */}
      {tab === 'My Requests' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">My Service Requests</h3>
              <p className="text-sm text-gray-500">Post requests and receive proposals from verified vendors</p>
            </div>
            <Button icon={Plus} onClick={() => setShowCreate(true)}>
              Post Request
            </Button>
          </div>

          {loadingRequests ? (
            <Loading message="Loading requests..." fullScreen={false} />
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No requests yet</p>
              <p className="text-sm text-gray-400 mt-1">Post your first request to get proposals from vendors</p>
              <Button icon={Plus} className="mt-4" size="sm" onClick={() => setShowCreate(true)}>
                Post Request
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {requests.map((request) => (
                <div key={request._id}>
                  <RequestCard
                    request={request}
                    onViewProposals={setSelectedRequest}
                    onCancel={handleCancelRequest}
                    onComplete={handleCompleteRequest}
                  />
                  {request.assignedVendor && (
                    <button
                      onClick={() => setReviewTarget({
                        vendor: request.assignedVendor,
                        requestId: request._id,
                      })}
                      className="flex items-center justify-center gap-1 w-full mt-2 text-xs text-yellow-600 font-medium hover:text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200 transition-colors"
                    >
                      <Star className="h-3 w-3" />
                      Rate Vendor
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateRequestModal
          onClose={() => setShowCreate(false)}
          onSuccess={fetchRequests}
        />
      )}
      {selectedRequest && (
        <ViewProposalsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={fetchRequests}
        />
      )}
      {reviewTarget && (
        <SubmitReviewModal
          vendor={reviewTarget.vendor}
          requestId={reviewTarget.requestId}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setReviewTarget(null);
            toast.success('Review submitted!');
          }}
        />
      )}
    </DashboardLayout>
  );
}
