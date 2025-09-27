import { create } from 'zustand';
import { AuthState, User } from '@/types/auth.types';
import { createClient } from '@/lib/supabase/client';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  signIn: async (email: string, password: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      if (data.user) {
        const transformedUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: 'contributor', // Should be fetched from your users table
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at || data.user.created_at,
        };
        set({ user: transformedUser, isLoading: false });
      }

      return {};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({ error: errorMessage, isLoading: false });
      return { error: errorMessage };
    }
  },

  signUp: async (email: string, password: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { error: error.message };
      }

      set({ isLoading: false });
      return {};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      set({ error: errorMessage, isLoading: false });
      return { error: errorMessage };
    }
  },

  signOut: async () => {
    const supabase = createClient();
    set({ isLoading: true });

    try {
      await supabase.auth.signOut();
      set({ user: null, error: null, isLoading: false });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ isLoading: false });
    }
  },

  initialize: () => {
    // const supabase = createClient(); // TODO: Uncomment when real auth is ready

    // TEMPORARY: Set a temporary user for development/testing
    // TODO: Remove this once auth pages are ready and Supabase is fully connected
    const tempUser: User = {
      id: 'temp-admin-user-id',
      email: 'admin@temp.com',
      role: 'contributor', // Can access all pages for testing
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ user: tempUser, isLoading: false });
    return () => {}; // Return cleanup function

    // TODO: Uncomment this when auth is ready
    /*
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const transformedUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'contributor', // Should be fetched from your users table
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || session.user.created_at,
        };
        set({ user: transformedUser, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const transformedUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'contributor', // Should be fetched from your users table
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          };
          set({ user: transformedUser, isLoading: false });
        } else {
          set({ user: null, isLoading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
    */
  },
}));