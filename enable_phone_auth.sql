-- Enable Phone Authentication in Supabase
-- Run this in your Supabase SQL Editor

-- This enables phone authentication for your Supabase project
-- Note: You need to configure Twilio or another SMS provider in Supabase settings

-- The phone authentication is configured in Supabase Dashboard:
-- 1. Go to Authentication > Providers > Phone
-- 2. Enable Phone provider
-- 3. Configure SMS provider (Twilio or Vonage)
-- 4. Set up phone verification settings

-- After enabling, users can sign up and login with phone numbers
-- Phone numbers should be in E.164 format: +[country code][number]
-- Example: +1234567890, +250788123456

-- To enable programmatically, use the Supabase Management API or Dashboard
