'use client';

import { useState } from 'react';
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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// =====================================
// LOGIN PAGE COMPONENT
// =====================================

export default function LoginPage() {
  const router = useRouter();
  const { signIn, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const remember = watch('remember');

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

      // Success toast
      toast.success('Welcome back!', {
        description: 'You have been logged in successfully.',
        duration: 3000,
      });

      // Redirect will be handled by the auth system based on role
      // For now, we'll handle it manually
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
  // DEMO LOGIN HANDLER
  // =====================================

  const handleDemoLogin = async (role: 'super_admin' | 'team_member' | 'contributor') => {
    setIsLoading(true);

    // Demo credentials
    const demoCredentials = {
      super_admin: { email: 'admin@everyspray.com', password: 'admin123' },
      team_member: { email: 'team@everyspray.com', password: 'team123' },
      contributor: { email: 'user@everyspray.com', password: 'user123' },
    };

    const credentials = demoCredentials[role];
    setValue('email', credentials.email);
    setValue('password', credentials.password);

    await onSubmit({ ...credentials, remember: false });
  };

  // =====================================
  // RENDER COMPONENT
  // =====================================

  return (
    <Card className="w-full border-border shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight font-heading">
          Welcome back
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              disabled={isLoading}
              {...register('password')}
              className={errors.password ? 'border-destructive focus:border-destructive' : ''}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setValue('remember', !!checked)}
              disabled={isLoading}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me for 30 days
            </Label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <Icons.LogIn className="mr-2 h-4 w-4" />
                Sign in
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Demo Accounts</span>
          </div>
        </div>

        {/* Demo Login Buttons */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin('super_admin')}
            disabled={isLoading}
          >
            <Icons.Shield className="mr-2 h-4 w-4" />
            Demo Super Admin
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin('team_member')}
            disabled={isLoading}
          >
            <Icons.User className="mr-2 h-4 w-4" />
            Demo Team Member
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin('contributor')}
            disabled={isLoading}
          >
            <Icons.Edit className="mr-2 h-4 w-4" />
            Demo Contributor
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline focus:outline-none focus:underline"
          >
            Sign up
          </Link>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          <Link
            href="/forgot-password"
            className="hover:underline focus:outline-none focus:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}