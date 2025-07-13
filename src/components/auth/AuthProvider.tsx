import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'instructor' | 'pedagogical_manager' | 'admin' | '';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
    phone?: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'instructor',
    phone: string = ''
  ) => {
    const redirectUrl = `${window.location.origin}/verify`;

    // Step 1: Create the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
          phone: phone,
        },
      },
    });

    if (error || !data?.user) {
      return { error };
    }

    const userId = data.user.id;

    // Step 2: Insert into profiles table
const { error: profileError } = await supabase.from('profiles').insert([
  {
    id: userId,
    full_name: fullName,
    phone: phone || null,           // optional, send null if empty string
    role: role || 'instructor',    // default role if missing
    email: email || null,
    hourly_rate: null,              // or some default numeric value if you want
    birthdate: null,               // optional date
    current_work_hours: 0,          // default per schema
    benefits: null,                 // optional text
    // created_at, updated_at are handled by DB defaults
  },
]);

    return { error: profileError };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
console.log("TOKEN :   "+session?.user.user_metadata.role);
console.log('access token:', session?.access_token);
  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
