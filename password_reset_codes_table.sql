-- Create password_reset_codes table for storing temporary reset codes
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);

-- Set up RLS (Row Level Security)
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert reset codes
CREATE POLICY "Allow insert password reset codes" ON password_reset_codes
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to select their own reset codes
CREATE POLICY "Allow select password reset codes" ON password_reset_codes
  FOR SELECT
  USING (true);

-- Allow anyone to update reset codes
CREATE POLICY "Allow update password reset codes" ON password_reset_codes
  FOR UPDATE
  USING (true);

-- Allow anyone to delete reset codes
CREATE POLICY "Allow delete password reset codes" ON password_reset_codes
  FOR DELETE
  USING (true);
