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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// =====================================
// VALIDATION SCHEMA
// =====================================

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

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
// RESET PASSWORD PAGE COMPONENT
// =====================================

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // =====================================
  // FORM SUBMISSION HANDLER
  // =====================================

  const onSubmit = async (_data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      // TODO: Implement password reset with Supabase
      // await supabase.auth.updateUser({ password: _data.password })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Password Reset Successful!', {
        description: 'Your password has been updated. You can now sign in.',
        duration: 5000,
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Reset Failed', {
        description: 'Unable to reset your password. Please try again.',
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
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('password')}
              className={
                errors.password
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
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          )}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('confirmPassword')}
              className={
                errors.confirmPassword
                  ? 'border-destructive focus:border-destructive pr-10'
                  : 'pr-10'
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <Icons.Cross className="h-4 w-4" />
              ) : (
                <Icons.Check className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Resetting password...
            </>
          ) : (
            'Reset password'
          )}
        </Button>
      </form>

      {/* Footer Links */}
      <div className="text-center">
        <Link href="/login">
          <Button variant="ghost" className="w-full">
            <Icons.ChevronLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}
