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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { useAuthStore } from '@/lib/stores/auth';

// =====================================
// VALIDATION SCHEMA
// =====================================

const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(50, 'Full name must be less than 50 characters'),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'You must accept the terms of service'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// =====================================
// PASSWORD STRENGTH INDICATOR
// =====================================

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
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
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      fullName: '',
      acceptTerms: false,
    },
  });

  const watchedFields = watch();
  const { password, username, acceptTerms } = watchedFields;

  // =====================================
  // USERNAME AVAILABILITY CHECK
  // =====================================

  useEffect(() => {
    if (username && username.length >= 3) {
      setCheckingUsername(true);
      const timeoutId = setTimeout(async () => {
        // Simulate username check - replace with actual API call
        try {
          // For demo, consider usernames starting with 'admin' as taken
          const isTaken = username.toLowerCase().startsWith('admin');
          setUsernameAvailable(!isTaken);
        } catch (error) {
          console.error('Error checking username:', error);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
      setCheckingUsername(false);
    }
  }, [username]);

  // =====================================
  // FORM SUBMISSION HANDLER
  // =====================================

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    clearError();

    try {
      const { error } = await signUp(data.email, data.password, {
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

      // Success toast
      toast.success('Registration Successful!', {
        description: 'Please check your email to verify your account.',
        duration: 5000,
      });

      // Redirect to login page after successful registration
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
    <Card className="w-full border-border shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight font-heading">
          Create your account
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Join our perfume community as a contributor
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled={isLoading}
              {...register('email')}
              className={errors.email ? 'border-destructive focus:border-destructive' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username *
            </Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                disabled={isLoading}
                {...register('username')}
                className={errors.username ? 'border-destructive focus:border-destructive' : ''}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : 'username-help'}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              {!checkingUsername && usernameAvailable === true && username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icons.Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              {!checkingUsername && usernameAvailable === false && username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icons.Cross className="h-4 w-4 text-destructive" />
                </div>
              )}
            </div>
            {errors.username && (
              <p id="username-error" className="text-sm text-destructive" role="alert">
                {errors.username.message}
              </p>
            )}
            {!errors.username && usernameAvailable === false && (
              <p className="text-sm text-destructive">Username is already taken</p>
            )}
            {!errors.username && usernameAvailable === true && (
              <p className="text-sm text-green-600">Username is available</p>
            )}
            <p id="username-help" className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full name *
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              disabled={isLoading}
              {...register('fullName')}
              className={errors.fullName ? 'border-destructive focus:border-destructive' : ''}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && (
              <p id="fullName-error" className="text-sm text-destructive" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              disabled={isLoading}
              {...register('password')}
              className={errors.password ? 'border-destructive focus:border-destructive' : ''}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-help'}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              disabled={isLoading}
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-destructive focus:border-destructive' : ''}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms of Service Checkbox */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setValue('acceptTerms', !!checked)}
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
            {errors.acceptTerms && (
              <p className="text-sm text-destructive" role="alert">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading || usernameAvailable === false}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating account...
              </>
            ) : (
              <>
                <Icons.User className="mr-2 h-4 w-4" />
                Create account
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          >
            Sign in
          </Link>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          By creating an account, you&apos;ll start as a contributor and can earn trust levels through quality contributions.
        </div>
      </CardFooter>
    </Card>
  );
}