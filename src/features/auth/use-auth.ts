import type { Session, User } from '@supabase/supabase-js';
import { createContext, use } from 'react';
import type { Tables } from '@/shared/types/database';

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Tables<'profiles'> | null;
  isAdmin: boolean;
  /** True until the session (and the profile, when signed in) is known. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
