-- ============================================================================
-- Vit IELTS — Affiliate Payout System
-- Migration: 008_affiliate_payout_system.sql
-- Description: Adds payout tables, bank info, balance tracking, anti-fraud,
--              and system configuration for affiliate payouts with SePay.
-- ============================================================================

-- ===========================
-- 1. AFFILIATE BANK INFO
-- ===========================
CREATE TABLE public.affiliate_bank_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID UNIQUE NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  account_holder TEXT NOT NULL,       -- e.g. "NGUYEN VAN A"
  account_number TEXT NOT NULL,       -- e.g. "1234567890"
  bank_name TEXT NOT NULL,            -- e.g. "Vietcombank"
  bank_code TEXT,                     -- e.g. "VCB" — for VietQR
  bank_branch TEXT,                   -- Optional
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 2. PAYOUTS
-- ===========================
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  amount INTEGER NOT NULL,                                  -- VND
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'flagged')),
  reject_reason TEXT,
  bank_snapshot JSONB NOT NULL DEFAULT '{}',                -- Snapshot of bank info at request time
  sepay_transaction_id INTEGER,                             -- SePay webhook ID (idempotency)
  sepay_reference_code TEXT,                                -- Bank reference code
  transaction_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 3. SEPAY PAYOUT TRANSACTIONS (idempotency)
-- ===========================
CREATE TABLE public.sepay_payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sepay_id INTEGER UNIQUE NOT NULL,
  payout_id UUID REFERENCES payouts(id),
  amount INTEGER NOT NULL,
  reference_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 4. ALTER AFFILIATES — Add balance and tracking
-- ===========================
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- ===========================
-- 5. ALTER AFFILIATE VISITS — Anti-fraud fields
-- ===========================
ALTER TABLE affiliate_visits ADD COLUMN IF NOT EXISTS is_unique BOOLEAN DEFAULT true;
ALTER TABLE affiliate_visits ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- ===========================
-- 6. ALTER COMMISSIONS — Fraud flag + paid_at + eligible_at (7-day wait)
-- ===========================
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS fraud_flag TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS eligible_at TIMESTAMPTZ;
-- eligible_at = created_at + 7 days (set by application logic)

-- ===========================
-- 7. AFFILIATE SYSTEM CONFIG (site_settings row)
-- ===========================
INSERT INTO site_settings (key, value) VALUES ('affiliate_config', '{
  "commission_rate": 0.2,
  "cookie_duration_days": 30,
  "min_payout_amount": 200000,
  "click_rate_limit_per_ip_hours": 24,
  "click_velocity_threshold": 100,
  "waiting_period_days": 7,
  "payout_transfer_prefix": "PAYOUT"
}'::jsonb) ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_payouts_affiliate ON payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_created ON payouts(created_at);
CREATE INDEX idx_affiliate_bank_info_affiliate ON affiliate_bank_info(affiliate_id);
CREATE INDEX idx_sepay_payout_tx_sepay_id ON sepay_payout_transactions(sepay_id);
CREATE INDEX idx_affiliate_visits_ip_ref ON affiliate_visits(ip, affiliate_id);
CREATE INDEX idx_commissions_eligible ON commissions(eligible_at) WHERE status = 'pending';

-- ============================================================================
-- RPC: Atomically adjust affiliate balance
-- ============================================================================

CREATE OR REPLACE FUNCTION adjust_affiliate_balance(
  p_affiliate_id UUID,
  p_delta INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE affiliates
  SET balance = balance + p_delta
  WHERE id = p_affiliate_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Affiliate % not found', p_affiliate_id;
  END IF;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Create payout with balance hold (atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_payout_request(
  p_affiliate_id UUID,
  p_amount INTEGER,
  p_bank_snapshot JSONB
)
RETURNS UUID AS $$
DECLARE
  v_balance INTEGER;
  v_payout_id UUID;
BEGIN
  -- Lock the affiliate row to prevent concurrent payout requests
  SELECT balance INTO v_balance
  FROM affiliates
  WHERE id = p_affiliate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Affiliate not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: have %, need %', v_balance, p_amount;
  END IF;

  -- Deduct balance (hold)
  UPDATE affiliates
  SET balance = balance - p_amount
  WHERE id = p_affiliate_id;

  -- Create payout record
  INSERT INTO payouts (affiliate_id, amount, status, bank_snapshot)
  VALUES (p_affiliate_id, p_amount, 'pending', p_bank_snapshot)
  RETURNING id INTO v_payout_id;

  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: Reject payout and refund balance (atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_payout_request(
  p_payout_id UUID,
  p_reason TEXT
)
RETURNS void AS $$
DECLARE
  v_payout RECORD;
BEGIN
  -- Lock the payout row
  SELECT id, affiliate_id, amount, status INTO v_payout
  FROM payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  IF v_payout.status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Payout is not in a rejectable state: %', v_payout.status;
  END IF;

  -- Update payout status
  UPDATE payouts
  SET status = 'rejected',
      reject_reason = p_reason
  WHERE id = p_payout_id;

  -- Refund balance
  UPDATE affiliates
  SET balance = balance + v_payout.amount
  WHERE id = v_payout.affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- -----------------------------------------------
-- AFFILIATE BANK INFO
-- -----------------------------------------------
ALTER TABLE affiliate_bank_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own bank info"
  ON affiliate_bank_info FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_bank_info.affiliate_id AND affiliates.user_id = auth.uid())
  );

CREATE POLICY "User update own bank info"
  ON affiliate_bank_info FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_bank_info.affiliate_id AND affiliates.user_id = auth.uid())
  );

CREATE POLICY "Admin full access on bank info"
  ON affiliate_bank_info
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- PAYOUTS
-- -----------------------------------------------
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = payouts.affiliate_id AND affiliates.user_id = auth.uid())
  );

CREATE POLICY "Admin full access on payouts"
  ON payouts
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- SEPAY PAYOUT TRANSACTIONS
-- -----------------------------------------------
ALTER TABLE sepay_payout_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on sepay_payout_transactions"
  ON sepay_payout_transactions
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );
