/**
 * Email Step Form Component
 *
 * First step of registration: Email validation and Google OAuth
 * Following Rule 19 (Single Responsibility) - handles only email step
 * Following Rule 30 (Split Large Code) - extracted from main register page
 */

import { UseFormReturn } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GoogleIcon } from '@/components/auth';

interface EmailFormData {
  email: string;
}

interface EmailStepFormProps {
  form: UseFormReturn<EmailFormData>;
  onSubmit: (data: EmailFormData) => Promise<void>;
  onGoogleSignUp: () => Promise<void>;
  isLoading: boolean;
  isChecking: boolean;
}

export function EmailStepForm({
  form,
  onSubmit,
  onGoogleSignUp,
  isLoading,
  isChecking,
}: EmailStepFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <>
      {/* Google Sign Up */}
      <Button
        type="button"
        variant="outline"
        className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
        onClick={onGoogleSignUp}
        disabled={isLoading || isChecking}
        aria-label="Sign up with Google"
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        Sign up with Google
      </Button>

      {/* Divider */}
      <div className="relative" role="separator" aria-label="or">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isChecking}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
            className={
              errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
            }
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Checking email...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>

      {/* Terms footer */}
      <p className="px-8 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-colors duration-150"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm transition-colors duration-150"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}
