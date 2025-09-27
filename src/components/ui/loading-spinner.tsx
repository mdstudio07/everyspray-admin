import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'loading' | 'processing' | 'saving';
}

export function LoadingSpinner({ className, size = 'md', type = 'loading' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (type === 'loading') {
    // Wave bars - rhythmic flow
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-current rounded-full',
              size === 'sm' ? 'w-1 h-3' : size === 'md' ? 'w-1.5 h-4' : 'w-2 h-6'
            )}
            style={{
              animation: `wave 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'processing') {
    // Random equalizer bars - erratic up/down motion anchored from bottom
    const durations = [2.2, 2.8, 2.4, 2.6, 2.5]; // Much slower durations
    const delays = [0, 0.5, 0.3, 1.2, 0.8]; // More spread out delays

    return (
      <div className={cn('flex items-end space-x-1', className)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-current rounded-sm',
              size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-1' : 'w-1.5'
            )}
            style={{
              height: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px',
              animation: `equalizer ${durations[i]}s ease-in-out infinite`,
              animationDelay: `${delays[i]}s`,
              transformOrigin: 'bottom',
              transform: `scaleY(${0.3 + (i % 4) * 0.2})`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'saving') {
    // Ripple circles - expanding motion
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-current opacity-75"
            style={{
              animation: `ripple 1.5s ease-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default fallback to original spinner
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-muted border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}