import { MapPin, Calendar, DollarSign, MessageSquare, Eye, Clock } from 'lucide-react';
import { formatDate, formatCurrency, getRelativeTime } from '../../../utils/helpers';
import { REQUEST_CATEGORIES, REQUEST_STATUS_COLORS } from '../../../utils/constants';

export default function RequestCard({ request, onSubmitProposal, onViewProposals, onCancel, onComplete }) {
  const categoryLabel = REQUEST_CATEGORIES.find((c) => c.value === request.category)?.label ?? request.category;
  const statusColor   = REQUEST_STATUS_COLORS[request.status] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Header row */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
            {categoryLabel}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor}`}>
            {request.status}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
          {request.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {request.description}
        </p>
      </div>

      {/* Details */}
      <div className="px-5 py-3 space-y-1.5 border-t border-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <DollarSign className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span>Budget: <span className="font-semibold text-gray-700">{formatCurrency(request.budget)}</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span>Event: {formatDate(request.eventDate, 'PP')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span className="truncate">{request.location}</span>
        </div>
      </div>

      {/* Footer meta */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-3 text-xs text-gray-400 mt-auto">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {request.proposalsCount ?? request.proposalCount ?? 0} proposals
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {request.viewsCount ?? 0}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {getRelativeTime(request.createdAt)}
        </span>
      </div>

      {/* Action row — vendor submit */}
      {onSubmitProposal && request.status === 'open' && (
        <div className="px-5 pb-5">
          <button
            onClick={() => onSubmitProposal(request)}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Submit Proposal
          </button>
        </div>
      )}

      {/* Action row — owner actions */}
      {(onViewProposals || onCancel || onComplete) && (
        <div className="px-5 pb-5 flex gap-2">
          {request.status === 'open' && (
            <>
              <button
                onClick={() => onViewProposals?.(request)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center justify-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                {request.proposalCount ?? request.proposalsCount ?? 0} Proposals
              </button>
              <button
                onClick={() => onCancel?.(request._id)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          {request.status === 'assigned' && (
            <button
              onClick={() => onComplete?.(request._id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              ✓ Mark Completed
            </button>
          )}
          {(request.status === 'completed' || request.status === 'cancelled') && (
            <span className="flex-1 text-center text-xs text-gray-400 py-2 capitalize">{request.status}</span>
          )}
        </div>
      )}
    </div>
  );
}
