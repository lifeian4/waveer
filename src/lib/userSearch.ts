import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  display_name?: string;
  phone_number?: string;
  avatar_url?: string;
  bio?: string;
  country_name?: string;
  onboarding_completed: boolean;
  created_at: string;
}

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  if (!query || query.trim().length < 2) {
    console.log('Search query too short:', query);
    return [];
  }

  try {
    console.log('Searching users with query:', query);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, display_name, phone_number, avatar_url, bio, country_name, onboarding_completed, created_at')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%,display_name.ilike.%${query}%,phone_number.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(10)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching users:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log('User search results:', data);
    console.log('Found', data?.length || 0, 'users');
    
    return data || [];
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
};

export const getPopularUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, bio, country_name, onboarding_completed, created_at')
      .eq('onboarding_completed', true)
      .not('avatar_url', 'is', null)
      .limit(5)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching popular users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPopularUsers:', error);
    return [];
  }
};
