/**
 * Toast Messages Configuration
 *
 * Centralized toast notification messages for the entire application.
 * Following Rule 18 (DRY) - single source of truth for all user-facing messages.
 *
 * Message Types:
 * - error: Critical failures, database errors
 * - warning: User mistakes, validation issues (e.g., email exists)
 * - success: Successful operations
 * - info: Neutral information, coming soon features
 *
 * Usage:
 * import { TOAST_MESSAGES, toastHelpers } from '@/lib/constants/toast-messages';
 * toastHelpers.error(TOAST_MESSAGES.auth.login.failed);
 */

import toast from 'react-hot-toast';

export const TOAST_MESSAGES = {
  // Authentication Messages
  auth: {
    login: {
      success: 'Welcome back! Redirecting to dashboard...',
      failed: 'Login failed. Please check your credentials.',
      error: 'Login failed. Please try again.',
    },
    register: {
      emailExists: 'Email already registered. Please sign in instead.',
      usernameUnavailable: 'Username unavailable. Please choose a different one.',
      success: 'Registration successful! Check your email to verify your account.',
      failed: 'Registration failed. Please try again.',
      checkEmail: 'Unexpected error occurred. Please try again.',
    },
    forgotPassword: {
      emailNotFound: 'Email not registered. Please check and try again.',
      linkSent: 'Reset link sent! Check your email.',
      failed: 'Unable to send reset email. Please try again.',
      rateLimit: (seconds: number) => `Please wait ${seconds}s before requesting again.`,
      checkEmail: 'Unexpected error occurred. Please try again.',
    },
    resetPassword: {
      success: 'Password reset successful! Redirecting to login...',
      failed: 'Password reset failed. Please try again.',
      weakPassword: 'Password is too weak. Please use a stronger password.',
      invalidToken: 'Invalid or expired reset link. Please request a new one.',
    },
    google: {
      comingSoon: 'Google authentication coming soon!',
      signInFailed: 'Unable to sign in with Google. Please try again.',
      signUpFailed: 'Unable to sign up with Google. Please try again.',
    },
    verification: {
      success: 'Email verified successfully! You can now sign in.',
      failed: 'Verification failed. Please try again or request a new link.',
      expired: 'Verification link expired. Please request a new one.',
    },
  },

  // Form Validation Messages
  validation: {
    required: (field: string) => `${field} is required`,
    email: 'Please enter a valid email address',
    password: {
      tooShort: 'Password must be at least 6 characters long',
      tooWeak: 'Password is too weak. Use letters, numbers, and symbols.',
    },
    username: {
      tooShort: 'Username must be at least 3 characters long',
      invalid: 'Username can only contain letters, numbers, and underscores',
    },
  },

  // General Messages
  general: {
    error: 'Something went wrong. Please try again.',
    success: 'Operation completed successfully!',
    loading: 'Processing...',
    saved: 'Changes saved successfully!',
    deleted: 'Deleted successfully!',
    copied: 'Copied to clipboard!',
  },

  // Network/API Messages
  network: {
    offline: 'No internet connection. Please check your network.',
    timeout: 'Request timed out. Please try again.',
    serverError: 'Server error. Please try again later.',
  },
} as const;

// Toast helper functions for consistent usage
export const toastHelpers = {
  /**
   * Show warning toast for user mistakes (e.g., email exists)
   * Uses error toast with warning icon
   */
  warn: (message: string) => {
    toast.error(message, {
      icon: '⚠️',
    });
  },

  /**
   * Show error toast for failures
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * Show success toast
   */
  success: (message: string) => {
    toast.success(message);
  },

  /**
   * Show info toast
   */
  info: (message: string) => {
    toast(message);
  },
};
