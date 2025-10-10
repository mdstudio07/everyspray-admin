'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthStore } from '@/lib/stores/auth';
import { useUsernameAvailability } from '@/hooks/auth/use-username-availability';
import {
  checkEmailExists,
  generateUniqueUsername,
} from '@/lib/auth/registration-helpers';
import {
  emailSchema,
  detailsSchema,
  type EmailFormData,
  type DetailsFormData,
} from '@/lib/auth/registration-schemas';
import { EmailStepForm, DetailsStepForm } from '@/components/auth/register';

/**
 * Register Page Component
 *
 * Two-step registration: Email verification → Details form
 * Following Rule 30 (Split Large Code) - extracted to components
 * Following Rule 23 (Keep App Minimal) - logic in lib, components in components
 */

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, clearError } = useAuthStore();
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [generatedUsername, setGeneratedUsername] = useState('');

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
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

  const { username } = detailsForm.watch();

  // Username availability check hook
  const { isAvailable: usernameAvailable, isChecking: checkingUsername } =
    useUsernameAvailability(username, generatedUsername);

  // =====================================
  // GOOGLE OAUTH HANDLER
  // =====================================

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
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
      const { exists, error: emailError } = await checkEmailExists(data.email);

      if (emailError) {
        toast.error('Error', {
          description: emailError,
          duration: 3000,
        });
        setCheckingEmail(false);
        return;
      }

      if (exists) {
        toast.error('Email Already Exists', {
          description: 'This email is already registered. Please sign in instead.',
          duration: 5000,
        });
        setCheckingEmail(false);
        return;
      }

      // Generate unique username
      const { username: finalUsername, error: usernameError } =
        await generateUniqueUsername(data.email);

      if (usernameError) {
        toast.error('Error', {
          description: usernameError,
          duration: 3000,
        });
        setCheckingEmail(false);
        return;
      }

      setUserEmail(data.email);
      setGeneratedUsername(finalUsername);
      detailsForm.setValue('username', finalUsername);
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
    <div className="w-full space-y-8">
      {/* Header */}
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 'email'
            ? 'Enter your email below to create your account'
            : 'Complete your profile details'}
        </p>
      </header>

      {/* Forms Section */}
      <section className="space-y-6" aria-label="Registration form">
        {step === 'email' ? (
          <EmailStepForm
            form={emailForm}
            onSubmit={onEmailSubmit}
            onGoogleSignUp={handleGoogleSignUp}
            isLoading={isLoading}
            isChecking={checkingEmail}
          />
        ) : (
          <DetailsStepForm
            form={detailsForm}
            onSubmit={onDetailsSubmit}
            onBack={() => setStep('email')}
            userEmail={userEmail}
            generatedUsername={generatedUsername}
            usernameAvailable={usernameAvailable}
            checkingUsername={checkingUsername}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            isLoading={isLoading}
          />
        )}
      </section>

      {/* Footer */}
      <footer className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline transition-colors duration-150"
        >
          Sign in
        </Link>
      </footer>
    </div>
  );
}
