import StarRating from './StarRating';

const RatingBreakdown = ({ averageRating, totalReviews, breakdown }) => {
  if (totalReviews === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="flex gap-8 items-center">
      {/* Average score */}
      <div className="text-center flex-shrink-0">
        <p className="text-6xl font-black text-gray-900">
          {averageRating.toFixed(1)}
        </p>
        <StarRating rating={averageRating} size="md" showNumber={false} />
        <p className="text-xs text-gray-500 mt-1">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Bar breakdown */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map(star => {
          const count = breakdown[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-3">{star}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-5">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingBreakdown;
