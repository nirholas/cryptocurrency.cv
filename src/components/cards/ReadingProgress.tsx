/**
 * ReadingProgress Component
 * Shows a progress bar for partially read articles
 */

interface ReadingProgressProps {
  progress: number; // 0-100
  className?: string;
}

export default function ReadingProgress({ progress, className = '' }: ReadingProgressProps) {
  if (progress <= 0) return null;
  
  const isComplete = progress >= 100;
  
  return (
    <div className={`relative ${className}`}>
      {/* Progress bar background */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete 
              ? 'bg-green-500' 
              : 'bg-brand-500'
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Reading progress: ${progress}%`}
        />
      </div>
      
      {/* Progress label (optional, shown on hover) */}
      {isComplete ? (
        <span className="absolute -top-6 right-0 text-xs text-green-600 dark:text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          ✓ Read
        </span>
      ) : (
        <span className="absolute -top-6 right-0 text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          {progress}% read
        </span>
      )}
    </div>
  );
}
