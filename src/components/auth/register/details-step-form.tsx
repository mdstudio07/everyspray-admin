/**
 * Details Step Form Component
 *
 * Second step of registration: User details (name, username, password)
 * Following Rule 19 (Single Responsibility) - handles only details step
 * Following Rule 30 (Split Large Code) - extracted from main register page
 */

import { UseFormReturn } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import {
  PasswordStrength,
  PasswordToggleButton,
} from '@/components/auth/password';
import { UsernameField } from './username-field';
import { Icons } from '@/lib/icons';

interface DetailsFormData {
  fullName: string;
  username: string;
  password: string;
  acceptTerms: boolean;
}

interface DetailsStepFormProps {
  form: UseFormReturn<DetailsFormData>;
  onSubmit: (data: DetailsFormData) => Promise<void>;
  onBack: () => void;
  userEmail: string;
  generatedUsername: string;
  usernameAvailable: boolean | null;
  checkingUsername: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  isLoading: boolean;
}

export function DetailsStepForm({
  form,
  onSubmit,
  onBack,
  userEmail,
  generatedUsername,
  usernameAvailable,
  checkingUsername,
  showPassword,
  onTogglePassword,
  isLoading,
}: DetailsStepFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const { password, username, acceptTerms } = watch();

  // Calculate password strength (same logic as PasswordStrength component)
  const getPasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password || '');
  const isPasswordStrong = passwordStrength >= 5;

  // Clear password error when password becomes strong (no useEffect needed - we're already watching)
  if (isPasswordStrong && errors.password) {
    form.clearErrors('password');
  }

  // Check if form has any validation errors
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      {/* Back button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        disabled={isLoading}
        className="transition-colors duration-150"
      >
        <Icons.ChevronLeft className="mr-2 h-4 w-4" />
        Change email
      </Button>

      {/* Details Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-1" noValidate>
        {/* Email Display (read-only) */}
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
            {userEmail}
          </div>
          <div className="min-h-2 opacity-0"></div>
        </div>

        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            disabled={isLoading}
            aria-invalid={errors.fullName ? 'true' : 'false'}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            {...register('fullName')}
            className={
              errors.fullName
                ? 'border-destructive focus-visible:ring-destructive'
                : ''
            }
          />
          {/* Reserved space for error - prevents layout shift */}
          <div className="min-h-2">
            <FormErrorMessage
              id="fullName-error"
              message={errors.fullName?.message}
            />
          </div>
        </div>

        {/* Username Field with Availability Check */}
        <UsernameField
          register={register('username')}
          error={errors.username?.message}
          isAvailable={usernameAvailable}
          isChecking={checkingUsername}
          username={username}
          generatedUsername={generatedUsername}
          disabled={isLoading}
        />

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={
                errors.password ? 'password-error' : 'password-strength'
              }
              {...register('password')}
              className={
                errors.password
                  ? 'border-destructive focus-visible:ring-destructive pr-10'
                  : 'pr-10'
              }
            />
            <PasswordToggleButton
              showPassword={showPassword}
              onToggle={onTogglePassword}
              disabled={isLoading}
            />
          </div>
          {/* Reserved space for error - prevents layout shift */}
          <div id="password-strength">
            <PasswordStrength password={password} />
          </div>
          <div className="min-h-2">
            {/* Hide error when password is strong */}
            {!isPasswordStrong && (
              <FormErrorMessage
                id="password-error"
                message={errors.password?.message}
              />
            )}
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="acceptTerms"
              checked={acceptTerms}
              onCheckedChange={(checked) => {
                setValue('acceptTerms', !!checked);
                // Clear error when user checks the box
                if (checked && errors.acceptTerms) {
                  form.clearErrors('acceptTerms');
                }
              }}
              disabled={isLoading}
              aria-invalid={errors.acceptTerms ? 'true' : 'false'}
              aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
              className="mt-0"
            />
            <Label
              htmlFor="acceptTerms"
              className="text-sm leading-5 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{' '}
              <Link
                href="/terms"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-colors duration-150"
                target="_blank"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-colors duration-150"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          {/* Reserved space for error - prevents layout shift */}
          {/* <div className="min-h-2">
            <FormErrorMessage
              id="terms-error"
              message={errors.acceptTerms?.message}
            />
          </div> */}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] mt-7"
          disabled={isLoading || usernameAvailable === false || hasErrors}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Creating account
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </>
  );
}
