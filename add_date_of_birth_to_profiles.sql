-- Add date_of_birth column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON profiles(date_of_birth);
