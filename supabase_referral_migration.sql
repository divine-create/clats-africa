-- Enable pgcrypto for gen_random_uuid() if needed
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create clats_partners table
CREATE TABLE IF NOT EXISTS clats_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    partner_code TEXT UNIQUE,
    commission_rate NUMERIC,
    bank_details JSONB,
    total_earnings NUMERIC DEFAULT 0,
    available_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create clats_referrals table
CREATE TABLE IF NOT EXISTS clats_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_email TEXT NOT NULL,
    invitee_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create clats_commissions_ledger table
CREATE TABLE IF NOT EXISTS clats_commissions_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES clats_partners(id),
    parent_email TEXT,
    transaction_amount NUMERIC,
    commission_earned NUMERIC,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update clats_parents to add new columns
-- Note: Assuming clats_parents table already exists.
ALTER TABLE clats_parents
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES clats_partners(id);
