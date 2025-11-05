'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  interactive = false,
  onRatingChange,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const starSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };
  
  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div
      className={cn('flex items-center gap-1 text-primary', interactive && 'cursor-pointer')}
      onMouseLeave={handleMouseLeave}
    >
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            starSizeClasses[size],
            'transition-colors',
            displayRating > index ? 'fill-primary' : 'fill-transparent',
            interactive && 'hover:fill-primary/80'
          )}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
        />
      ))}
    </div>
  );
};

export default StarRating;
