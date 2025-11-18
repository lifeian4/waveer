import { supabase } from "./firebase";

// User Profile Operations
export const createUserProfile = async (userId: string, userData: {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
}) => {
  const { error } = await supabase
    .from('profiles')
    .insert([{ id: userId, ...userData }]);
  if (error) throw error;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
};

// Course Progress Operations
export const saveCourseProgress = async (userId: string, courseId: string, progress: {
  completed: boolean;
  percentage: number;
  lastAccessed: number;
}) => {
  const { error } = await supabase
    .from('course_progress')
    .upsert({ user_id: userId, course_id: courseId, ...progress });
  if (error) throw error;
};

export const getCourseProgress = async (userId: string, courseId: string) => {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  if (error) return null;
  return data;
};

export const getAllUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) return {};
  return data || {};
};

// Enrollment Operations
export const enrollInCourse = async (userId: string, courseId: string) => {
  const { error } = await supabase
    .from('enrollments')
    .insert([{
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: 'active'
    }]);
  if (error) throw error;
};

export const getUserEnrollments = async (userId: string) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId);
  if (error) return {};
  return data || {};
};

// Real-time Listeners
export const subscribeToUserProfile = (userId: string, callback: (data: any) => void) => {
  const subscription = supabase
    .channel(`profiles:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
};

export const subscribeToCourseProgress = (userId: string, courseId: string, callback: (data: any) => void) => {
  const subscription = supabase
    .channel(`progress:${userId}:${courseId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'course_progress', filter: `user_id=eq.${userId},course_id=eq.${courseId}` }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
};

// Comments/Discussion Operations
export const addComment = async (courseId: string, userId: string, comment: {
  text: string;
  userName: string;
  userPhoto?: string;
}) => {
  const { error } = await supabase
    .from('comments')
    .insert([{
      course_id: courseId,
      user_id: userId,
      ...comment,
      timestamp: new Date().toISOString()
    }]);
  if (error) throw error;
};

export const getCourseComments = async (courseId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('course_id', courseId)
    .order('timestamp', { ascending: false });
  if (error) return {};
  return data || {};
};

export const subscribeToComments = (courseId: string, callback: (data: any) => void) => {
  const subscription = supabase
    .channel(`comments:${courseId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `course_id=eq.${courseId}` }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  
  return () => subscription.unsubscribe();
};

// Favorites/Bookmarks
export const addToFavorites = async (userId: string, courseId: string) => {
  const { error } = await supabase
    .from('favorites')
    .insert([{
      user_id: userId,
      course_id: courseId,
      added_at: new Date().toISOString()
    }]);
  if (error) throw error;
};

export const removeFromFavorites = async (userId: string, courseId: string) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId);
  if (error) throw error;
};

export const getUserFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);
  if (error) return {};
  return data || {};
};

// Analytics/Stats
export const trackCourseView = async (courseId: string) => {
  const { data: existing } = await supabase
    .from('analytics')
    .select('views')
    .eq('course_id', courseId)
    .single();
  
  const currentViews = existing?.views || 0;
  const { error } = await supabase
    .from('analytics')
    .upsert({ course_id: courseId, views: currentViews + 1 });
  if (error) throw error;
};

export const getUserStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) return {
    coursesCompleted: 0,
    totalLearningTime: 0,
    streak: 0
  };
  return data;
};

export const updateUserStats = async (userId: string, stats: any) => {
  const { error } = await supabase
    .from('user_stats')
    .upsert({ user_id: userId, ...stats });
  if (error) throw error;
};
