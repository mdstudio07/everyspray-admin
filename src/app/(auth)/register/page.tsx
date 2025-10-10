'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuthStore } from '@/lib/stores/auth';
import { TOAST_MESSAGES, toastHelpers } from '@/lib/constants/toast-messages';
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
      toastHelpers.info(TOAST_MESSAGES.auth.google.comingSoon);
    } catch (error) {
      console.error('Google sign-up error:', error);
      toastHelpers.error(TOAST_MESSAGES.auth.google.signUpFailed);
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
        toastHelpers.error(emailError);
        setCheckingEmail(false);
        return;
      }

      if (exists) {
        toastHelpers.warn(TOAST_MESSAGES.auth.register.emailExists);
        setCheckingEmail(false);
        return;
      }

      // Generate unique username
      const { username: finalUsername, error: usernameError } =
        await generateUniqueUsername(data.email);

      if (usernameError) {
        toastHelpers.error(usernameError);
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
      toastHelpers.error(TOAST_MESSAGES.auth.register.checkEmail);
      setCheckingEmail(false);
    }
  };

  // =====================================
  // DETAILS STEP HANDLER
  // =====================================

  const onDetailsSubmit = async (data: DetailsFormData) => {
    if (usernameAvailable === false) {
      toastHelpers.warn(TOAST_MESSAGES.auth.register.usernameUnavailable);
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
        toastHelpers.error(error);
        setIsLoading(false);
        return;
      }

      toastHelpers.success(TOAST_MESSAGES.auth.register.success);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      toastHelpers.error(TOAST_MESSAGES.auth.register.failed);
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
