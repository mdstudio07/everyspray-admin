/**
 * Username Availability Hook
 *
 * Checks username availability with debouncing
 * Following Rule 23 (Keep App Minimal) - business logic extracted to lib
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUsernameAvailability(username: string, generatedUsername: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (username && username.length >= 3 && username !== generatedUsername) {
      setIsChecking(true);
      const timeoutId = setTimeout(async () => {
        try {
          const supabase = createClient();
          const { data: usernameExists, error } = await supabase.rpc(
            'check_username_exists',
            { p_username: username }
          );

          if (error) {
            console.error('Username check error:', error);
            setIsAvailable(null);
          } else {
            setIsAvailable(!usernameExists);
          }
        } catch (error) {
          console.error('Error checking username:', error);
          setIsAvailable(null);
        } finally {
          setIsChecking(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (username === generatedUsername) {
      setIsAvailable(true);
      setIsChecking(false);
    } else {
      setIsAvailable(null);
      setIsChecking(false);
    }
  }, [username, generatedUsername]);

  return { isAvailable, isChecking };
}
