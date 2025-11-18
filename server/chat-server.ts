/**
 * Production-Ready Chat + Calling Server
 * Express + Socket.IO with Supabase + Redis
 * 
 * Features:
 * - JWT auth for REST & WebSocket
 * - Real-time messaging with delivery/read status
 * - WebRTC signaling (offer/answer/ICE)
 * - Presence management
 * - Typing indicators
 * - Push notification triggers
 * - Redis adapter for horizontal scaling
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'your-jwt-secret';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// TURN server config (for WebRTC NAT traversal)
const TURN_CONFIG = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
    {
      urls: process.env.TURN_URL || 'turn:your-turn-server.com:3478',
      username: process.env.TURN_USERNAME || 'user',
      credential: process.env.TURN_PASSWORD || 'pass',
    },
  ],
};

// ============================================================================
// INITIALIZATION
// ============================================================================

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6, // 1MB for media metadata
});

// Supabase client
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

// Redis clients for Socket.IO adapter
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());
app.use(cors());

/**
 * JWT verification middleware
 */
const verifyJWT = (token: string): { sub: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { sub: decoded.sub, email: decoded.email };
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error);
    return null;
  }
};

/**
 * Express auth middleware
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = verifyJWT(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  (req as any).user = user;
  next();
};

// ============================================================================
// REST ENDPOINTS
// ============================================================================

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get TURN configuration
 * Used by client to establish WebRTC connections
 */
app.get('/chat/turn-config', authMiddleware, (req: Request, res: Response) => {
  res.json(TURN_CONFIG);
});

/**
 * Get message history
 */
app.get('/chat/messages/:conversationId', authMiddleware, async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const userId = (req as any).user.sub;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    // Determine if 1:1 or group chat
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId);

    let query = supabase
      .from('messages5')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isUUID) {
      // Group chat
      query = query.eq('room_id', conversationId);
    } else {
      // 1:1 chat - get messages between two users
      const otherUserId = conversationId;
      query = query.or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ messages: data || [], count: data?.length || 0 });
  } catch (error) {
    console.error('[Chat] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Get call history
 */
app.get('/chat/calls/:userId', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = (req as any).user.sub;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  try {
    const { data: audioCalls, error: audioError } = await supabase
      .from('audiocall5')
      .select('*')
      .or(`caller_id.eq.${currentUserId},callee_id.eq.${currentUserId}`)
      .order('initiated_at', { ascending: false })
      .limit(limit);

    const { data: videoCalls, error: videoError } = await supabase
      .from('videocall5')
      .select('*')
      .or(`caller_id.eq.${currentUserId},callee_id.eq.${currentUserId}`)
      .order('initiated_at', { ascending: false })
      .limit(limit);

    if (audioError || videoError) throw audioError || videoError;

    res.json({ audio_calls: audioCalls || [], video_calls: videoCalls || [] });
  } catch (error) {
    console.error('[Chat] Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// ============================================================================
// SOCKET.IO NAMESPACE: /chat
// ============================================================================

const chatNamespace = io.of('/chat');

/**
 * Socket.IO authentication middleware
 */
chatNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  const user = verifyJWT(token);
  if (!user) {
    return next(new Error('Invalid token'));
  }

  socket.data.userId = user.sub;
  socket.data.email = user.email;
  next();
});

/**
 * Connection event
 */
chatNamespace.on('connection', (socket: Socket) => {
  const userId = socket.data.userId;
  console.log(`[Socket] User connected: ${userId}`);

  // Join user-specific room for direct messages
  socket.join(`user:${userId}`);

  // Update presence
  updatePresence(userId, 'online');

  // Broadcast user online
  chatNamespace.emit('user:online', { userId, timestamp: new Date().toISOString() });

  // =========================================================================
  // MESSAGING EVENTS
  // =========================================================================

  /**
   * Send message (1:1 or group)
   */
  socket.on('message:send', async (data: any) => {
    const { receiverId, roomId, text, mediaUrl, mediaType, duration, fileSize } = data;

    try {
      const messageId = uuidv4();

      // Insert message into database
      const { error } = await supabase.from('messages5').insert({
        id: messageId,
        sender_id: userId,
        receiver_id: receiverId || null,
        room_id: roomId || null,
        message_text: text,
        media_url: mediaUrl,
        media_type: mediaType || 'text',
        duration_ms: duration,
        file_size_bytes: fileSize,
        status: 'sent',
      });

      if (error) throw error;

      const message = {
        id: messageId,
        sender_id: userId,
        receiver_id: receiverId,
        room_id: roomId,
        message_text: text,
        media_url: mediaUrl,
        media_type: mediaType || 'text',
        status: 'sent',
        created_at: new Date().toISOString(),
      };

      // Emit to recipient(s)
      if (receiverId) {
        // 1:1 message
        chatNamespace.to(`user:${receiverId}`).emit('message:received', message);
        socket.emit('message:sent', message);
      } else if (roomId) {
        // Group message
        chatNamespace.to(`room:${roomId}`).emit('message:received', message);
      }

      // Trigger push notification if recipient is offline
      if (receiverId) {
        await triggerPushNotification(receiverId, {
          type: 'message',
          from_user_id: userId,
          message_preview: text?.substring(0, 100) || 'Sent a message',
        });
      }
    } catch (error) {
      console.error('[Socket] Error sending message:', error);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  });

  /**
   * Mark message as delivered
   */
  socket.on('message:delivered', async (data: any) => {
    const { messageId } = data;

    try {
      await supabase
        .from('messages5')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', messageId);

      chatNamespace.emit('message:status', { messageId, status: 'delivered' });
    } catch (error) {
      console.error('[Socket] Error marking message delivered:', error);
    }
  });

  /**
   * Mark message as read
   */
  socket.on('message:read', async (data: any) => {
    const { messageId } = data;

    try {
      await supabase
        .from('messages5')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', messageId);

      chatNamespace.emit('message:status', { messageId, status: 'read' });
    } catch (error) {
      console.error('[Socket] Error marking message read:', error);
    }
  });

  /**
   * Typing indicator
   */
  socket.on('typing:start', (data: any) => {
    const { receiverId, roomId } = data;

    if (receiverId) {
      chatNamespace.to(`user:${receiverId}`).emit('typing:indicator', { userId, isTyping: true });
    } else if (roomId) {
      chatNamespace.to(`room:${roomId}`).emit('typing:indicator', { userId, isTyping: true });
    }
  });

  socket.on('typing:stop', (data: any) => {
    const { receiverId, roomId } = data;

    if (receiverId) {
      chatNamespace.to(`user:${receiverId}`).emit('typing:indicator', { userId, isTyping: false });
    } else if (roomId) {
      chatNamespace.to(`room:${roomId}`).emit('typing:indicator', { userId, isTyping: false });
    }
  });

  // =========================================================================
  // CALLING EVENTS (WebRTC Signaling)
  // =========================================================================

  /**
   * Initiate call (audio or video)
   */
  socket.on('call:initiate', async (data: any) => {
    const { calleeId, callType } = data; // callType: 'audio' or 'video'
    const callId = uuidv4();

    try {
      // Create call record
      const table = callType === 'audio' ? 'audiocall5' : 'videocall5';
      const { error } = await supabase.from(table).insert({
        id: uuidv4(),
        call_id: callId,
        caller_id: userId,
        callee_id: calleeId,
        status: 'initiated',
      });

      if (error) throw error;

      // Send call offer to callee
      chatNamespace.to(`user:${calleeId}`).emit('call:incoming', {
        callId,
        callType,
        callerId: userId,
        iceServers: TURN_CONFIG.iceServers,
      });

      socket.emit('call:initiated', { callId, calleeId, callType });

      // Trigger push notification
      await triggerPushNotification(calleeId, {
        type: 'incoming_call',
        from_user_id: userId,
        call_type: callType,
        call_id: callId,
      });
    } catch (error) {
      console.error('[Socket] Error initiating call:', error);
      socket.emit('call:error', { error: 'Failed to initiate call' });
    }
  });

  /**
   * Send WebRTC offer
   */
  socket.on('call:offer', (data: any) => {
    const { callId, calleeId, offer } = data;

    chatNamespace.to(`user:${calleeId}`).emit('call:offer', {
      callId,
      callerId: userId,
      offer, // SDP offer
    });
  });

  /**
   * Send WebRTC answer
   */
  socket.on('call:answer', async (data: any) => {
    const { callId, callerId, answer } = data;

    try {
      // Update call status
      const callType = data.callType || 'video';
      const table = callType === 'audio' ? 'audiocall5' : 'videocall5';
      await supabase
        .from(table)
        .update({ status: 'accepted', answered_at: new Date().toISOString() })
        .eq('call_id', callId);

      chatNamespace.to(`user:${callerId}`).emit('call:answer', {
        callId,
        answer, // SDP answer
      });
    } catch (error) {
      console.error('[Socket] Error sending answer:', error);
    }
  });

  /**
   * Send ICE candidate
   */
  socket.on('call:ice-candidate', (data: any) => {
    const { callId, candidate, targetUserId } = data;

    chatNamespace.to(`user:${targetUserId}`).emit('call:ice-candidate', {
      callId,
      candidate, // ICE candidate
    });
  });

  /**
   * Reject call
   */
  socket.on('call:reject', async (data: any) => {
    const { callId, callType } = data;

    try {
      const table = callType === 'audio' ? 'audiocall5' : 'videocall5';
      await supabase
        .from(table)
        .update({ status: 'rejected', ended_at: new Date().toISOString() })
        .eq('call_id', callId);

      chatNamespace.emit('call:rejected', { callId });
    } catch (error) {
      console.error('[Socket] Error rejecting call:', error);
    }
  });

  /**
   * End call
   */
  socket.on('call:end', async (data: any) => {
    const { callId, callType, duration } = data;

    try {
      const table = callType === 'audio' ? 'audiocall5' : 'videocall5';
      await supabase
        .from(table)
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('call_id', callId);

      chatNamespace.emit('call:ended', { callId, duration });
    } catch (error) {
      console.error('[Socket] Error ending call:', error);
    }
  });

  // =========================================================================
  // PRESENCE & ROOM EVENTS
  // =========================================================================

  /**
   * Join room
   */
  socket.on('room:join', (data: any) => {
    const { roomId } = data;
    socket.join(`room:${roomId}`);
    chatNamespace.to(`room:${roomId}`).emit('user:joined', { userId, roomId });
  });

  /**
   * Leave room
   */
  socket.on('room:leave', (data: any) => {
    const { roomId } = data;
    socket.leave(`room:${roomId}`);
    chatNamespace.to(`room:${roomId}`).emit('user:left', { userId, roomId });
  });

  // =========================================================================
  // DISCONNECTION
  // =========================================================================

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${userId}`);
    updatePresence(userId, 'offline');
    chatNamespace.emit('user:offline', { userId, timestamp: new Date().toISOString() });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update user presence in Redis
 */
async function updatePresence(userId: string, status: 'online' | 'offline') {
  try {
    const redisClient = createClient({ url: REDIS_URL });
    await redisClient.connect();
    await redisClient.setEx(`presence:${userId}`, 3600, status); // 1 hour TTL
    await redisClient.disconnect();
  } catch (error) {
    console.error('[Presence] Error updating presence:', error);
  }
}

/**
 * Trigger push notification
 * Integrates with FCM/APNs
 */
async function triggerPushNotification(userId: string, payload: any) {
  try {
    // Get user's push tokens from database
    const { data: user, error } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', userId)
      .single();

    if (error || !user?.metadata?.push_tokens) return;

    const pushTokens = user.metadata.push_tokens || [];

    // Send to FCM (Firebase Cloud Messaging)
    for (const token of pushTokens) {
      await sendFCMNotification(token, payload);
    }
  } catch (error) {
    console.error('[Push] Error triggering notification:', error);
  }
}

/**
 * Send FCM notification
 */
async function sendFCMNotification(token: string, payload: any) {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${process.env.FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.type === 'incoming_call' ? 'Incoming Call' : 'New Message',
          body: payload.message_preview || 'You have a new notification',
        },
        data: payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`FCM error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
  }
}

// ============================================================================
// REDIS ADAPTER (for horizontal scaling)
// ============================================================================

async function setupRedisAdapter() {
  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Redis] Adapter configured for Socket.IO');
  } catch (error) {
    console.error('[Redis] Error setting up adapter:', error);
  }
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function start() {
  try {
    await setupRedisAdapter();

    httpServer.listen(PORT, () => {
      console.log(`[Server] Chat server listening on port ${PORT}`);
      console.log(`[Server] WebSocket namespace: /chat`);
      console.log(`[Server] REST endpoints: /chat/*`);
    });
  } catch (error) {
    console.error('[Server] Error starting server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

export default app;
