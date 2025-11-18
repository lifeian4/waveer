/**
 * Push Notifications Service
 * FCM (Firebase Cloud Messaging) for Android/iOS
 * Browser Push API for web
 */

import express, { Express, Request, Response } from 'express';
import admin from 'firebase-admin';

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

// Initialize Firebase Admin SDK
// Download service account key from Firebase Console
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ============================================================================
// PUSH NOTIFICATION TYPES
// ============================================================================

interface IncomingCallPayload {
  type: 'incoming_call';
  call_id: string;
  from_user_id: string;
  from_user_name?: string;
  call_type: 'audio' | 'video';
  timestamp: string;
}

interface MessagePayload {
  type: 'message';
  from_user_id: string;
  from_user_name?: string;
  message_preview: string;
  conversation_id: string;
  timestamp: string;
}

type PushPayload = IncomingCallPayload | MessagePayload;

// ============================================================================
// SEND PUSH NOTIFICATION
// ============================================================================

/**
 * Send push notification via FCM
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: PushPayload,
  options?: {
    ttl?: number; // Time to live in seconds
    priority?: 'high' | 'normal';
  }
): Promise<string> {
  try {
    const message: admin.messaging.Message = {
      token: deviceToken,
      notification: {
        title: getNotificationTitle(payload),
        body: getNotificationBody(payload),
      },
      data: {
        ...payload,
      },
      android: {
        priority: options?.priority || 'high',
        ttl: options?.ttl || 3600, // 1 hour default
        notification: {
          sound: 'default',
          channelId: 'incoming_calls', // For incoming calls
        },
      },
      apns: {
        headers: {
          'apns-priority': options?.priority === 'high' ? '10' : '5',
          'apns-ttl': String(options?.ttl || 3600),
        },
        payload: {
          aps: {
            alert: {
              title: getNotificationTitle(payload),
              body: getNotificationBody(payload),
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          title: getNotificationTitle(payload),
          body: getNotificationBody(payload),
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: payload.type,
          requireInteraction: payload.type === 'incoming_call',
        },
        data: {
          type: payload.type,
          timestamp: payload.timestamp,
          ...payload,
        },
      },
    };

    const messageId = await admin.messaging().send(message);
    console.log('[FCM] Notification sent:', messageId);
    return messageId;
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastPushNotification(
  deviceTokens: string[],
  payload: PushPayload,
  options?: {
    ttl?: number;
    priority?: 'high' | 'normal';
  }
): Promise<admin.messaging.BatchResponse> {
  try {
    const messages: admin.messaging.Message[] = deviceTokens.map((token) => ({
      token,
      notification: {
        title: getNotificationTitle(payload),
        body: getNotificationBody(payload),
      },
      data: {
        ...payload,
      },
      android: {
        priority: options?.priority || 'high',
        ttl: options?.ttl || 3600,
      },
    }));

    const response = await admin.messaging().sendAll(messages);
    console.log('[FCM] Multicast sent:', response.successCount, 'successful');
    return response;
  } catch (error) {
    console.error('[FCM] Error sending multicast:', error);
    throw error;
  }
}

/**
 * Subscribe device token to topic
 */
export async function subscribeToTopic(deviceToken: string, topic: string): Promise<void> {
  try {
    await admin.messaging().subscribeToTopic([deviceToken], topic);
    console.log('[FCM] Subscribed to topic:', topic);
  } catch (error) {
    console.error('[FCM] Error subscribing to topic:', error);
    throw error;
  }
}

/**
 * Send notification to topic
 */
export async function sendTopicNotification(
  topic: string,
  payload: PushPayload
): Promise<string> {
  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: getNotificationTitle(payload),
        body: getNotificationBody(payload),
      },
      data: {
        ...payload,
      },
    };

    const messageId = await admin.messaging().send(message);
    console.log('[FCM] Topic notification sent:', messageId);
    return messageId;
  } catch (error) {
    console.error('[FCM] Error sending topic notification:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNotificationTitle(payload: PushPayload): string {
  switch (payload.type) {
    case 'incoming_call':
      return payload.call_type === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call';
    case 'message':
      return 'New Message';
    default:
      return 'Notification';
  }
}

function getNotificationBody(payload: PushPayload): string {
  switch (payload.type) {
    case 'incoming_call':
      return payload.from_user_name ? `${payload.from_user_name} is calling...` : 'Someone is calling...';
    case 'message':
      return payload.message_preview || 'You have a new message';
    default:
      return '';
  }
}

// ============================================================================
// EXPRESS ENDPOINTS
// ============================================================================

export function setupPushNotificationRoutes(app: Express) {
  /**
   * POST /notifications/send
   * Send push notification to a user
   */
  app.post('/notifications/send', async (req: Request, res: Response) => {
    try {
      const { deviceToken, payload } = req.body;

      if (!deviceToken || !payload) {
        return res.status(400).json({ error: 'Missing deviceToken or payload' });
      }

      const messageId = await sendPushNotification(deviceToken, payload);
      res.json({ success: true, messageId });
    } catch (error) {
      console.error('[API] Error sending notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  /**
   * POST /notifications/send-multicast
   * Send push notification to multiple devices
   */
  app.post('/notifications/send-multicast', async (req: Request, res: Response) => {
    try {
      const { deviceTokens, payload } = req.body;

      if (!deviceTokens || !Array.isArray(deviceTokens) || !payload) {
        return res.status(400).json({ error: 'Invalid deviceTokens or payload' });
      }

      const response = await sendMulticastPushNotification(deviceTokens, payload);
      res.json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    } catch (error) {
      console.error('[API] Error sending multicast:', error);
      res.status(500).json({ error: 'Failed to send multicast' });
    }
  });

  /**
   * POST /notifications/subscribe-topic
   * Subscribe device to topic
   */
  app.post('/notifications/subscribe-topic', async (req: Request, res: Response) => {
    try {
      const { deviceToken, topic } = req.body;

      if (!deviceToken || !topic) {
        return res.status(400).json({ error: 'Missing deviceToken or topic' });
      }

      await subscribeToTopic(deviceToken, topic);
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Error subscribing to topic:', error);
      res.status(500).json({ error: 'Failed to subscribe to topic' });
    }
  });

  /**
   * POST /notifications/send-topic
   * Send notification to all users subscribed to topic
   */
  app.post('/notifications/send-topic', async (req: Request, res: Response) => {
    try {
      const { topic, payload } = req.body;

      if (!topic || !payload) {
        return res.status(400).json({ error: 'Missing topic or payload' });
      }

      const messageId = await sendTopicNotification(topic, payload);
      res.json({ success: true, messageId });
    } catch (error) {
      console.error('[API] Error sending topic notification:', error);
      res.status(500).json({ error: 'Failed to send topic notification' });
    }
  });
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// In your chat-server.ts, when incoming call is initiated:

async function triggerIncomingCallNotification(calleeId: string, callId: string, callType: 'audio' | 'video') {
  try {
    // Get user's device tokens from database
    const { data: user } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', calleeId)
      .single();

    if (!user?.metadata?.device_tokens) return;

    const deviceTokens = user.metadata.device_tokens || [];

    const payload: IncomingCallPayload = {
      type: 'incoming_call',
      call_id: callId,
      from_user_id: callerId,
      from_user_name: callerName,
      call_type: callType,
      timestamp: new Date().toISOString(),
    };

    // Send to all devices
    await sendMulticastPushNotification(deviceTokens, payload, {
      priority: 'high',
      ttl: 30, // 30 seconds for incoming calls
    });
  } catch (error) {
    console.error('[Notifications] Error triggering call notification:', error);
  }
}
*/
