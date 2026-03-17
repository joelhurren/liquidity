import { Star } from 'lucide-react';
import { useState } from 'react';

export default function StarRating({ rating, onRate, size = 24, readonly = false }) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onRate?.(star)}
        >
          <Star
            size={size}
            className={
              (hover || rating) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-stone-300'
            }
          />
        </button>
      ))}
    </div>
  );
}
