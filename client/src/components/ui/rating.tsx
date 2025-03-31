import * as React from "react";
import { cn } from "@/lib/utils";

interface StarProps extends React.HTMLAttributes<HTMLSpanElement> {
  filled?: boolean;
  half?: boolean;
}

export const Star = React.forwardRef<HTMLSpanElement, StarProps>(
  ({ filled = false, half = false, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("text-amber-500", className)}
        {...props}
      >
        {filled ? (
          <i className="fas fa-star"></i>
        ) : half ? (
          <i className="fas fa-star-half-alt"></i>
        ) : (
          <i className="far fa-star"></i>
        )}
      </span>
    );
  }
);
Star.displayName = "Star";

interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  ({ value = 0, max = 5, className, ...props }, ref) => {
    const stars = Array.from({ length: max }, (_, i) => {
      const position = i + 1;
      const filled = position <= Math.floor(value);
      const half = !filled && position <= value + 0.5;
      
      return (
        <Star 
          key={`star-${i}`} 
          filled={filled} 
          half={half} 
        />
      );
    });

    return (
      <div 
        ref={ref}
        className={cn("flex items-center", className)} 
        {...props}
      >
        {stars}
      </div>
    );
  }
);
Rating.displayName = "Rating";

interface RatingInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
}

export const RatingInput = React.forwardRef<HTMLDivElement, RatingInputProps>(
  ({ value = 0, max = 5, onChange, className, ...props }, ref) => {
    const stars = Array.from({ length: max }, (_, i) => {
      const position = i + 1;
      const filled = position <= value;
      
      return (
        <span 
          key={`star-input-${i}`} 
          className={cn(
            "text-amber-500 cursor-pointer text-xl",
            filled ? "" : "text-gray-300"
          )}
          onClick={() => onChange?.(position)}
          onMouseEnter={(e) => {
            // Highlight all stars up to this one on hover
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const stars = Array.from(parent.children);
              stars.forEach((star, idx) => {
                if (idx <= i) {
                  star.classList.remove("text-gray-300");
                  star.classList.add("text-amber-500");
                } else {
                  star.classList.remove("text-amber-500");
                  star.classList.add("text-gray-300");
                }
              });
            }
          }}
        >
          <i className="fas fa-star"></i>
        </span>
      );
    });

    return (
      <div 
        ref={ref}
        className={cn("flex items-center", className)} 
        onMouseLeave={() => {
          // Reset to actual value on mouse leave
          const starsElements = Array.from(ref?.current?.children || []);
          starsElements.forEach((star, idx) => {
            if (idx < value) {
              star.classList.remove("text-gray-300");
              star.classList.add("text-amber-500");
            } else {
              star.classList.remove("text-amber-500");
              star.classList.add("text-gray-300");
            }
          });
        }}
        {...props}
      >
        {stars}
      </div>
    );
  }
);
RatingInput.displayName = "RatingInput";
