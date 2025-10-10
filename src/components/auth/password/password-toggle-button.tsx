/**
 * Password Toggle Button Component
 *
 * Accessible button to toggle password visibility.
 * Follows Rules 46 (semantic/accessible), 48 (interaction feedback)
 */

import { Icons } from '@/lib/icons';

interface PasswordToggleButtonProps {
  showPassword: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PasswordToggleButton({
  showPassword,
  onToggle,
  disabled = false,
}: PasswordToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {showPassword ? (
        <Icons.Cross className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Icons.Check className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
