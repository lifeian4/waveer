/**
 * Supabase Realtime Notifications Service
 * Replaces Firebase with Supabase's built-in realtime capabilities
 */

import { createClient } from '@supabase/supabase-js';
import express from 'express';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPayload {
  type: 'incoming_call' | 'message' | 'call_missed' | 'call_ended';
  title: string;
  body: string;
  data: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// SEND REALTIME NOTIFICATION
// ============================================================================

/**
 * Send a realtime notification to a user via Supabase Realtime
 */
export const sendRealtimeNotification = async (
  toUserId: string,
  payload: NotificationPayload
): Promise<boolean> => {
  try {
    // Store notification in database for persistence
    const { error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: toUserId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        read: false,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[Notifications] Database error:', dbError);
      return false;
    }

    // Send realtime broadcast
    const channel = supabase.channel(`notifications:${toUserId}`);
    
    await channel.send({
      type: 'broadcast',
      event: payload.type,
      payload,
    });

    console.log('[Notifications] Sent to user:', toUserId);
    return true;
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return false;
  }
};

/**
 * Send incoming call notification
 * Stores in notifi table with call details
 */
export const sendIncomingCallNotification = async (
  callerId: string,
  calleeId: string,
  callId: string,
  callType: 'audio' | 'video'
): Promise<boolean> => {
  try {
    // Store in notifi table
    const { error: dbError } = await supabase
      .from('notifi')
      .insert({
        user_id: calleeId,
        caller_id: callerId,
        call_id: callId,
        call_type: callType,
        title: `Incoming ${callType} Call`,
        body: `${callerId} is calling...`,
        data: {
          callId,
          callerId,
          callType,
          action: 'accept_call',
        },
        read: false,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[Notifications] Database error:', dbError);
      return false;
    }

    // Send realtime broadcast
    const channel = supabase.channel(`notifi:${calleeId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'incoming_call',
      payload: {
        type: 'incoming_call',
        title: `Incoming ${callType} Call`,
        body: `${callerId} is calling...`,
        data: {
          callId,
          callerId,
          callType,
          action: 'accept_call',
        },
        timestamp: Date.now(),
      },
    });

    console.log('[Notifications] Incoming call sent to user:', calleeId);
    return true;
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return false;
  }
};

/**
 * Send message notification
 */
export const sendMessageNotification = async (
  senderId: string,
  recipientId: string,
  messageText: string,
  messageId: string
): Promise<boolean> => {
  const payload: NotificationPayload = {
    type: 'message',
    title: 'New Message',
    body: messageText.substring(0, 100),
    data: {
      messageId,
      senderId,
      action: 'open_chat',
    },
    timestamp: Date.now(),
  };

  return sendRealtimeNotification(recipientId, payload);
};

/**
 * Send call missed notification
 * Stores in notifi table
 */
export const sendCallMissedNotification = async (
  callerId: string,
  calleeId: string,
  callType: 'audio' | 'video',
  callId: string
): Promise<boolean> => {
  try {
    const { error: dbError } = await supabase
      .from('notifi')
      .insert({
        user_id: calleeId,
        caller_id: callerId,
        call_id: callId,
        call_type: callType,
        title: 'Missed Call',
        body: `You missed a ${callType} call from ${callerId}`,
        data: {
          callerId,
          callType,
          type: 'call_missed',
        },
        read: false,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[Notifications] Database error:', dbError);
      return false;
    }

    const channel = supabase.channel(`notifi:${calleeId}`);
    await channel.send({
      type: 'broadcast',
      event: 'call_missed',
      payload: {
        type: 'call_missed',
        title: 'Missed Call',
        body: `You missed a ${callType} call from ${callerId}`,
        data: { callerId, callType },
        timestamp: Date.now(),
      },
    });

    return true;
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return false;
  }
};

/**
 * Send call ended notification
 * Stores in notifi table
 */
export const sendCallEndedNotification = async (
  userId: string,
  callerId: string,
  duration: number,
  callType: 'audio' | 'video',
  callId: string
): Promise<boolean> => {
  try {
    const { error: dbError } = await supabase
      .from('notifi')
      .insert({
        user_id: userId,
        caller_id: callerId,
        call_id: callId,
        call_type: callType,
        title: 'Call Ended',
        body: `${callType} call ended (${Math.floor(duration / 1000)}s)`,
        data: {
          callerId,
          callType,
          duration,
          type: 'call_ended',
        },
        read: false,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[Notifications] Database error:', dbError);
      return false;
    }

    const channel = supabase.channel(`notifi:${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'call_ended',
      payload: {
        type: 'call_ended',
        title: 'Call Ended',
        body: `${callType} call ended (${Math.floor(duration / 1000)}s)`,
        data: { callerId, callType, duration },
        timestamp: Date.now(),
      },
    });

    return true;
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return false;
  }
};

// ============================================================================
// EXPRESS ENDPOINTS
// ============================================================================

export const createNotificationRoutes = (app: express.Application) => {
  /**
   * POST /notifications/send-call
   * Send incoming call notification
   */
  app.post('/notifications/send-call', async (req, res) => {
    try {
      const { callerId, calleeId, callId, callType } = req.body;

      if (!callerId || !calleeId || !callId || !callType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await sendIncomingCallNotification(
        callerId,
        calleeId,
        callId,
        callType
      );

      res.json({ success });
    } catch (error) {
      console.error('[Notifications] Error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  /**
   * POST /notifications/send-message
   * Send message notification
   */
  app.post('/notifications/send-message', async (req, res) => {
    try {
      const { senderId, recipientId, messageText, messageId } = req.body;

      if (!senderId || !recipientId || !messageText || !messageId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await sendMessageNotification(
        senderId,
        recipientId,
        messageText,
        messageId
      );

      res.json({ success });
    } catch (error) {
      console.error('[Notifications] Error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  /**
   * POST /notifications/send-missed-call
   * Send missed call notification
   */
  app.post('/notifications/send-missed-call', async (req, res) => {
    try {
      const { callerId, calleeId, callType, callId } = req.body;

      if (!callerId || !calleeId || !callType || !callId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await sendCallMissedNotification(
        callerId,
        calleeId,
        callType,
        callId
      );

      res.json({ success });
    } catch (error) {
      console.error('[Notifications] Error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  /**
   * POST /notifications/send-call-ended
   * Send call ended notification
   */
  app.post('/notifications/send-call-ended', async (req, res) => {
    try {
      const { userId, callerId, duration, callType, callId } = req.body;

      if (!userId || !callerId || duration === undefined || !callType || !callId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await sendCallEndedNotification(
        userId,
        callerId,
        duration,
        callType,
        callId
      );

      res.json({ success });
    } catch (error) {
      console.error('[Notifications] Error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });
};

export default {
  sendRealtimeNotification,
  sendIncomingCallNotification,
  sendMessageNotification,
  sendCallMissedNotification,
  sendCallEndedNotification,
  createNotificationRoutes,
};
