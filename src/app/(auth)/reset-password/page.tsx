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
import { PasswordToggleButton, PasswordStrength } from '@/components/auth';

/**
 * Reset Password Page Component
 *
 * Allows users to set a new password after reset request.
 * Follows all UI/UX standards (Rules 41-55)
 */

// =====================================
// VALIDATION SCHEMA
// =====================================

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

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
    <div className="w-full space-y-8">
      {/* Header */}
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </header>

      {/* Form Section */}
      <section aria-label="Reset password form">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
            <div id="password-strength">
              <PasswordStrength password={password} />
            </div>
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
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
                {...register('confirmPassword')}
                className={
                  errors.confirmPassword
                    ? 'border-destructive focus-visible:ring-destructive pr-10'
                    : 'pr-10'
                }
              />
              <PasswordToggleButton
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.confirmPassword.message}
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
                Resetting password...
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </section>

      {/* Footer - Rule 41: Consistent spacing */}
      <footer>
        <Link href="/login" className="block">
          <Button
            variant="ghost"
            className="w-full transition-colors duration-150"
          >
            <Icons.ChevronLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </footer>
    </div>
  );
}
