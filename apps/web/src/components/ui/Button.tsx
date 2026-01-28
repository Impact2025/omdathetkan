import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'love';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 active:scale-95':
              variant === 'primary',
            'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 focus:ring-gray-500':
              variant === 'secondary',
            'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500':
              variant === 'ghost',
            'love-button': variant === 'love',
            // Sizes
            'text-sm px-3 py-1.5 rounded-lg': size === 'sm',
            'text-base px-4 py-2 rounded-xl': size === 'md',
            'text-lg px-6 py-3 rounded-2xl': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
