import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface MotionIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const MotionIconButton = forwardRef<HTMLButtonElement, MotionIconButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'motion-icon-button inline-flex items-center justify-center',
          'transition-all duration-hover ease-apple',
          'hover:scale-110 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MotionIconButton.displayName = 'MotionIconButton';

export default MotionIconButton;
