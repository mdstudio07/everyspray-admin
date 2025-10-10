'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Icons } from '@/lib/icons';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // =====================================
  // FORM SUBMISSION HANDLER
  // =====================================

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      // Check if email exists
      const checkResponse = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        toast.error('Error', {
          description: checkResult.error || 'Failed to verify email',
          duration: 3000,
        });
        setIsLoading(false);
        return;
      }

      if (!checkResult.exists) {
        toast.error('Email Not Found', {
          description:
            'This email address is not registered. Please check and try again.',
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      // TODO: Implement password reset with Supabase
      // await supabase.auth.resetPasswordForEmail(data.email)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Email Sent!', {
        description: 'Check your email for password reset instructions.',
        duration: 5000,
      });

      setEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Request Failed', {
        description: 'Unable to send reset email. Please try again.',
        duration: 5000,
      });
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
              <Icons.Check className="size-6 text-success" aria-hidden="true" />
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
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              If you don&apos;t see the email, check your spam folder or{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline transition-colors duration-150"
              >
                try again
              </button>
              .
            </p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button - Rule 48: Interactive feedback */}
          <Button
            type="submit"
            className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sending reset link...
              </>
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
