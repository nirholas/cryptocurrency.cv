/**
 * LoadingSpinner Component
 * Premium animated loading indicator with multiple variants
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'minimal' | 'dots';
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  text 
}: LoadingSpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`
                ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'}
                bg-brand-500 rounded-full
                animate-[bounce_1s_ease-in-out_infinite]
                motion-reduce:animate-none
              `}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-400 font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className={`
            ${sizeClasses[size]}
            border-2 border-gray-200 dark:border-gray-700
            border-t-brand-500
            rounded-full
            animate-spin
            motion-reduce:animate-none
          `}
        />
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-400 font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'brand') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer glow ring */}
          <div
            className={`
              absolute inset-0 ${sizeClasses[size]}
              bg-brand-500/20 rounded-full blur-lg
              animate-pulse
              motion-reduce:animate-none
            `}
          />
          {/* Main spinner */}
          <div
            className={`
              relative ${sizeClasses[size]}
              border-4 border-brand-200 dark:border-brand-900
              border-t-brand-500
              rounded-full
              animate-spin
              motion-reduce:animate-none
            `}
          />
          {/* Inner dot */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
            `}
          >
            <div
              className={`
                ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'}
                bg-brand-500 rounded-full
                animate-pulse
                motion-reduce:animate-none
              `}
            />
          </div>
        </div>
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default variant - gradient ring
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Animated gradient background */}
        <div
          className={`
            absolute inset-0 ${sizeClasses[size]}
            bg-gradient-to-r from-brand-500 via-amber-500 to-orange-500
            rounded-full blur-md opacity-30
            animate-pulse
            motion-reduce:animate-none
          `}
        />
        {/* Spinner track */}
        <div
          className={`
            relative ${sizeClasses[size]}
            rounded-full
            bg-gradient-to-r from-gray-200 to-gray-100
            dark:from-gray-800 dark:to-gray-700
          `}
        >
          {/* Animated gradient spinner */}
          <svg
            className={`${sizeClasses[size]} animate-spin motion-reduce:animate-none`}
            viewBox="0 0 50 50"
          >
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80 45"
            />
          </svg>
        </div>
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium animate-pulse motion-reduce:animate-none`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Full page loading state
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800">
        <LoadingSpinner size="xl" variant="brand" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{text}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
      {/* Image placeholder */}
      <div className="h-[200px] bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 animate-pulse motion-reduce:animate-none" />
      {/* Content placeholder */}
      <div className="p-5 space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 animate-pulse motion-reduce:animate-none" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse motion-reduce:animate-none" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-5/6 animate-pulse motion-reduce:animate-none" />
        <div className="flex items-center gap-3 pt-2">
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

// Grid of skeleton cards
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
