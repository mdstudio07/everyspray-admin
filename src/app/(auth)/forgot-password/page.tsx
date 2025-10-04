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
      // Check if email exists in the database
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

      // If email doesn't exist, show error
      if (!checkResult.exists) {
        toast.error('Email Not Found', {
          description: 'This email address is not registered. Please check and try again.',
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      // Email exists, proceed with password reset
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
  // RENDER COMPONENT
  // =====================================

  if (emailSent) {
    return (
      <div className="w-full space-y-6">
        {/* Success State */}
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Icons.Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to your email address.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              If you don&apos;t see the email, check your spam folder or{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="font-medium text-primary hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>

          <Link href="/login">
            <Button variant="outline" className="w-full">
              <Icons.ChevronLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isLoading}
            {...register('email')}
            className={
              errors.email
                ? 'border-destructive focus:border-destructive'
                : ''
            }
          />
          {errors.email && (
            <p className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
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

      {/* Footer Links */}
      <div className="text-center space-y-2">
        <Link href="/login">
          <Button variant="ghost" className="w-full">
            <Icons.ChevronLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>

        <div className="text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
