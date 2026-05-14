import { useState, useEffect } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import RatingBreakdown from './RatingBreakdown';
import ReviewCard from './ReviewCard';
import SubmitReviewModal from './SubmitReviewModal';
import api from '../../../api/axios';
import { useAuth } from '../../../hooks/useAuth';
import Loading from '../../common/Loading';

const VendorReviews = ({ vendor, requestId }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [breakdown, setBreakdown] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const vendorId = vendor?._id || vendor?.id;

  useEffect(() => {
    if (!vendorId) return;
    fetchReviews(1);
    if (isAuthenticated) checkCanReview();
  }, [vendorId]);

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/vendor/${vendorId}?page=${pageNum}&limit=5`);
      if (pageNum === 1) {
        setReviews(res.data.reviews);
      } else {
        setReviews(prev => [...prev, ...res.data.reviews]);
      }
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.total || 0);
      setBreakdown(res.data.ratingBreakdown || {});
      setHasMore(res.data.reviews.length === 5 && pageNum * 5 < res.data.total);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const res = await api.get(`/reviews/can-review/${vendorId}`);
      setCanReview(res.data.canReview);
      if (!res.data.canReview && res.data.reason === 'Already reviewed') {
        setAlreadyReviewed(true);
      }
    } catch {
      // not critical
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage);
  };

  const userId = user?.id || user?._id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          Reviews & Ratings
        </h3>

        {isAuthenticated && userId !== vendorId && user?.role !== 'vendor' && (
          <div>
            {alreadyReviewed ? (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
                ✅ You reviewed this vendor
              </span>
            ) : canReview ? (
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-md"
              >
                <Star className="h-4 w-4" />
                Write Review
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Rating breakdown */}
      {totalReviews > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5">
          <RatingBreakdown
            averageRating={averageRating}
            totalReviews={totalReviews}
            breakdown={breakdown}
          />
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <Loading fullScreen={false} message="Loading reviews..." />
      ) : reviews.length === 0 ? (
        <div className="text-center py-10">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to review this vendor!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              onResponseAdded={() => fetchReviews(1)}
            />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-600 hover:text-primary-700 font-medium border border-primary-200 rounded-2xl hover:bg-primary-50 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
              Load More Reviews
            </button>
          )}
        </div>
      )}

      {showReviewModal && (
        <SubmitReviewModal
          vendor={vendor}
          requestId={requestId}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            fetchReviews(1);
            checkCanReview();
          }}
        />
      )}
    </div>
  );
};

export default VendorReviews;
