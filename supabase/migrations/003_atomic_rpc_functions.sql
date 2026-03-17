-- ============================================================================
-- Migration: 003_atomic_rpc_functions.sql
-- Description: Atomic RPC functions to prevent race conditions
--   - increment_coupon_uses: Atomic coupon redemption (prevents over-redemption)
--   - increment_post_views: Atomic view counter
--   - append_post_vote: Atomic vote append with duplicate check
-- ============================================================================

-- ============================================================================
-- 1. ATOMIC COUPON INCREMENT
-- Atomically increment current_uses only if the coupon is valid and has uses left.
-- Returns the updated coupon row, or NULL if not valid / exhausted.
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_coupon_uses(p_coupon_id UUID)
RETURNS TABLE(
  id UUID,
  code TEXT,
  current_uses INTEGER,
  max_uses INTEGER,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE coupons
  SET current_uses = coupons.current_uses + 1
  WHERE coupons.id = p_coupon_id
    AND coupons.is_active = true
    AND (coupons.max_uses IS NULL OR coupons.current_uses < coupons.max_uses)
  RETURNING
    coupons.id,
    coupons.code,
    coupons.current_uses,
    coupons.max_uses,
    coupons.is_active;
END;
$$;


-- ============================================================================
-- 2. ATOMIC POST VIEW INCREMENT
-- Atomically increment the views counter on posts table.
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = p_post_id;
END;
$$;


-- ============================================================================
-- 3. ATOMIC POST VOTE APPEND
-- Atomically append a vote to the JSONB votes array.
-- Checks for duplicate user_id. Returns the new average rating + count.
-- Returns NULL if user already voted or post not found.
-- ============================================================================
CREATE OR REPLACE FUNCTION append_post_vote(
  p_post_id UUID,
  p_user_id UUID,
  p_rate INTEGER
)
RETURNS TABLE(avg_rate NUMERIC, vote_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_votes JSONB;
  v_new_vote JSONB;
  v_updated_votes JSONB;
  v_total NUMERIC;
  v_count INTEGER;
BEGIN
  -- Validate rate
  IF p_rate < 1 OR p_rate > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Get current votes with row lock
  SELECT posts.votes INTO v_votes
  FROM posts
  WHERE posts.id = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  -- Check if user already voted
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(v_votes, '[]'::jsonb)) elem
    WHERE elem->>'user_id' = p_user_id::text
  ) THEN
    RAISE EXCEPTION 'User has already rated this post';
  END IF;

  -- Build new vote entry
  v_new_vote := jsonb_build_object('user_id', p_user_id::text, 'rate', p_rate);
  v_updated_votes := COALESCE(v_votes, '[]'::jsonb) || jsonb_build_array(v_new_vote);

  -- Update
  UPDATE posts SET votes = v_updated_votes WHERE id = p_post_id;

  -- Calculate average
  SELECT
    ROUND(AVG((elem->>'rate')::numeric), 1),
    COUNT(*)::integer
  INTO v_total, v_count
  FROM jsonb_array_elements(v_updated_votes) elem;

  RETURN QUERY SELECT v_total, v_count;
END;
$$;


-- ============================================================================
-- 4. FILTER MOCK TESTS BY QUIZ IDS
-- Finds mock_tests whose practice_tests JSONB contains any of the given quiz IDs
-- in either reading_test_id or listening_test_id fields.
-- Replaces client-side full-table scan + JS filter (N+1 pattern).
-- ============================================================================
CREATE OR REPLACE FUNCTION get_mock_tests_by_quiz_ids(p_quiz_ids UUID[])
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  practice_tests JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT mt.id, mt.title, mt.slug, mt.practice_tests, mt.created_at
  FROM mock_tests mt
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(mt.practice_tests) elem
    WHERE (elem->>'reading_test_id')::uuid = ANY(p_quiz_ids)
       OR (elem->>'listening_test_id')::uuid = ANY(p_quiz_ids)
  );
END;
$$;
