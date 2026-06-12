-- Phase 3: Production Polish - Authentication & User Management
-- Run this in Supabase SQL Editor

-- Update users table with production fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS credits_total INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS api_key_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS monthly_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');

-- Create payments table for manual QRIS verification
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL, -- IDR or USD
  tier VARCHAR(50) NOT NULL, -- pro or enterprise
  payment_proof TEXT, -- URL to uploaded image
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ
);

-- Create api_usage table for tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_usage(api_key);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_subscription_tier 
  CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

ALTER TABLE payments ADD CONSTRAINT check_payment_status 
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE payments ADD CONSTRAINT check_currency 
  CHECK (currency IN ('IDR', 'USD'));

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    credits_remaining = CASE 
      WHEN subscription_tier = 'free' THEN 5
      WHEN subscription_tier = 'pro' THEN 50
      WHEN subscription_tier = 'enterprise' THEN 999999
      ELSE 5
    END,
    monthly_reset_date = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
  WHERE monthly_reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(user_email TEXT, amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits_remaining INTO current_credits
  FROM users WHERE email = user_email;
  
  IF current_credits >= amount THEN
    UPDATE users 
    SET credits_remaining = credits_remaining - amount
    WHERE email = user_email;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set trial period for new users
CREATE OR REPLACE FUNCTION set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at = NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_trial_period
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_period();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Phase 3 Production schema complete! Auth, payments, and API tracking ready.';
END $$;
