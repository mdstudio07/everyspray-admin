/**
 * Username Field Component
 *
 * Username input with real-time availability checking and visual indicators
 * Following Rule 19 (Single Responsibility) - handles only username input
 */

import { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { Icons } from '@/lib/icons';

interface UsernameFieldProps {
  register: UseFormRegisterReturn;
  error?: string;
  isAvailable: boolean | null;
  isChecking: boolean;
  username: string;
  generatedUsername: string;
  disabled?: boolean;
}

export function UsernameField({
  register,
  error,
  isAvailable,
  isChecking,
  username,
  generatedUsername,
  disabled = false,
}: UsernameFieldProps) {
  const showCheckIcon =
    !isChecking && isAvailable === true && username && username.length >= 3;
  const showCrossIcon =
    !isChecking && isAvailable === false && username && username.length >= 3;
  const showAvailableText =
    !error && isAvailable === true && username !== generatedUsername;
  const showTakenText = !error && isAvailable === false;

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <div className="relative">
        <Input
          id="username"
          type="text"
          placeholder="johndoe"
          autoComplete="username"
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? 'username-error'
              : isAvailable === true
                ? 'username-available'
                : isAvailable === false
                  ? 'username-taken'
                  : undefined
          }
          {...register}
          className={
            error
              ? 'border-destructive focus-visible:ring-destructive pr-10'
              : 'pr-10'
          }
        />

        {/* Validation Indicators */}
        {isChecking && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Checking username availability"
          >
            <LoadingSpinner size="sm" />
          </div>
        )}

        {showCheckIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icons.Check className="h-4 w-4 text-success" aria-hidden="true" />
          </div>
        )}

        {showCrossIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icons.Cross
              className="h-4 w-4 text-destructive"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Reserved space for error/feedback - prevents layout shift */}
      <div className="min-h-2">
        <FormErrorMessage id="username-error" message={error} />

        {!error && showTakenText && (
          <p id="username-taken" className="text-sm text-destructive">
            Username is already taken
          </p>
        )}

        {!error && showAvailableText && (
          <p id="username-available" className="text-sm text-success">
            Username is available
          </p>
        )}
      </div>
    </div>
  );
}
