import { useEffect, useState, useCallback } from 'react';
import {
  Users, Calendar, CheckCircle2, BarChart3, LayoutDashboard,
  Clock, DollarSign, Gavel, ShieldCheck, XCircle, BadgeCheck,
  ShoppingBag, Trash2, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { formatDate, formatCurrency, getStatusColor, getRelativeTime } from '../utils/helpers';
import { REQUEST_CATEGORIES, REQUEST_STATUS_COLORS } from '../utils/constants';

const MENU = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
];

const TABS = ['Overview', 'Event Approvals', 'Users', 'User Requests'];

export default function AdminDashboard() {
  const [tab, setTab]               = useState('Overview');
  const [analytics, setAnalytics]   = useState(null);
  const [pending, setPending]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading]       = useState(true);

  const [rejectModal, setRejectModal] = useState({ open: false, eventId: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, requestId: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, pendingRes, usersRes, requestsRes] = await Promise.all([
        api.get(endpoints.admin.analytics),
        api.get(endpoints.admin.pendingEvents),
        api.get(endpoints.admin.users),
        api.get(endpoints.admin.userRequests),
      ]);
      setAnalytics(analyticsRes.data);
      setPending(pendingRes.data.events ?? pendingRes.data ?? []);
      setUsers(usersRes.data.users ?? usersRes.data ?? []);
      setUserRequests(requestsRes.data.requests ?? []);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (eventId) => {
    try {
      await api.patch(endpoints.admin.approveEvent(eventId), { status: 'approved' });
      toast.success('Event approved!');
      setPending((prev) => prev.filter((e) => e._id !== eventId));
    } catch {
      toast.error('Failed to approve event');
    }
  };

  const openRejectModal = (eventId) => setRejectModal({ open: true, eventId, reason: '' });

  const confirmReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Rejection reason is required'); return; }
    try {
      await api.patch(endpoints.admin.approveEvent(rejectModal.eventId), {
        status: 'rejected',
        rejectionReason: rejectModal.reason.trim(),
      });
      toast.success('Event rejected');
      setPending((prev) => prev.filter((e) => e._id !== rejectModal.eventId));
      setRejectModal({ open: false, eventId: null, reason: '' });
    } catch {
      toast.error('Failed to reject event');
    }
  };

  const handleVerifyVendor = async (userId) => {
    try {
      await api.patch(endpoints.admin.verifyVendor(userId));
      toast.success('Vendor verified!');
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isVerified: true } : u));
    } catch {
      toast.error('Failed to verify vendor');
    }
  };

  const confirmDeleteRequest = async () => {
    try {
      await api.delete(endpoints.admin.deleteUserRequest(deleteModal.requestId));
      toast.success('Request deleted');
      setUserRequests((prev) => prev.filter((r) => r._id !== deleteModal.requestId));
      setDeleteModal({ open: false, requestId: null });
    } catch {
      toast.error('Failed to delete request');
    }
  };

  if (loading) return (
    <DashboardLayout title="Admin Dashboard" menuItems={MENU}>
      <Loading message="Loading admin data..." fullScreen={false} />
    </DashboardLayout>
  );

  const pendingBadge      = pending.length > 0 ? pending.length : null;
  const unverifiedVendors = users.filter((u) => u.role === 'vendor' && !u.isVerified);

  return (
    <DashboardLayout title="Admin Dashboard" menuItems={MENU}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t}
            {t === 'Event Approvals' && pendingBadge != null && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingBadge}
              </span>
            )}
            {t === 'User Requests' && userRequests.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5">
                {userRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'Overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users"    value={analytics?.overview?.totalUsers ?? '—'}    icon={Users}        color="blue"   />
            <StatCard label="Total Events"   value={analytics?.overview?.totalEvents ?? '—'}   icon={Calendar}     color="purple" />
            <StatCard label="Total Bookings" value={analytics?.overview?.totalBookings ?? '—'} icon={CheckCircle2} color="green"  />
            <StatCard label="Revenue"        value={formatCurrency(analytics?.overview?.totalRevenue ?? 0)} icon={DollarSign} color="teal" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Bids"         value={analytics?.overview?.totalBids ?? 0}                      icon={Gavel}      color="yellow" />
            <StatCard label="Pending Approvals"  value={analytics?.overview?.pendingApprovals ?? pending.length}  icon={Clock}      color="red"    />
            <StatCard label="Unverified Vendors" value={unverifiedVendors.length}                                  icon={ShieldCheck} color="purple" />
          </div>

          {analytics?.usersByRole && Object.keys(analytics.usersByRole).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Users by Role</h3>
              <div className="space-y-3">
                {Object.entries(analytics.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-20 capitalize">{role}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${Math.round((count / analytics.overview?.totalUsers) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics?.eventsByStatus && Object.keys(analytics.eventsByStatus).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Events by Status</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(analytics.eventsByStatus).map(([status, count]) => (
                  <div key={status} className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(status)}`}>
                    {status}: {count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Event Approvals tab ── */}
      {tab === 'Event Approvals' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Pending Approvals</h3>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
              {pending.length} pending
            </span>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-gray-500">All caught up!</p>
              <p className="text-sm mt-1">No events pending review.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pending.map((event) => (
                <div key={event._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-0.5">
                        <span>by {(event.organizer ?? event.organizerId)?.name ?? '—'}</span>
                        <span>{formatDate(event.date, 'PPP')}</span>
                        {event.location && <span>{event.location}</span>}
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => openRejectModal(event._id)}>
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(event._id)}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'Users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">All Users</h3>
            <span className="text-xs text-gray-400">{users.length} total</span>
          </div>
          {users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="text-sm">No users found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((u) => (
                <div key={u._id} className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{u.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${getStatusColor(u.role)}`}>
                        {u.role}
                      </span>
                      {u.role === 'vendor' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {u.isVerified ? '✓ Verified' : '⏳ Unverified'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                  </div>
                  {u.role === 'vendor' && !u.isVerified && (
                    <Button size="sm" variant="outline" onClick={() => handleVerifyVendor(u._id)} className="shrink-0">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verify
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── User Requests tab ── */}
      {tab === 'User Requests' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">All User Requests</h3>
            <span className="text-xs text-gray-400">{userRequests.length} total</span>
          </div>
          {userRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-gray-500">No requests yet</p>
              <p className="text-sm mt-1">User service requests will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {userRequests.map((req) => {
                const categoryLabel = REQUEST_CATEGORIES.find((c) => c.value === req.category)?.label ?? req.category;
                const statusColor   = REQUEST_STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-700';
                return (
                  <div key={req._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{req.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                            {req.status}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                            {categoryLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-gray-400 mt-0.5">
                          <span>by {req.userId?.name ?? '—'} ({req.userId?.email})</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {req.location}
                          </span>
                          <span>{req.proposalsCount ?? 0} proposals</span>
                          <span>{getRelativeTime(req.createdAt)}</span>
                        </div>
                        {req.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-gray-700">
                          {formatCurrency(req.budget)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 !px-2"
                          onClick={() => setDeleteModal({ open: true, requestId: req._id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject event modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, eventId: null, reason: '' })}
        title="Reject Event"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Provide a reason — the organizer will be notified.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="e.g. Event details are incomplete..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, eventId: null, reason: '' })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete user request confirmation modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, requestId: null })}
        title="Delete Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently delete the request and all associated proposals. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal({ open: false, requestId: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteRequest}>
              Delete Request
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
