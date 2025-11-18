# Complete Setup Guide: Getting All Credentials

## 📋 Overview

You need these credentials to run the chat + calling system:
1. **Supabase JWT Secret** - For authentication
2. **Supabase URL & Keys** - For database access
3. **TURN Server** - For WebRTC NAT traversal
4. **Redis URL** - For scaling (optional for dev)

---

## 1️⃣ SUPABASE SETUP

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `waveer` (or your app name)
   - **Database password**: Create a strong password
   - **Region**: Choose closest to you
4. Click **"Create new project"** (takes 2-3 minutes)

### Step 2: Get Supabase Credentials

Once project is created:

1. **Go to Project Settings** (bottom left gear icon)
2. Click **"API"** tab
3. You'll see:

```
Project URL: https://laguwccaczvehldrppll.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these!**

### Step 3: Get JWT Secret

1. In **Project Settings** → **API** tab
2. Scroll down to **"JWT Settings"**
3. You'll see:

```
JWT Secret: your-super-secret-key-here
```

**This is your SUPABASE_JWT_SECRET**

### Step 4: Create Notifications Table

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Paste this SQL:

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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notifications_insert_own ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

4. Click **"Run"**

### Step 5: Run Chat Schema

1. Go to **SQL Editor** → **New Query**
2. Copy entire contents of `server/sql/chat_calling_schema.sql`
3. Paste into SQL Editor
4. Click **"Run"**

✅ **Supabase is ready!**

---

## 2️⃣ ENVIRONMENT VARIABLES

### Create `.env` File

Create `server/.env`:

```env
# ============================================================================
# SUPABASE
# ============================================================================
SUPABASE_URL=https://laguwccaczvehldrppll.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3V3Y2NhY3p2ZWhsZHJwcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTYzNDIsImV4cCI6MjA3NzkzMjM0Mn0.v5Vc8gCvAecMEDXGce8oPfk06P4eABs20pdtof0X0F4
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# ============================================================================
# SERVER
# ============================================================================
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ============================================================================
# REDIS (for scaling)
# ============================================================================
REDIS_URL=redis://localhost:6379

# ============================================================================
# TURN SERVER (for WebRTC)
# ============================================================================
TURN_URL=turn:stun.l.google.com:19302
TURN_USERNAME=user
TURN_PASSWORD=pass
```

---

## 3️⃣ TURN SERVER SETUP

### Option A: Use Free Google STUN (Recommended for Dev)

Google provides free STUN servers (no credentials needed):

```env
TURN_URL=turn:stun.l.google.com:19302
TURN_USERNAME=user
TURN_PASSWORD=pass
```

✅ **Works for development**

### Option B: Setup Coturn (Self-Hosted)

#### On Ubuntu/Debian:

```bash
# Install coturn
sudo apt-get update
sudo apt-get install coturn

# Edit config
sudo nano /etc/coturn/turnserver.conf
```

Add to config:

```
listening-port=3478
listening-ip=0.0.0.0
external-ip=YOUR_SERVER_IP
realm=example.com
server-name=turn.example.com
username=turnuser
password=turnpass
```

Start service:

```bash
sudo systemctl start coturn
sudo systemctl enable coturn
```

Then use in `.env`:

```env
TURN_URL=turn:your-server-ip:3478
TURN_USERNAME=turnuser
TURN_PASSWORD=turnpass
```

### Option C: Use Managed TURN Service

Popular options:
- **Twilio** - https://www.twilio.com/stun-turn
- **Xirsys** - https://xirsys.com
- **Metered** - https://metered.ca

**Example with Xirsys:**

1. Sign up at https://xirsys.com
2. Create account
3. Get credentials from dashboard
4. Add to `.env`:

```env
TURN_URL=turn:your-xirsys-server.com:3478
TURN_USERNAME=your-username
TURN_PASSWORD=your-password
```

✅ **Recommended for production**

---

## 4️⃣ REDIS SETUP

### Option A: Local Redis (Development)

#### On macOS:

```bash
brew install redis
brew services start redis
```

#### On Ubuntu/Debian:

```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

#### On Windows (Docker):

```bash
docker run -d -p 6379:6379 redis:latest
```

Use in `.env`:

```env
REDIS_URL=redis://localhost:6379
```

### Option B: Managed Redis (Production)

Popular options:
- **Redis Cloud** - https://redis.com/cloud
- **AWS ElastiCache** - https://aws.amazon.com/elasticache
- **Upstash** - https://upstash.com

**Example with Redis Cloud:**

1. Sign up at https://redis.com/cloud
2. Create database
3. Copy connection string
4. Add to `.env`:

```env
REDIS_URL=redis://:password@host:port
```

---

## 5️⃣ COMPLETE `.env` EXAMPLE

Here's a complete example with all credentials:

```env
# ============================================================================
# SUPABASE (from Project Settings → API)
# ============================================================================
SUPABASE_URL=https://laguwccaczvehldrppll.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3V3Y2NhY3p2ZWhsZHJwcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTYzNDIsImV4cCI6MjA3NzkzMjM0Mn0.v5Vc8gCvAecMEDXGce8oPfk06P4eABs20pdtof0X0F4
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ3V3Y2NhY3p2ZWhsZHJwcGxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM1NjM0MiwiZXhwIjoyMDc3OTMyMzQyfQ.your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret-from-jwt-settings

# ============================================================================
# SERVER
# ============================================================================
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ============================================================================
# REDIS (local for dev, managed for prod)
# ============================================================================
REDIS_URL=redis://localhost:6379

# ============================================================================
# TURN SERVER (for WebRTC NAT traversal)
# ============================================================================
TURN_URL=turn:stun.l.google.com:19302
TURN_USERNAME=user
TURN_PASSWORD=pass
```

---

## 6️⃣ VERIFY SETUP

### Test Supabase Connection

```bash
cd server
npm install
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://laguwccaczvehldrppll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
supabase.from('messages5').select('count').then(r => console.log('✅ Supabase connected!', r));
"
```

### Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### Test Server Startup

```bash
npm run dev
# Should see: [Server] Chat server listening on port 3001
```

---

## 7️⃣ STEP-BY-STEP CHECKLIST

### Supabase
- [ ] Create Supabase project
- [ ] Get Project URL
- [ ] Get Anon Key
- [ ] Get Service Role Key
- [ ] Get JWT Secret
- [ ] Create notifications table
- [ ] Run chat_calling_schema.sql

### Environment
- [ ] Create `server/.env`
- [ ] Add SUPABASE_URL
- [ ] Add SUPABASE_ANON_KEY
- [ ] Add SUPABASE_SERVICE_KEY
- [ ] Add SUPABASE_JWT_SECRET

### TURN Server
- [ ] Choose TURN option (Google/Coturn/Managed)
- [ ] Add TURN_URL to `.env`
- [ ] Add TURN_USERNAME to `.env`
- [ ] Add TURN_PASSWORD to `.env`

### Redis
- [ ] Install Redis locally OR use managed service
- [ ] Add REDIS_URL to `.env`
- [ ] Test Redis connection

### Verification
- [ ] Test Supabase connection
- [ ] Test Redis connection
- [ ] Start server: `npm run dev`
- [ ] Check server logs for errors

---

## 8️⃣ COMMON ISSUES

### "Cannot connect to Supabase"
- ✅ Check SUPABASE_URL is correct
- ✅ Check SUPABASE_ANON_KEY is correct
- ✅ Check internet connection
- ✅ Check `.env` file exists in `server/` directory

### "Redis connection failed"
- ✅ Check Redis is running: `redis-cli ping`
- ✅ Check REDIS_URL is correct
- ✅ Check Redis port (default 6379)
- ✅ On Windows, use Docker: `docker run -d -p 6379:6379 redis:latest`

### "TURN server not working"
- ✅ Check TURN_URL is correct
- ✅ Check firewall allows port 3478
- ✅ For Google STUN, no auth needed
- ✅ Test with: `stunclient stun.l.google.com 19302`

### "JWT verification failed"
- ✅ Check SUPABASE_JWT_SECRET is correct
- ✅ Check token is not expired
- ✅ Check token format (should be JWT)

---

## 9️⃣ PRODUCTION DEPLOYMENT

For production, use managed services:

```env
# Supabase (same as dev)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Redis Cloud
REDIS_URL=redis://:password@host:port

# Managed TURN (Xirsys, Twilio, etc)
TURN_URL=turn:your-server.com:3478
TURN_USERNAME=your-username
TURN_PASSWORD=your-password

# Server
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-domain.com
```

---

## 🔟 NEXT STEPS

1. ✅ Get all credentials (this guide)
2. ✅ Create `.env` file
3. ✅ Run `npm install`
4. ✅ Start server: `npm run dev`
5. ✅ Test messaging
6. ✅ Test calling
7. ✅ Deploy to production

---

**You're all set!** 🚀 Start the server and begin testing.
