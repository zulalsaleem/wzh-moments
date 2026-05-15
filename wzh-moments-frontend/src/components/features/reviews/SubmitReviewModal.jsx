import { useState } from 'react';
import { X, Send } from 'lucide-react';
import StarRating from './StarRating';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../common/Button';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const SubmitReviewModal = ({ vendor, requestId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!rating) e.rating = 'Please select a rating';
    if (!comment || comment.trim().length < 10)
      e.comment = 'Review must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await api.post('/reviews', {
        vendorId: vendor._id || vendor.id,
        requestId,
        rating,
        comment: comment.trim(),
      });
      toast.success('Review submitted! Thank you 🎉');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Rate & Review</h3>
            <p className="text-sm text-gray-500">{vendor?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Star rating picker */}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              How would you rate this vendor?
            </p>
            <div className="flex justify-center mb-2">
              <StarRating
                rating={rating}
                size="xl"
                interactive={true}
                onRatingChange={setRating}
              />
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium text-primary-600">
                {RATING_LABELS[rating]}
              </p>
            )}
            {errors.rating && (
              <p className="text-xs text-red-500 mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={e => {
                setComment(e.target.value);
                if (errors.comment) setErrors(p => ({ ...p, comment: '' }));
              }}
              rows={4}
              placeholder="Share your experience working with this vendor. What went well? Would you recommend them?"
              className={`w-full px-4 py-3 border rounded-2xl text-sm resize-none outline-none focus:ring-2 focus:ring-primary-400 transition-all ${
                errors.comment ? 'border-red-300' : 'border-gray-300'
              }`}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              {errors.comment ? (
                <p className="text-xs text-red-500">{errors.comment}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400">{comment.length}/500</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              icon={Send}
              className="flex-1"
              disabled={!rating}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitReviewModal;
