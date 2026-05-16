import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Plus, LayoutDashboard, CheckCircle2, Clock,
  XCircle, Users, Trash2, AlertCircle, MessageCircle, Settings,
} from 'lucide-react';
import SettingsTab from '../components/common/SettingsTab';
import toast from 'react-hot-toast';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import CreateEventModal from '../components/features/events/CreateEventModal';
import ChatRoomsList from '../components/features/chat/ChatRoomsList';
import { formatDate, getStatusColor } from '../utils/helpers';

const MENU = [
  { to: '/organizer/dashboard', label: 'My Events', icon: LayoutDashboard },
];

const STATUSES = ['pending', 'approved', 'rejected', 'live', 'completed'];

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Backend has no status=all; fetch each status in parallel
      const results = await Promise.allSettled(
        STATUSES.map((status) =>
          api.get(endpoints.events.list, { params: { status, mine: true } })
        )
      );
      const merged = results.flatMap((r) =>
        r.status === 'fulfilled' ? (r.value.data.events ?? r.value.data ?? []) : []
      );
      // Deduplicate by _id
      const seen = new Set();
      setEvents(merged.filter((e) => seen.has(e._id) ? false : seen.add(e._id)));
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    api.get(endpoints.chat.unreadCount)
      .then(res => setUnreadMessages(res.data.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setDeletingId(eventId);
    try {
      await api.delete(endpoints.events.delete(eventId));
      toast.success('Event deleted');
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const displayed = filterStatus ? events.filter((e) => e.status === filterStatus) : events;
  const totalAttendees = events.reduce((s, e) => s + (e.currentAttendees ?? 0), 0);
  const pending = events.filter((e) => e.status === 'pending');

  return (
    <DashboardLayout title="Organizer Dashboard" menuItems={MENU}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Events"    value={events.length}                                 icon={Calendar}      color="purple" />
        <StatCard label="Approved / Live" value={events.filter((e) => e.status === 'approved' || e.status === 'live').length} icon={CheckCircle2} color="green" />
        <StatCard label="Pending Review"  value={events.filter((e) => e.status === 'pending').length}  icon={Clock}        color="yellow" />
        <StatCard label="Total Attendees" value={totalAttendees}                                 icon={Users}        color="blue"   />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'events'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          My Events
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'messages'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Messages
          {unreadMessages > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* ── Events tab ── */}
      {activeTab === 'events' && (
        <>
          {/* Pending / rejection notices */}
          {pending.length > 0 && (
            <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
              <Clock className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">{pending.length} event{pending.length !== 1 ? 's' : ''}</span> pending admin approval.
                You'll be notified once reviewed.
              </p>
            </div>
          )}
          {events.some((e) => e.status === 'rejected') && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">
                Some of your events were rejected. Review them below and consider editing before resubmitting.
              </p>
            </div>
          )}

          {/* Events list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-gray-900">My Events</h3>
              <div className="flex items-center gap-2">
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Create Event
                </Button>
              </div>
            </div>

            {loading ? (
              <Loading message="Loading events..." fullScreen={false} />
            ) : displayed.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="font-medium text-gray-500">
                  {filterStatus ? `No ${filterStatus} events` : 'No events yet'}
                </p>
                {!filterStatus && (
                  <p className="text-sm mt-1">Create your first event to get started.</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {displayed.map((event) => {
                  const progress = event.completionPercentage
                    ?? (event.timeline?.length
                      ? Math.round(event.timeline.filter((t) => t.completed).length / event.timeline.length * 100)
                      : 0);

                  return (
                    <div key={event._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Link
                              to={`/events/${event._id}`}
                              className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              {event.title}
                            </Link>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(event.date, 'PPP')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.currentAttendees ?? 0} / {event.maxAttendees} attendees
                            </span>
                          </div>

                          {event.timeline?.length > 0 && (
                            <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span className="font-medium text-primary-600">{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {event.status === 'rejected' && event.rejectionReason && (
                            <p className="mt-2 text-xs text-red-500">
                              Rejection reason: {event.rejectionReason}
                            </p>
                          )}
                        </div>

                        {(event.status === 'pending' || event.status === 'rejected') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(event._id)}
                            loading={deletingId === event._id}
                            className="text-red-500 hover:bg-red-50 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Messages tab ── */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Messages from Attendees</h2>
          <ChatRoomsList />
        </div>
      )}

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && <SettingsTab />}

      <CreateEventModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchEvents}
      />
    </DashboardLayout>
  );
}
