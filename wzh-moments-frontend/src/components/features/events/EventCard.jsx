import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Zap } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '../../../utils/helpers';

export default function EventCard({ event }) {
  const completion = event.completionPercentage
    ?? (event.timeline?.length
      ? Math.round(event.timeline.filter((t) => t.completed).length / event.timeline.length * 100)
      : 0);

  const availableSeats = event.maxAttendees - event.currentAttendees;
  const isSoldOut = availableSeats <= 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col">
      {/* Image / banner */}
      <div className="relative h-44 bg-gradient-to-br from-primary-400 to-secondary-400 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Calendar className="w-16 h-16 text-white/40" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>

        {/* Live progress badge */}
        {event.status === 'live' && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary-600" />
            <span className="text-xs font-semibold text-gray-700">{completion}% complete</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {event.category && (
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">
            {event.category}
          </span>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
            {event.description}
          </p>
        )}

        <div className="space-y-1.5 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            {formatDate(event.date)}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            {isSoldOut ? (
              <span className="text-red-500 font-medium">Fully Booked</span>
            ) : (
              <span>{availableSeats} of {event.maxAttendees} seats available</span>
            )}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <span className="font-bold text-gray-900">
            {event.ticketPrice === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatCurrency(event.ticketPrice)
            )}
          </span>
          <Link
            to={`/events/${event._id}`}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 group/link"
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
