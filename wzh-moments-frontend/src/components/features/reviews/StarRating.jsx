import { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showNumber = false,
}) => {
  const [hovered, setHovered] = useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
    xl: 'h-9 w-9',
  };

  const displayRating = interactive ? (hovered || rating) : rating;

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxStars)].map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayRating;

        return (
          <Star
            key={i}
            className={`
              ${sizeClasses[size]}
              transition-all duration-100
              ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              ${interactive ? 'cursor-pointer hover:scale-125' : ''}
            `}
            onClick={() => {
              if (interactive && onRatingChange) onRatingChange(starValue);
            }}
            onMouseEnter={() => interactive && setHovered(starValue)}
            onMouseLeave={() => interactive && setHovered(0)}
          />
        );
      })}

      {showNumber && rating > 0 && (
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
