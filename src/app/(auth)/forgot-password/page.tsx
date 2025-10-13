'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icons } from '@/lib/icons';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FormErrorMessage } from '@/components/ui/form-error-message';
import { checkEmailExists } from '@/lib/auth/registration-helpers';
import { TOAST_MESSAGES, toastHelpers } from '@/lib/constants/toast-messages';

/**
 * Forgot Password Page Component
 *
 * Allows users to request password reset email.
 * Follows all UI/UX standards (Rules 41-55)
 */

// =====================================
// VALIDATION SCHEMA
// =====================================

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// =====================================
// FORGOT PASSWORD PAGE COMPONENT
// =====================================

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [lastEmail, setLastEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const currentEmail = watch('email');

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // =====================================
  // FORM SUBMISSION HANDLER
  // =====================================

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // If email changed, allow resubmit
    if (data.email !== lastEmail) {
      setResendTimer(0);
    }

    // Check timer - prevent spam
    if (resendTimer > 0 && data.email === lastEmail) {
      toastHelpers.warn(
        TOAST_MESSAGES.auth.forgotPassword.rateLimit(resendTimer)
      );
      return;
    }

    setIsLoading(true);

    try {
      // Check if email exists using the existing helper
      const { exists, error: emailError } = await checkEmailExists(data.email);

      if (emailError) {
        toastHelpers.error(emailError);
        setIsLoading(false);
        return;
      }

      if (!exists) {
        toastHelpers.warn(TOAST_MESSAGES.auth.forgotPassword.emailNotFound);
        setIsLoading(false);
        return;
      }

      // TODO: Implement password reset with Supabase
      // await supabase.auth.resetPasswordForEmail(data.email)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toastHelpers.success(TOAST_MESSAGES.auth.forgotPassword.linkSent);

      setEmailSent(true);
      setLastEmail(data.email);
      setResendTimer(60); // 1 minute cooldown
    } catch (error) {
      console.error('Password reset error:', error);
      toastHelpers.error(TOAST_MESSAGES.auth.forgotPassword.failed);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================
  // SUCCESS STATE RENDER
  // =====================================

  if (emailSent) {
    return (
      <div className="w-full space-y-8">
        {/* Success Header */}
        <header className="space-y-4 text-center">
          {/* Success Icon - Rule 43: Semantic colors */}
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
              <Icons.Check
                className="size-8 text-success "
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We sent a password reset link to your email address.
            </p>
          </div>
        </header>

        {/* Info Section - Rule 41: Consistent spacing */}
        <section className="space-y-6" aria-label="Next steps">
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              If you don&apos;t see the email, check your spam folder.
            </p>
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                You can resend in{' '}
                <span className="font-medium text-foreground">
                  {resendTimer}s
                </span>
              </p>
            ) : (
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline transition-colors duration-150 cursor-pointer"
              >
                Resend reset link
              </button>
            )}
          </div>

          <Link href="/login" className="block">
            <Button
              variant="outline"
              className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Icons.ChevronLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  // =====================================
  // FORM STATE RENDER
  // =====================================

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a reset link
        </p>
      </header>

      {/* Form Section */}
      <section aria-label="Password reset form">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
              className={
                errors.email
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            {/* Reserved space for error - prevents layout shift */}
            <div className="min-h-[20px]">
              <FormErrorMessage
                id="email-error"
                message={errors.email?.message}
              />
            </div>
          </div>

          {/* Submit Button - Rule 48: Interactive feedback */}
          <Button
            type="submit"
            className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            disabled={
              isLoading || (resendTimer > 0 && currentEmail === lastEmail)
            }
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sending reset link
              </>
            ) : resendTimer > 0 && currentEmail === lastEmail ? (
              `Resend in ${resendTimer}s`
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </section>

      {/* Footer Links - Rule 41: Consistent spacing */}
      <footer className="space-y-4">
        <Link href="/login" className="block">
          <Button
            variant="ghost"
            className="w-full transition-colors duration-150"
          >
            <Icons.ChevronLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            Don&apos;t have an account?{' '}
          </span>
          <Link
            href="/register"
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline transition-colors duration-150"
          >
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
