import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types (will be auto-generated from your Supabase schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          completed: boolean;
          percentage: number;
          last_accessed: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          completed?: boolean;
          percentage?: number;
          last_accessed?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          completed?: boolean;
          percentage?: number;
          last_accessed?: string;
          created_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          status: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          status?: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          status?: string;
          enrolled_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          added_at?: string;
        };
      };
    };
  };
};
