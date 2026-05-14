import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import StarRating from './StarRating';
import { getRelativeTime } from '../../../utils/helpers';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';

const ReviewCard = ({ review, onResponseAdded }) => {
  const { user } = useAuth();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const vendorId = review.vendorId?._id || review.vendorId;
  const isVendor = user?.id === vendorId || user?._id === vendorId;

  const handleSubmitResponse = async () => {
    if (!response.trim()) return;
    try {
      setSubmitting(true);
      await api.patch(`/reviews/${review._id}/respond`, {
        response: response.trim(),
      });
      toast.success('Response added!');
      setShowResponseForm(false);
      onResponseAdded?.();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to respond');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
      {/* Reviewer info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
            {review.reviewerId?.profileImage ? (
              <img
                src={review.reviewerId.profileImage}
                alt={review.reviewerId.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {review.reviewerId?.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {review.reviewerId?.name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-400">
              {getRelativeTime(review.createdAt)}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Review text */}
      <p className="text-gray-700 text-sm leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* Vendor response */}
      {review.vendorResponse && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            💼 Vendor Response:
          </p>
          <p className="text-sm text-gray-700">{review.vendorResponse}</p>
          <p className="text-xs text-gray-400 mt-1">
            {getRelativeTime(review.vendorResponseAt)}
          </p>
        </div>
      )}

      {/* Vendor reply button — only shown to the reviewed vendor before they've responded */}
      {isVendor && !review.vendorResponse && (
        <div className="mt-3">
          <button
            onClick={() => setShowResponseForm(!showResponseForm)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            {showResponseForm ? (
              <><ChevronUp className="h-3 w-3" /> Hide</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Reply</>
            )}
          </button>

          {showResponseForm && (
            <div className="mt-2 space-y-2">
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                rows={3}
                placeholder="Write your response..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-primary-400"
                maxLength={300}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{response.length}/300</span>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting || !response.trim()}
                  className="px-4 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
