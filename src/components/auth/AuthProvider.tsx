import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'instructor' | 'pedagogical_manager' | 'admin' | '';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
    phone?: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
      }
    } catch (error) {
      console.error('Unexpected error refreshing session:', error);
    }
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get initial session
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      if (initialSession) {
        console.log('Initial session found:', initialSession.user.email);
        setSession(initialSession);
        setUser(initialSession.user);
        
        // Create profile if needed
        await createProfileIfNeeded(initialSession.user);
      } else {
        console.log('No initial session found');
      }

      setLoading(false);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Create profile after sign in
          await createProfileIfNeeded(session.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
        } else if (event === 'USER_UPDATED' && session) {
          setSession(session);
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  const createProfileIfNeeded = async (user: User) => {
    try {
      console.log('Checking if profile exists for user:', user.id);
      
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record found

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        return;
      }

      if (!existingProfile) {
        console.log('Creating new profile...');
        
        // Get user metadata (this should be available after email confirmation)
        const metadata = user.user_metadata || {};
        
        const profileData = {
          id: user.id,
          full_name: metadata.full_name || metadata.fullName || '',
          phone: metadata.phone || null,
          role: (metadata.role as UserRole) || 'instructor',
          email: user.email || null,
          hourly_rate: null,
          birthdate: null,
          current_work_hours: 0,
          benefits: null,
        };

        console.log('Profile data to insert:', profileData);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully!');
        }
      } else {
        console.log('Profile already exists');
      }
    } catch (error) {
      console.error('Unexpected error in createProfileIfNeeded:', error);
    }
  };

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
    // Use window.location.origin to get the current domain
    const redirectUrl = `${window.location.origin}/verify`;

    console.log('Signing up with data:', { 
      email, 
      fullName, 
      role, 
      phone, 
      redirectUrl 
    });

    // Create user with metadata
    const { error } = await supabase.auth.signUp({
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

    if (error) {
      console.error('Signup error:', error);
    } else {
      console.log('Signup successful, check email for verification');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Debug user data when session changes
  useEffect(() => {
    if (session?.user) {
      console.log("Current user data:", {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata,
        role: session.user.user_metadata?.role,
      });
    }
  }, [session]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};