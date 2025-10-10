'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GoogleIcon, PasswordToggleButton } from '@/components/auth';

import { useAuthStore } from '@/lib/stores/auth';

/**
 * Login Page Component
 *
 * Follows:
 * - Rule 21: Types-first with Zod validation
 * - Rule 41: Consistent spacing scale (space-y-6, space-y-4)
 * - Rule 46: Semantic HTML with aria attributes
 * - Rule 48: Interaction feedback (hover, focus, active states)
 */

// =====================================
// VALIDATION SCHEMA
// =====================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// =====================================
// LOGIN PAGE COMPONENT
// =====================================

export default function LoginPage() {
  const router = useRouter();
  const { signIn, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // =====================================
  // FORM SUBMISSION HANDLER
  // =====================================

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    clearError();

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        toast.error('Login Failed', {
          description: error,
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      toast.success('Welcome back!', {
        description: 'You have been logged in successfully.',
        duration: 3000,
      });

      setTimeout(() => {
        router.push('/contribute/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login Failed', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  // =====================================
  // GOOGLE OAUTH HANDLER
  // =====================================

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement Google OAuth with Supabase
      toast.info('Coming Soon', {
        description: 'Google Sign-In will be available soon.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Authentication Failed', {
        description: 'Unable to sign in with Google. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================
  // RENDER COMPONENT
  // =====================================

  return (
    <div className="w-full space-y-8">
      {/* Header - Rule 53: Section → Group hierarchy */}
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in to your account
        </p>
      </header>

      {/* Forms Section - Rule 41: Consistent spacing (space-y-6) */}
      <section className="space-y-6" aria-label="Sign in options">
        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          aria-label="Sign in with Google"
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>

        {/* Divider */}
        <div className="relative" role="separator" aria-label="or">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Email/Password Form - Rule 46: Semantic form structure */}
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
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:underline transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
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
                onToggle={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.password.message}
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
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </section>

      {/* Footer Links - Rule 41: Consistent spacing */}
      <footer className="space-y-4">
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

        {/* Terms */}
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
      </footer>
    </div>
  );
}
