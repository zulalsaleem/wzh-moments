import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Users, ArrowLeft,
  User as UserIcon, Wifi, WifiOff, Tag, Ticket,
  Check, RefreshCw, Gavel, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../hooks/useEvents';
import { useEventSocket } from '../hooks/useEventSocket';
import PublicLayout from '../components/layout/PublicLayout';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ProgressCircle from '../components/features/events/ProgressCircle';
import BidSubmissionModal from '../components/features/events/BidSubmissionModal';
import EventBidsModal from '../components/features/events/EventBidsModal';
import PaymentModal from '../components/features/events/PaymentModal';
import { formatDate, formatCurrency, getStatusColor, calculateCompletion } from '../utils/helpers';

// Compare MongoDB _id values safely (could be string or ObjectId)
function sameId(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const { event, loading, error, refetch, applyProgressUpdate, applyAttendeeUpdate } = useEvent(id);
  const { connectedUsers, progressUpdate, attendeeUpdate, isConnected } = useEventSocket(id);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tickets, setTickets] = useState(1);

  // Apply realtime progress updates
  useEffect(() => {
    if (!progressUpdate) return;
    applyProgressUpdate(progressUpdate);
    if (progressUpdate.updatedTask) {
      const { task, completed } = progressUpdate.updatedTask;
      toast.success(`"${task}" ${completed ? 'completed!' : 'reopened'}`, {
        icon: completed ? '✅' : '🔄',
      });
      setHighlightedTaskId(progressUpdate.updatedTask._id ?? null);
      setTimeout(() => setHighlightedTaskId(null), 2500);
    }
  }, [progressUpdate, applyProgressUpdate]);

  // Apply realtime attendee updates
  useEffect(() => {
    if (!attendeeUpdate) return;
    applyAttendeeUpdate(attendeeUpdate);
  }, [attendeeUpdate, applyAttendeeUpdate]);

  useEffect(() => {
    if (!event || !user) return;
    const userId = (user.id || user._id)?.toString();
    const org = event.organizer || event.organizerId;
    const organizerId = (typeof org === 'object'
      ? (org?._id || org?.id)
      : org
    )?.toString();
    console.log('=== ORGANIZER CHECK ===');
    console.log('User ID:', userId);
    console.log('Organizer ID:', organizerId);
    console.log('Match:', userId === organizerId);
    console.log('======================');
  }, [event, user]);

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    setTicketCount(1);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    setBookingLoading(true);
    try {
      await api.post(endpoints.bookings.create, { eventId: id, numberOfTickets: ticketCount });
      toast.success(`Booking confirmed! ${ticketCount} ticket${ticketCount > 1 ? 's' : ''} 🎉`);
      setShowBookingModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleTimelineUpdate = async (taskIndex, completed) => {
    setUpdatingTask(taskIndex);
    try {
      await api.patch(endpoints.events.updateTimeline(id), { taskIndex, completed });
      // Socket.IO broadcasts the update; UI refreshes via applyProgressUpdate
      toast.success(completed ? '✅ Task marked complete!' : '↩️ Task marked incomplete');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdatingTask(null);
    }
  };

  if (loading) return (
    <PublicLayout showFooter={false}>
      <Loading message="Loading event..." />
    </PublicLayout>
  );

  if (error || !event) {
    return (
      <PublicLayout showFooter={false}>
        <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Event not found</h2>
            <Link to="/events" className="text-primary-600 hover:underline text-sm">
              ← Browse all events
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const completion = event.completionPercentage ?? calculateCompletion(event.timeline);
  const availableSeats = event.maxAttendees - event.currentAttendees;
  const canBook = (event.status === 'approved' || event.status === 'live') && availableSeats > 0;

  // Returns true if the logged-in user is this event's organizer.
  // Handles every shape the API may send:
  //   event.organizer = { _id: ObjectId|string }  (toObject alias added by backend)
  //   event.organizerId = { _id: ObjectId|string } (toObject, _id present)
  //   event.organizerId = { id: string }           (toJSON transform, _id renamed)
  //   event.organizerId = "507f..."                (plain string)
  const isEventOrganizer = () => {
    if (!user || !event) return false;
    const userId = (user.id || user._id)?.toString();
    if (!userId) return false;

    // Walk through every possible location for the organizer ID
    const candidates = [
      event.organizer?._id,
      event.organizer?.id,
      event.organizer,
      event.organizerId?._id,
      event.organizerId?.id,
      event.organizerId,
    ];

    for (const c of candidates) {
      if (!c || typeof c === 'object') continue; // skip nulls and un-stringified objects
      if (c.toString() === userId) return true;
    }

    // Last resort: if the organizer field is a plain object, stringify its _id/id
    const org = event.organizer || event.organizerId;
    if (org && typeof org === 'object') {
      const oid = (org._id || org.id)?.toString();
      if (oid) return oid === userId;
    }

    return false;
  };

  const openRequirements = event.requirements?.filter((r) => r.status === 'open') ?? [];

  return (
    <PublicLayout>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-primary-200 hover:text-white text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to events
          </button>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
          {event.category && (
            <span className="inline-flex items-center gap-1 text-primary-200 text-sm capitalize">
              <Tag className="w-3.5 h-3.5" /> {event.category}
            </span>
          )}
        </div>
      </div>

      <main className="flex-1 bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Main column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Cover image */}
              {event.coverImage && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm">
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Event details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date &amp; Time</p>
                      <p className="font-medium text-gray-800">{formatDate(event.date, 'PPPp')}</p>
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Location</p>
                        <p className="font-medium text-gray-800">{event.location}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Attendees</p>
                      <p className="font-medium text-gray-800">
                        {event.currentAttendees} / {event.maxAttendees}
                        {availableSeats <= 0 && (
                          <span className="ml-2 text-xs text-red-500 font-semibold">SOLD OUT</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Ticket Price</p>
                      <p className="font-medium text-gray-800">
                        {event.ticketPrice === 0 ? 'Free' : formatCurrency(event.ticketPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                </div>

                {event.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Timeline / Progress card ── */}
              {event.timeline && event.timeline.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Event Progress</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {event.timeline.filter((t) => t.completed).length} of{' '}
                        {event.timeline.length} tasks completed
                      </p>
                    </div>

                    {/* Live indicator */}
                    <div className={[
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shrink-0',
                      isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    ].join(' ')}>
                      {isConnected ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <Wifi className="w-3.5 h-3.5" />
                          Live
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5" />
                          Offline
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Overall Progress</span>
                      <span className="font-semibold text-primary-600">{completion}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline items */}
                  <div className="space-y-3">
                    {event.timeline.map((item, index) => {
                      const isHighlighted = highlightedTaskId && item._id === highlightedTaskId;
                      return (
                        <div
                          key={item._id ?? index}
                          className={[
                            'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300',
                            item.completed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300',
                            isHighlighted ? 'ring-2 ring-primary-400 ring-offset-2' : '',
                          ].join(' ')}
                        >
                          {/* Status icon */}
                          <div className={[
                            'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                            item.completed
                              ? 'bg-green-500 shadow-lg shadow-green-200'
                              : 'bg-white border-2 border-gray-300',
                          ].join(' ')}>
                            {item.completed
                              ? <Check className="h-5 w-5 text-white" />
                              : <span className="text-sm font-bold text-gray-400">{index + 1}</span>}
                          </div>

                          {/* Task info */}
                          <div className="flex-1 min-w-0">
                            <p className={[
                              'font-semibold text-sm',
                              item.completed ? 'text-green-800 line-through opacity-70' : 'text-gray-900',
                            ].join(' ')}>
                              {item.task}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                            )}
                            {item.completed && item.completedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Completed {formatDate(item.completedAt, 'PPp')}
                              </p>
                            )}
                          </div>

                          {/* Organizer controls */}
                          {isEventOrganizer() ? (
                            <button
                              onClick={() => handleTimelineUpdate(index, !item.completed)}
                              disabled={updatingTask === index}
                              className={[
                                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                item.completed
                                  ? 'bg-white text-gray-600 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-200',
                              ].join(' ')}
                            >
                              {updatingTask === index
                                ? <RefreshCw className="h-4 w-4 animate-spin" />
                                : item.completed
                                  ? '↩ Undo'
                                  : <><Check className="h-4 w-4" /> Done</>}
                            </button>
                          ) : (
                            <span className={[
                              'px-3 py-1 rounded-full text-xs font-medium shrink-0',
                              item.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                            ].join(' ')}>
                              {item.completed ? 'Done' : 'Pending'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Organizer nudge */}
                  {isEventOrganizer() && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                        You are the organizer. Click "Done" to mark tasks — all attendees see updates live!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-5">

              {/* Progress circle */}
              {event.timeline?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Completion Status</h3>
                  <ProgressCircle percentage={completion} />
                  <div className="mt-5 pt-5 border-t border-gray-50 text-sm text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>
                        {connectedUsers > 0
                          ? `${connectedUsers} watching live`
                          : 'No viewers yet'}
                      </span>
                    </div>
                    {isConnected && (
                      <p className="text-xs text-green-600 font-medium">🔴 Updates in real-time</p>
                    )}
                  </div>
                </div>
              )}

              {/* Booking card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {event.ticketPrice === 0
                    ? <span className="text-green-600">Free Entry</span>
                    : formatCurrency(event.ticketPrice)}
                </h3>
                <p className="text-xs text-gray-400 mb-4">per ticket</p>

                {/* Ticket quantity selector — only for paid events */}
                {event.ticketPrice > 0 && canBook && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Number of Tickets</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTickets((t) => Math.max(1, t - 1))}
                        disabled={tickets <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        −
                      </button>
                      <span className="font-bold text-gray-900 w-4 text-center">{tickets}</span>
                      <button
                        onClick={() => setTickets((t) => Math.min(Math.min(10, availableSeats), t + 1))}
                        disabled={tickets >= Math.min(10, availableSeats)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Price summary */}
                <div className="space-y-2 text-sm mb-5">
                  {event.ticketPrice > 0 && canBook && (
                    <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary-600">
                        {formatCurrency(event.ticketPrice * tickets)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Available Seats</span>
                    <span className={`font-medium ${availableSeats <= 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {availableSeats <= 0 ? 'Sold Out' : availableSeats}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Capacity</span>
                    <span className="font-medium text-gray-900">{event.maxAttendees}</span>
                  </div>
                </div>

                {canBook ? (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please sign in to book this event');
                        return;
                      }
                      setTickets(1);
                      setShowPaymentModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl"
                  >
                    {!isAuthenticated
                      ? '🔐 Sign In to Book'
                      : event.ticketPrice === 0
                        ? '🎫 Book Free Ticket'
                        : `💳 Pay ${formatCurrency(event.ticketPrice * tickets)}`}
                  </button>
                ) : (
                  <p className="text-center text-sm text-gray-400">
                    {availableSeats <= 0
                      ? 'This event is fully booked.'
                      : 'Bookings are not available for this event.'}
                  </p>
                )}

                {!isAuthenticated && canBook && (
                  <p className="text-xs text-center text-gray-400 mt-2">
                    <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link> to book your spot
                  </p>
                )}
              </div>

              {/* Vendor bid card */}
              {user?.role === 'vendor' && openRequirements.length > 0 && (
                <div className="bg-gradient-to-br from-secondary-50 to-purple-50 rounded-2xl border-2 border-secondary-200 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-2">🎯 Vendor Opportunity</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This event has{' '}
                    <span className="font-semibold text-secondary-700">
                      {openRequirements.length} open requirement{openRequirements.length !== 1 ? 's' : ''}
                    </span>{' '}
                    looking for service providers.
                  </p>
                  {user.isVerified ? (
                    <Button fullWidth onClick={() => setShowBidModal(true)}>
                      <Gavel className="h-4 w-4" />
                      Submit a Bid
                    </Button>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
                      ⚠️ Your vendor account needs admin verification before you can bid.
                    </div>
                  )}
                </div>
              )}

              {/* Organizer bid management */}
              {isEventOrganizer() && event.requirements?.length > 0 && (
                <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-2">📊 Bid Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    View and manage all bids from vendors for your event requirements.
                  </p>
                  <Button variant="outline" fullWidth onClick={() => setShowBidsModal(true)}>
                    <BarChart2 className="h-4 w-4" />
                    View All Bids
                  </Button>
                </div>
              )}

              {/* Organizer info */}
              {(event.organizerId || event.organizer) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Organized By</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {(event.organizer ?? event.organizerId)?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(event.organizer ?? event.organizerId)?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Booking quantity modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Tickets"
        size="sm"
      >
        <div className="space-y-5">
          {/* Event summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-900 text-sm leading-snug">{event.title}</p>
            <p className="text-xs text-gray-500 mt-1">
              {event.ticketPrice === 0
                ? 'Free entry'
                : `${formatCurrency(event.ticketPrice)} per ticket`}
            </p>
          </div>

          {/* Quantity selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Number of Tickets
            </label>
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2">
              <button
                onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                disabled={ticketCount <= 1}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                −
              </button>

              <div className="text-center">
                <span className="text-3xl font-black text-gray-900">{ticketCount}</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  of {availableSeats} available
                </p>
              </div>

              <button
                onClick={() => setTicketCount((c) => Math.min(availableSeats, c + 1))}
                disabled={ticketCount >= availableSeats}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="text-xl font-black text-gray-900">
              {event.ticketPrice === 0
                ? 'Free'
                : formatCurrency(event.ticketPrice * ticketCount)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowBookingModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBooking}
              loading={bookingLoading}
              className="flex-1"
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bid modals */}
      {showBidModal && (
        <BidSubmissionModal
          event={event}
          onClose={() => setShowBidModal(false)}
          onSuccess={() => {}}
        />
      )}
      {showBidsModal && (
        <EventBidsModal
          event={event}
          onClose={() => setShowBidsModal(false)}
        />
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <PaymentModal
          event={event}
          numberOfTickets={tickets}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            toast.success('🎉 Booking confirmed!');
            refetch();
          }}
        />
      )}

    </PublicLayout>
  );
}
