# Firebase to Supabase Realtime Migration Guide

## Overview

Replaced Firebase with Supabase Realtime for push notifications and realtime communication. This eliminates the Firebase dependency and uses Supabase's built-in realtime capabilities.

## What Changed

### ✅ Removed
- Firebase Admin SDK (`firebase-admin`)
- Firebase Client SDK (`firebase`)
- FCM push notification service
- Firebase Realtime Database references

### ✅ Added
- Supabase Realtime channels for notifications
- Persistent notifications table in Supabase
- Supabase-based notification service (`server/notifications.ts`)
- Realtime broadcast events

## Files Updated

### 1. `package.json`
- Removed `firebase` and `firebase-admin` dependencies
- No new dependencies needed (Supabase already included)

### 2. `src/lib/firebase.ts` → Supabase Realtime
**Old (Firebase):**
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
```

**New (Supabase Realtime):**
```typescript
import { createClient } from '@supabase/supabase-js';

export const subscribeToIncomingCalls = (userId: string, callback: (data: any) => void) => {
  const channel = supabase.channel(`notifications:${userId}`);
  channel
    .on('broadcast', { event: 'incoming_call' }, (payload) => {
      callback(payload.payload);
    })
    .subscribe();
  return channel;
};
```

### 3. `server/notifications.ts` (New)
Replaces Firebase Cloud Messaging with Supabase Realtime:
- `sendRealtimeNotification()` - Send notification via Supabase
- `sendIncomingCallNotification()` - Call notifications
- `sendMessageNotification()` - Message notifications
- Express endpoints for triggering notifications

### 4. `server/chat-server.ts`
Updated to use Supabase Realtime notifications:
```typescript
// Old: await triggerPushNotification(calleeId, {...})
// New: await sendIncomingCallNotification(userId, calleeId, callId, callType);
```

## Setup Instructions

### 1. Create Notifications Table

Run this SQL in Supabase:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('incoming_call', 'message', 'call_missed', 'call_ended')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notifications_insert_own ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2. Update Environment Variables

No new environment variables needed. Existing Supabase credentials are used:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # For server-side notifications
```

### 3. Install Dependencies

```bash
npm install
# Firebase dependencies are already removed from package.json
```

### 4. Update Client Code

**Old (Firebase):**
```typescript
import { subscribeToIncomingCalls } from '@/lib/firebase';

subscribeToIncomingCalls(userId, (call) => {
  console.log('Incoming call:', call);
});
```

**New (Supabase Realtime):**
```typescript
import { subscribeToIncomingCalls } from '@/lib/firebase';

subscribeToIncomingCalls(userId, (call) => {
  console.log('Incoming call:', call);
});
// Same API - no changes needed!
```

## How It Works

### Incoming Call Notification Flow

1. **Client A** initiates call to **Client B**
2. **Server** receives `call:initiate` event
3. **Server** calls `sendIncomingCallNotification()`
4. **Supabase** stores notification in `notifications` table
5. **Supabase Realtime** broadcasts to `notifications:${userId}` channel
6. **Client B** receives notification via Realtime subscription
7. **Client B** can accept/reject call

### Message Notification Flow

1. **Client A** sends message to **Client B**
2. **Server** receives `message:send` event
3. **Server** calls `sendMessageNotification()`
4. **Supabase** stores notification in `notifications` table
5. **Supabase Realtime** broadcasts to `notifications:${userId}` channel
6. **Client B** receives notification via Realtime subscription

## API Endpoints

### Send Incoming Call Notification
```bash
POST /notifications/send-call
Content-Type: application/json

{
  "callerId": "user-1",
  "calleeId": "user-2",
  "callId": "call-123",
  "callType": "video"
}
```

### Send Message Notification
```bash
POST /notifications/send-message
Content-Type: application/json

{
  "senderId": "user-1",
  "recipientId": "user-2",
  "messageText": "Hello!",
  "messageId": "msg-123"
}
```

### Send Missed Call Notification
```bash
POST /notifications/send-missed-call
Content-Type: application/json

{
  "callerId": "user-1",
  "calleeId": "user-2",
  "callType": "video"
}
```

### Send Call Ended Notification
```bash
POST /notifications/send-call-ended
Content-Type: application/json

{
  "userId": "user-1",
  "otherUserId": "user-2",
  "duration": 45000,
  "callType": "video"
}
```

## Client-Side Integration

### Subscribe to Notifications

```typescript
import { subscribeToIncomingCalls, subscribeToMessages } from '@/lib/firebase';

useEffect(() => {
  // Subscribe to incoming calls
  const callChannel = subscribeToIncomingCalls(userId, (call) => {
    console.log('Incoming call:', call);
    // Show call UI
  });

  // Subscribe to messages
  const msgChannel = subscribeToMessages(userId, (message) => {
    console.log('New message:', message);
    // Show message notification
  });

  return () => {
    callChannel.unsubscribe();
    msgChannel.unsubscribe();
  };
}, [userId]);
```

### Handle Notifications

```typescript
const handleIncomingCall = (call: any) => {
  // Show incoming call UI
  showCallNotification({
    title: 'Incoming Call',
    body: `${call.data.callerId} is calling...`,
    callId: call.data.callId,
    callType: call.data.callType,
  });
};

const handleNewMessage = (message: any) => {
  // Show message notification
  showMessageNotification({
    title: 'New Message',
    body: message.body,
    senderId: message.data.senderId,
  });
};
```

## Benefits

✅ **No External Dependencies** - Uses Supabase which is already in use
✅ **Real-time** - Instant notifications via Supabase Realtime
✅ **Persistent** - Notifications stored in database
✅ **Scalable** - Supabase handles scaling
✅ **Secure** - RLS policies control access
✅ **Cost-effective** - No additional Firebase costs
✅ **Simpler** - One less service to manage

## Migration Checklist

- [ ] Remove Firebase from `package.json`
- [ ] Run `npm install`
- [ ] Create `notifications` table in Supabase
- [ ] Update `src/lib/firebase.ts` with Supabase Realtime code
- [ ] Update `server/chat-server.ts` imports
- [ ] Test incoming call notifications
- [ ] Test message notifications
- [ ] Test notification persistence
- [ ] Deploy to production

## Troubleshooting

### Notifications not received
1. Check Supabase Realtime is enabled
2. Verify user is subscribed to correct channel
3. Check browser console for errors
4. Verify notifications table has data

### Channel subscription fails
1. Check JWT token is valid
2. Verify user_id matches auth.uid()
3. Check Supabase connection
4. Check RLS policies

### Notifications not persisting
1. Verify notifications table exists
2. Check RLS policies allow inserts
3. Verify user_id is correct
4. Check database logs

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs/guides/realtime
2. Review notification service: `server/notifications.ts`
3. Check client integration: `src/lib/firebase.ts`

---

**Migration complete!** Your app now uses Supabase Realtime for all notifications. 🚀
