import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
        },
        emailRedirectTo: 'https://waveer.netlify.app/onboarding',
      },
    });

    if (error) throw error;

    // Create user profile in profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: displayName,
          avatar_url: null,
        });

      if (profileError) console.error('Profile creation error:', profileError);
    }
  };

  const login = async (identifier: string, password: string) => {
    // Check if the identifier is an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    
    // Check if the identifier is a phone number
    const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier);
    
    if (isEmail) {
      // Login with email
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (error) throw error;
    } else if (isPhone) {
      // Login with phone number
      const { error } = await supabase.auth.signInWithPassword({
        phone: identifier,
        password,
      });

      if (error) throw error;
    } else {
      // Login with username
      // First, find the user's email by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single();

      if (profileError || !profile) {
        throw new Error('Invalid username or password');
      }

      // Login with the found email
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (error) throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://waveer.netlify.app/onboarding`,
      },
    });

    if (error) throw error;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    session,
    signup,
    login,
    logout,
    loginWithGoogle,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};