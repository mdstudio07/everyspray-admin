/**
 * Registration Helper Functions
 *
 * Pure utility functions for registration flow
 * Following Rule 23 (Keep App Minimal) - logic lives in lib
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Check if email already exists in database
 */
export async function checkEmailExists(email: string): Promise<{
  exists: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: emailExists, error } = await supabase.rpc(
      'check_email_exists',
      { p_email: email }
    );

    if (error) {
      console.error('Email check error:', error);
      return { exists: false, error: 'Failed to check email availability' };
    }

    return { exists: emailExists };
  } catch (error) {
    console.error('Error checking email:', error);
    return { exists: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Generate username from email
 */
export function generateUsernameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 20);
}

/**
 * Check if username exists and generate unique one if needed
 */
export async function generateUniqueUsername(email: string): Promise<{
  username: string;
  error?: string;
}> {
  try {
    const baseUsername = generateUsernameFromEmail(email);
    const supabase = createClient();

    const { data: usernameExists, error } = await supabase.rpc(
      'check_username_exists',
      { p_username: baseUsername }
    );

    if (error) {
      console.error('Username check error:', error);
      return { username: baseUsername, error: 'Failed to generate username' };
    }

    // If username doesn't exist, use it
    if (!usernameExists) {
      return { username: baseUsername };
    }

    // Generate unique username with random suffix
    const randomSuffix = Math.floor(Math.random() * 9999);
    const uniqueUsername = `${baseUsername}_${randomSuffix}`;

    return { username: uniqueUsername };
  } catch (error) {
    console.error('Error generating username:', error);
    return {
      username: generateUsernameFromEmail(email),
      error: 'An unexpected error occurred',
    };
  }
}
