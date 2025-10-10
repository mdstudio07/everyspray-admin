/**
 * Toast Notification Configuration
 *
 * Global toast configuration with theme-aware styling and 6s duration.
 * Uses react-hot-toast for clean, accessible notifications.
 *
 * Follows:
 * - Rule 43: Semantic colors (success, warning, destructive)
 * - Rule 46: Accessibility (proper ARIA attributes)
 * - Rule 48: Interaction feedback (150ms transitions)
 */

'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 6000,

        // Styling
        className: '',
        style: {
          borderRadius: 'var(--radius)',
          fontSize: '0.875rem',
          padding: '12px 16px',
          maxWidth: '500px',
        },

        // Default styling (neutral)
        success: {
          duration: 6000,
        },

        error: {
          duration: 6000,
        },

        loading: {
          duration: Infinity,
        },
      }}
    />
  );
}
