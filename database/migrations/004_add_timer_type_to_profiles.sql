-- Add timer preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN timer_type VARCHAR(10) DEFAULT 'linear' NOT NULL;

-- Add index for better performance
CREATE INDEX idx_profiles_timer_type ON profiles(timer_type);

-- Add check constraint to ensure only valid values
ALTER TABLE profiles 
ADD CONSTRAINT check_timer_type 
CHECK (timer_type IN ('linear', 'circular'));

-- Update existing users to have 'linear' as default (already set by DEFAULT clause)
-- This is mainly for documentation purposes
UPDATE profiles 
SET timer_type = 'linear' 
WHERE timer_type IS NULL;
