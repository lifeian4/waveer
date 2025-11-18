import { createClient } from '@supabase/supabase-js';

// Supabase client for realtime notifications
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://laguwccaczvehldrppll.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3V3Y2NhY3p2ZWhsZHJwcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTYzNDIsImV4cCI6MjA3NzkzMjM0Mn0.v5Vc8gCvAecMEDXGce8oPfk06P4eABs20pdtof0X0F4';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Realtime notification channel
export const createNotificationChannel = (userId: string) => {
  return supabase.channel(`notifications:${userId}`);
};

// Subscribe to incoming call notifications
export const subscribeToIncomingCalls = (userId: string, callback: (data: any) => void) => {
  const channel = createNotificationChannel(userId);
  
  channel
    .on('broadcast', { event: 'incoming_call' }, (payload) => {
      callback(payload.payload);
    })
    .subscribe();
  
  return channel;
};

// Subscribe to message notifications
export const subscribeToMessages = (userId: string, callback: (data: any) => void) => {
  const channel = createNotificationChannel(userId);
  
  channel
    .on('broadcast', { event: 'new_message' }, (payload) => {
      callback(payload.payload);
    })
    .subscribe();
  
  return channel;
};

// Send notification via Supabase Realtime
export const sendRealtimeNotification = async (
  toUserId: string,
  event: 'incoming_call' | 'new_message',
  data: any
) => {
  const channel = supabase.channel(`notifications:${toUserId}`);
  
  await channel.send({
    type: 'broadcast',
    event,
    payload: data,
  });
};

export default supabase;
