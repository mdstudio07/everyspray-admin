import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types/auth.types';

export const getServerSession = async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Transform Supabase user to our User type
    // Note: In real implementation, you'd fetch additional user data from your users table
    return {
      id: user.id,
      email: user.email || '',
      role: 'contributor', // Default role - should be fetched from your users table
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
};

export const requireAuth = async (): Promise<User> => {
  const user = await getServerSession();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
};

export const requireRole = async (allowedRoles: string[]): Promise<User> => {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  return user;
};