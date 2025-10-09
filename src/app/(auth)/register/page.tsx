'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Icons } from '@/lib/icons';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { useAuthStore } from '@/lib/stores/auth';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

// =====================================
// VALIDATION SCHEMAS
// =====================================

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

const detailsSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(50, 'Full name must be less than 50 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms of service'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type DetailsFormData = z.infer<typeof detailsSchema>;

// =====================================
// PASSWORD STRENGTH INDICATOR
// =====================================

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const getColor = () => {
    if (strength < 3) return 'bg-destructive';
    if (strength < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLabel = () => {
    if (strength < 3) return 'Weak';
    if (strength < 5) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex space-x-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`h-1 w-full rounded ${
              i < strength ? getColor() : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium">{getLabel()}</span>
      </p>
    </div>
  );
}

// =====================================
// REGISTRATION PAGE COMPONENT
// =====================================

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, clearError } = useAuthStore();
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [generatedUsername, setGeneratedUsername] = useState('');

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Details form
  const detailsForm = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      fullName: '',
      username: '',
      password: '',
      acceptTerms: false,
    },
  });

  const { password, username, acceptTerms } = detailsForm.watch();

  // =====================================
  // USERNAME AVAILABILITY CHECK
  // =====================================

  useEffect(() => {
    if (username && username.length >= 3 && username !== generatedUsername) {
      setCheckingUsername(true);
      const timeoutId = setTimeout(async () => {
        try {
          // Direct Supabase RPC call - no API middleman
          const supabase = createSupabaseClient();
          const { data: usernameExists, error } = await supabase.rpc(
            'check_username_exists',
            { p_username: username }
          );

          if (error) {
            console.error('Username check error:', error);
            setUsernameAvailable(null);
          } else {
            // Function returns true if exists, we want available (inverse)
            setUsernameAvailable(!usernameExists);
          }
        } catch (error) {
          console.error('Error checking username:', error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (username === generatedUsername) {
      setUsernameAvailable(true);
      setCheckingUsername(false);
    } else {
      setUsernameAvailable(null);
      setCheckingUsername(false);
    }
  }, [username, generatedUsername]);

  // =====================================
  // GOOGLE OAUTH HANDLER
  // =====================================

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement Google OAuth with Supabase
      toast.info('Coming Soon', {
        description: 'Google Sign-Up will be available soon.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Google sign-up error:', error);
      toast.error('Authentication Failed', {
        description: 'Unable to sign up with Google. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================
  // EMAIL STEP HANDLER
  // =====================================

  const onEmailSubmit = async (data: EmailFormData) => {
    setCheckingEmail(true);

    try {
      // Check if email already exists via direct Supabase RPC call
      const supabase = createSupabaseClient();
      const { data: emailExists, error: emailError } = await supabase.rpc(
        'check_email_exists',
        { p_email: data.email }
      );

      if (emailError) {
        console.error('Email check error:', emailError);
        toast.error('Error', {
          description: 'Failed to check email availability',
          duration: 3000,
        });
        setCheckingEmail(false);
        return;
      }

      if (emailExists) {
        toast.error('Email Already Exists', {
          description:
            'This email is already registered. Please sign in instead.',
          duration: 5000,
        });
        setCheckingEmail(false);
        return;
      }

      // Email is available, generate username from email
      const usernameFromEmail = data.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .substring(0, 20);

      // Check if generated username is available
      const { data: usernameExists, error: usernameError } = await supabase.rpc(
        'check_username_exists',
        { p_username: usernameFromEmail }
      );

      if (usernameError) {
        console.error('Username check error:', usernameError);
        toast.error('Error', {
          description: 'Failed to generate username',
          duration: 3000,
        });
        setCheckingEmail(false);
        return;
      }

      // If username exists, add a number suffix
      let finalUsername = usernameFromEmail;
      if (usernameExists) {
        const randomSuffix = Math.floor(Math.random() * 9999);
        finalUsername = `${usernameFromEmail}_${randomSuffix}`;
      }

      // Set generated username and move to next step
      setUserEmail(data.email);
      setGeneratedUsername(finalUsername);
      detailsForm.setValue('username', finalUsername);
      setUsernameAvailable(true);
      setStep('details');
      setCheckingEmail(false);
    } catch (error) {
      console.error('Email check error:', error);
      toast.error('Error', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
      setCheckingEmail(false);
    }
  };

  // =====================================
  // DETAILS STEP HANDLER
  // =====================================

  const onDetailsSubmit = async (data: DetailsFormData) => {
    if (usernameAvailable === false) {
      toast.error('Username Unavailable', {
        description: 'Please choose a different username.',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const { error } = await signUp(userEmail, data.password, {
        username: data.username,
        full_name: data.fullName,
      });

      if (error) {
        toast.error('Registration Failed', {
          description: error,
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      toast.success('Registration Successful!', {
        description: 'Please check your email to verify your account.',
        duration: 5000,
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration Failed', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
      setIsLoading(false);
    }
  };

  // =====================================
  // RENDER COMPONENT
  // =====================================

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 'email'
            ? 'Enter your email below to create your account'
            : 'Complete your profile details'}
        </p>
      </div>

      {/* Forms */}
      <div className="space-y-4">
        {step === 'email' ? (
          <>
            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isLoading || checkingEmail}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={checkingEmail}
                  {...emailForm.register('email')}
                  className={
                    emailForm.formState.errors.email
                      ? 'border-destructive focus:border-destructive'
                      : ''
                  }
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={checkingEmail}>
                {checkingEmail ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Checking email...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Back to email button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('email')}
              disabled={isLoading}
              className="mb-2"
            >
              <Icons.ChevronLeft className="mr-1 h-4 w-4" />
              Change email
            </Button>

            {/* Details Form */}
            <form
              onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}
              className="space-y-4"
            >
              {/* Email Display (read-only) */}
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {userEmail}
                </div>
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
                  {...detailsForm.register('fullName')}
                  className={
                    detailsForm.formState.errors.fullName
                      ? 'border-destructive focus:border-destructive'
                      : ''
                  }
                />
                {detailsForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive" role="alert">
                    {detailsForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    autoComplete="username"
                    disabled={isLoading}
                    {...detailsForm.register('username')}
                    className={
                      detailsForm.formState.errors.username
                        ? 'border-destructive focus:border-destructive pr-10'
                        : 'pr-10'
                    }
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                  {!checkingUsername &&
                    usernameAvailable === true &&
                    username &&
                    username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Icons.Check className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  {!checkingUsername &&
                    usernameAvailable === false &&
                    username &&
                    username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Icons.Cross className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                </div>
                {detailsForm.formState.errors.username && (
                  <p className="text-sm text-destructive" role="alert">
                    {detailsForm.formState.errors.username.message}
                  </p>
                )}
                {!detailsForm.formState.errors.username &&
                  usernameAvailable === false && (
                    <p className="text-sm text-destructive">
                      Username is already taken
                    </p>
                  )}
                {!detailsForm.formState.errors.username &&
                  usernameAvailable === true &&
                  username !== generatedUsername && (
                    <p className="text-sm text-green-600">
                      Username is available
                    </p>
                  )}
              </div>

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
                    {...detailsForm.register('password')}
                    className={
                      detailsForm.formState.errors.password
                        ? 'border-destructive focus:border-destructive pr-10'
                        : 'pr-10'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <Icons.Cross className="h-4 w-4" />
                    ) : (
                      <Icons.Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {detailsForm.formState.errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {detailsForm.formState.errors.password.message}
                  </p>
                )}
                <PasswordStrength password={password} />
              </div>

              {/* Terms Checkbox */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      detailsForm.setValue('acceptTerms', !!checked)
                    }
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm leading-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {detailsForm.formState.errors.acceptTerms && (
                  <p className="text-sm text-destructive" role="alert">
                    {detailsForm.formState.errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || usernameAvailable === false}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Footer Links */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>

      {/* Terms (only show on email step) */}
      {step === 'email' && (
        <p className="px-8 text-center text-xs text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}
