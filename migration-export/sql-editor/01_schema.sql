-- STEP 1: Schema
-- Run ONCE on fresh Supabase project

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;  -- PG17 only
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: classroom_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."classroom_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "display_name" "text",
    CONSTRAINT "classroom_members_role_check" CHECK (("role" = ANY (ARRAY['teacher'::"text", 'student'::"text"]))),
    CONSTRAINT "classroom_members_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text"])))
);


--
-- Name: add_classroom_member_by_email("uuid", "text", "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."add_classroom_member_by_email"("p_classroom_id" "uuid", "p_email" "text", "p_role" "text") RETURNS "public"."classroom_members"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_member  classroom_members;
  v_user_id UUID;
BEGIN
  IF NOT is_classroom_teacher(p_classroom_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_TEACHER';
  END IF;
  IF p_role NOT IN ('teacher', 'student') THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE lower(email) = lower(trim(p_email));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  INSERT INTO classroom_members (classroom_id, user_id, role)
  VALUES (p_classroom_id, v_user_id, p_role)
  ON CONFLICT (classroom_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;


--
-- Name: adjust_affiliate_balance("uuid", integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."adjust_affiliate_balance"("p_affiliate_id" "uuid", "p_delta" integer) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: append_post_vote("uuid", "uuid", integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."append_post_vote"("p_post_id" "uuid", "p_user_id" "uuid", "p_rate" integer) RETURNS TABLE("avg_rate" numeric, "vote_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


--
-- Name: check_rate_limit("text", integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."check_rate_limit"("p_key" "text", "p_max" integer, "p_window_ms" integer) RETURNS TABLE("allowed" boolean, "current_count" integer, "retry_after_sec" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window INTERVAL := (p_window_ms || ' milliseconds')::INTERVAL;
  v_reset_at TIMESTAMPTZ := v_now + v_window;
  v_entry RECORD;
BEGIN
  -- Try to get existing entry with row lock
  SELECT rl.count, rl.reset_at INTO v_entry
  FROM rate_limits rl
  WHERE rl.key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- New entry: insert and allow
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at);
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;

  IF v_now > v_entry.reset_at THEN
    -- Window expired: reset
    UPDATE rate_limits SET count = 1, reset_at = v_reset_at WHERE rate_limits.key = p_key;
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;

  -- Increment
  UPDATE rate_limits SET count = rate_limits.count + 1 WHERE rate_limits.key = p_key;

  IF v_entry.count + 1 > p_max THEN
    -- Rate limited
    RETURN QUERY SELECT false, v_entry.count + 1,
      GREATEST(0, EXTRACT(EPOCH FROM v_entry.reset_at - v_now)::INTEGER);
    RETURN;
  END IF;

  -- Allowed
  RETURN QUERY SELECT true, v_entry.count + 1, 0;
END;
$$;


--
-- Name: cleanup_expired_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."cleanup_expired_rate_limits"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE reset_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;


--
-- Name: cleanup_old_test_results(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."cleanup_old_test_results"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM test_results
    WHERE
      (status = 'published' AND submitted_at < now() - INTERVAL '6 months')
      OR
      (status = 'draft' AND created_at < now() - INTERVAL '30 days')
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;


--
-- Name: create_payout_request("uuid", integer, "jsonb"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."create_payout_request"("p_affiliate_id" "uuid", "p_amount" integer, "p_bank_snapshot" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: decrement_coupon_uses("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."decrement_coupon_uses"("p_coupon_id" "uuid") RETURNS TABLE("id" "uuid", "code" "text", "current_uses" integer, "max_uses" integer, "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  UPDATE coupons
  SET current_uses = GREATEST(0, coupons.current_uses - 1)
  WHERE coupons.id = p_coupon_id
    AND coupons.current_uses > 0
  RETURNING
    coupons.id,
    coupons.code,
    coupons.current_uses,
    coupons.max_uses,
    coupons.is_active;
END;
$$;


--
-- Name: enforce_classroom_owner_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."enforce_classroom_owner_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (SELECT count(*) FROM classrooms WHERE owner_id = NEW.owner_id) >= 10 THEN
    RAISE EXCEPTION 'CLASS_LIMIT_REACHED';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: enforce_classroom_student_limit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."enforce_classroom_student_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.status = 'active' THEN
    IF (
      SELECT count(*) FROM classroom_members
      WHERE classroom_id = NEW.classroom_id
        AND role = 'student' AND status = 'active'
        AND user_id <> NEW.user_id
    ) >= 50 THEN
      RAISE EXCEPTION 'STUDENT_LIMIT_REACHED';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: expire_stale_orders(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."expire_stale_orders"("p_ttl_minutes" integer DEFAULT 60) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_expired_count INTEGER;
  v_coupon_record RECORD;
BEGIN
  -- Step 1: Rollback coupon usage for stale orders that have a coupon_id
  FOR v_coupon_record IN
    SELECT o.coupon_id
    FROM orders o
    WHERE o.status = 'pending'
      AND o.created_at < now() - (p_ttl_minutes || ' minutes')::INTERVAL
      AND o.coupon_id IS NOT NULL
  LOOP
    PERFORM decrement_coupon_uses(v_coupon_record.coupon_id);
  END LOOP;
  -- Step 2: Bulk update all stale pending orders to 'expired'
  WITH expired AS (
    UPDATE orders
    SET status = 'expired'
    WHERE status = 'pending'
      AND created_at < now() - (p_ttl_minutes || ' minutes')::INTERVAL
    RETURNING id
  )
  SELECT count(*) INTO v_expired_count FROM expired;
  RETURN v_expired_count;
END;
$$;


--
-- Name: generate_classroom_invite_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."generate_classroom_invite_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code  TEXT;
  i     INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * 36)::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM classrooms WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$;


--
-- Name: get_mock_tests_by_quiz_ids("uuid"[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_mock_tests_by_quiz_ids"("p_quiz_ids" "uuid"[]) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "practice_tests" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
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


--
-- Name: get_monthly_activities("uuid", integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_monthly_activities"("p_user_id" "uuid", "p_year" integer, "p_month" integer) RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

  RETURN (
    SELECT COALESCE(json_agg(row_data), '[]'::json)
    FROM (
      SELECT
        tr.submitted_at::date::text AS date,
        COUNT(*) FILTER (WHERE q.skill = 'reading') AS reading,
        COUNT(*) FILTER (WHERE q.skill = 'listening') AS listening,
        COUNT(*) AS total
      FROM test_results tr
      JOIN quizzes q ON q.id = tr.quiz_id
      WHERE tr.user_id = p_user_id
        AND tr.status = 'published'
        AND tr.submitted_at IS NOT NULL
        AND tr.submitted_at::date >= v_start_date
        AND tr.submitted_at::date <= v_end_date
      GROUP BY tr.submitted_at::date
      ORDER BY tr.submitted_at::date ASC
    ) AS row_data
  );
END;
$$;


--
-- Name: get_quiz_filter_options(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_quiz_filter_options"() RETURNS TABLE("years" "text"[], "sources" "text"[], "parts" "text"[], "quarters" "text"[])
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ARRAY(SELECT DISTINCT q.year FROM quizzes q WHERE q.status = 'published' AND q.year IS NOT NULL ORDER BY q.year),
    ARRAY(SELECT DISTINCT q.source FROM quizzes q WHERE q.status = 'published' AND q.source IS NOT NULL ORDER BY q.source),
    ARRAY(SELECT DISTINCT q.part FROM quizzes q WHERE q.status = 'published' AND q.part IS NOT NULL ORDER BY q.part),
    ARRAY(SELECT DISTINCT q.quarter FROM quizzes q WHERE q.status = 'published' AND q.quarter IS NOT NULL ORDER BY q.quarter);
END;
$$;


--
-- Name: get_score_percentile("uuid", numeric, "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_score_percentile"("p_quiz_id" "uuid", "p_score" numeric, "p_exclude_result" "uuid") RETURNS TABLE("percentile" integer, "sample_size" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH others AS (
    SELECT score
    FROM test_results
    WHERE quiz_id = p_quiz_id
      AND status = 'published'
      AND score IS NOT NULL
      AND id <> p_exclude_result
  )
  SELECT
    CASE WHEN COUNT(*) = 0 THEN NULL
         ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE p_score > score) / COUNT(*))::int
    END AS percentile,
    COUNT(*)::int AS sample_size
  FROM others;
$$;


--
-- Name: get_study_streak_summary("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."get_study_streak_summary"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_total_days INTEGER := 0;
  v_month_days INTEGER := 0;
  v_streak INTEGER := 0;
  v_prev_date DATE;
  v_rec RECORD;
BEGIN
  -- Total unique active days
  SELECT COUNT(DISTINCT submitted_at::date) INTO v_total_days
  FROM test_results
  WHERE user_id = p_user_id
    AND status = 'published'
    AND submitted_at IS NOT NULL;

  -- Active days this month
  SELECT COUNT(DISTINCT submitted_at::date) INTO v_month_days
  FROM test_results
  WHERE user_id = p_user_id
    AND status = 'published'
    AND submitted_at IS NOT NULL
    AND submitted_at::date >= date_trunc('month', CURRENT_DATE)::date
    AND submitted_at::date <= CURRENT_DATE;

  -- Calculate streaks by iterating distinct dates in order
  v_prev_date := NULL;
  v_streak := 0;

  FOR v_rec IN
    SELECT DISTINCT submitted_at::date AS activity_date
    FROM test_results
    WHERE user_id = p_user_id
      AND status = 'published'
      AND submitted_at IS NOT NULL
    ORDER BY activity_date ASC
  LOOP
    IF v_prev_date IS NULL OR v_rec.activity_date = v_prev_date + 1 THEN
      v_streak := v_streak + 1;
    ELSE
      v_streak := 1;
    END IF;

    IF v_streak > v_longest_streak THEN
      v_longest_streak := v_streak;
    END IF;

    v_prev_date := v_rec.activity_date;
  END LOOP;

  -- Current streak: active if last activity was today or yesterday
  IF v_prev_date IS NOT NULL AND (v_prev_date = CURRENT_DATE OR v_prev_date = CURRENT_DATE - 1) THEN
    v_current_streak := v_streak;
  ELSE
    v_current_streak := 0;
  END IF;

  RETURN json_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'total_days', v_total_days,
    'month_days', v_month_days
  );
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture',
      NULL
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: increment_coupon_uses("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."increment_coupon_uses"("p_coupon_id" "uuid") RETURNS TABLE("id" "uuid", "code" "text", "current_uses" integer, "max_uses" integer, "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


--
-- Name: increment_post_views("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."increment_post_views"("p_post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = p_post_id;
END;
$$;


--
-- Name: increment_tests_taken("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."increment_tests_taken"("p_quiz_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE quizzes SET tests_taken = tests_taken + 1 WHERE id = p_quiz_id;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND roles ? 'administrator'
  );
$$;


--
-- Name: is_classroom_member("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."is_classroom_member"("p_classroom_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_id = p_classroom_id AND user_id = p_user_id AND status = 'active'
  );
$$;


--
-- Name: is_classroom_teacher("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."is_classroom_teacher"("p_classroom_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_id = p_classroom_id AND user_id = p_user_id
      AND role = 'teacher' AND status = 'active'
  );
$$;


--
-- Name: is_quiz_assigned_to_member("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."is_quiz_assigned_to_member"("p_quiz_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_assignments a
    JOIN classroom_members m ON m.classroom_id = a.classroom_id
    WHERE a.quiz_id = p_quiz_id AND m.user_id = p_user_id AND m.status = 'active'
  );
$$;


--
-- Name: join_classroom_by_code("text", "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."join_classroom_by_code"("p_code" "text", "p_role" "text" DEFAULT 'student'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_class    classrooms;
  v_uid      UUID := auth.uid();
  v_role     TEXT;
  v_status   TEXT;
  v_existing classroom_members;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_class
  FROM classrooms
  WHERE invite_code = upper(trim(p_code)) AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLASS_NOT_FOUND';
  END IF;

  v_role := lower(coalesce(p_role, 'student'));
  IF v_role NOT IN ('teacher', 'student') THEN
    v_role := 'student';
  END IF;

  -- All self-joins await the owner's approval (this is the real gate).
  v_status := 'pending';

  SELECT * INTO v_existing
  FROM classroom_members
  WHERE classroom_id = v_class.id AND user_id = v_uid;

  IF FOUND THEN
    -- Keep an existing membership untouched (don't reset an approved member).
    v_role   := v_existing.role;
    v_status := v_existing.status;
  ELSE
    INSERT INTO classroom_members (classroom_id, user_id, role, status)
    VALUES (v_class.id, v_uid, v_role, v_status);
  END IF;

  RETURN jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'status', v_status,
    'role', v_role
  );
END;
$$;


--
-- Name: reject_payout_request("uuid", "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."reject_payout_request"("p_payout_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


--
-- Name: set_classroom_invite_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."set_classroom_invite_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_classroom_invite_code();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: shares_classroom("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."shares_classroom"("p_user_a" "uuid", "p_user_b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_members x
    JOIN classroom_members y ON y.classroom_id = x.classroom_id
    WHERE x.user_id = p_user_a
      AND y.user_id = p_user_b AND y.status = 'active'
  );
$$;


--
-- Name: shares_classroom_as_teacher("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."shares_classroom_as_teacher"("p_student" "uuid", "p_teacher" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_members t
    JOIN classroom_members s ON s.classroom_id = t.classroom_id
    WHERE t.user_id = p_teacher AND t.role = 'teacher' AND t.status = 'active'
      AND s.user_id = p_student AND s.role = 'student' AND s.status = 'active'
  );
$$;


--
-- Name: update_quiz_passages("uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."update_quiz_passages"("p_quiz_id" "uuid", "p_passages" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_passage_record RECORD;
  v_question JSONB;
  v_passage_id UUID;
  v_passage_ids UUID[] := '{}';
  v_passage JSONB;
  v_sort_index INT := 0;
  v_q_sort_index INT;
BEGIN
  IF p_passages IS NULL OR jsonb_array_length(p_passages) = 0 THEN
    RAISE EXCEPTION 'Cannot update quiz with empty passages array';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM quizzes WHERE id = p_quiz_id) THEN
    RAISE EXCEPTION 'Quiz not found: %', p_quiz_id;
  END IF;
  DELETE FROM passages WHERE quiz_id = p_quiz_id;
  FOR v_passage IN SELECT * FROM jsonb_array_elements(p_passages)
  LOOP
    INSERT INTO passages (
      quiz_id, 
      title, 
      content, 
      sort_order, 
      audio_start, 
      audio_end,
      start_question_number
    )
    VALUES (
      p_quiz_id,
      v_passage->>'title',
      v_passage->>'content',
      COALESCE((v_passage->>'sort_order')::int, v_sort_index),
      (v_passage->>'audio_start')::numeric,
      (v_passage->>'audio_end')::numeric,
      (v_passage->>'start_question_number')::int
    )
    RETURNING id INTO v_passage_id;
    v_passage_ids := v_passage_ids || v_passage_id;
    v_q_sort_index := 0;
    IF v_passage->'questions' IS NOT NULL AND jsonb_typeof(v_passage->'questions') = 'array' THEN
      FOR v_question IN SELECT * FROM jsonb_array_elements(v_passage->'questions')
      LOOP
        INSERT INTO questions (
          passage_id, type, title, question_text, instructions,
          question_form, list_of_questions, list_of_options,
          matching_question, matrix_question, explanations, sort_order
        )
        VALUES (
          v_passage_id,
          v_question->>'type',
          v_question->>'title',
          v_question->>'question_text',
          v_question->>'instructions',
          v_question->>'question_form',
          CASE WHEN v_question->'list_of_questions' IS NOT NULL
               THEN v_question->'list_of_questions' ELSE NULL END,
          CASE WHEN v_question->'list_of_options' IS NOT NULL
               THEN v_question->'list_of_options' ELSE NULL END,
          CASE WHEN v_question->'matching_question' IS NOT NULL
               THEN v_question->'matching_question' ELSE NULL END,
          CASE WHEN v_question->'matrix_question' IS NOT NULL
               THEN v_question->'matrix_question' ELSE NULL END,
          CASE WHEN v_question->'explanations' IS NOT NULL
               THEN v_question->'explanations' ELSE NULL END,
          COALESCE((v_question->>'sort_order')::int, v_q_sort_index)
        );
        v_q_sort_index := v_q_sort_index + 1;
      END LOOP;
    END IF;
    v_sort_index := v_sort_index + 1;
  END LOOP;
  RETURN to_jsonb(v_passage_ids);
END;
$$;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "user_name" "text",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "entity_title" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."admin_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "type" "text" DEFAULT 'info'::"text",
    "entity_type" "text",
    "entity_id" "text",
    "link" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_notifications_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'success'::"text", 'error'::"text"])))
);


--
-- Name: affiliate_bank_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."affiliate_bank_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid" NOT NULL,
    "account_holder" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "bank_name" "text" NOT NULL,
    "bank_code" "text",
    "bank_branch" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: affiliate_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."affiliate_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid",
    "custom_link" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: affiliate_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."affiliate_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid",
    "link_id" "uuid",
    "ip" "text",
    "user_agent" "text",
    "converted" boolean DEFAULT false,
    "order_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_unique" boolean DEFAULT true,
    "is_bot" boolean DEFAULT false
);


--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."affiliates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "custom_link" "text",
    "status" "text" DEFAULT 'active'::"text",
    "commission_rate" double precision DEFAULT 0.1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "balance" integer DEFAULT 0,
    "total_earned" integer DEFAULT 0,
    "last_login_ip" "text"
);


--
-- Name: classroom_assignment_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."classroom_assignment_targets" (
    "assignment_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL
);


--
-- Name: classroom_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."classroom_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classroom_id" "uuid" NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "due_at" timestamp with time zone,
    "note" "text",
    "assigned_to_all" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."classrooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "invite_code" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    CONSTRAINT "classrooms_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'closed'::"text"])))
);


--
-- Name: club_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."club_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "tagline" "text",
    "level" "text" DEFAULT 'All levels'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: cms_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."cms_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_name" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid",
    "order_id" "text",
    "amount" integer,
    "commission_rate" double precision,
    "commission_amount" integer,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fraud_flag" "text",
    "paid_at" timestamp with time zone,
    "eligible_at" timestamp with time zone
);


--
-- Name: community_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "club_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "type" "text",
    "value" integer NOT NULL,
    "max_uses" integer,
    "current_uses" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coupons_type_check" CHECK (("type" = ANY (ARRAY['percent'::"text", 'fixed'::"text"])))
);


--
-- Name: media_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."media_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "mimetype" "text" DEFAULT 'image/jpeg'::"text",
    "size" integer DEFAULT 0,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."menus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location" "text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: mock_test_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."mock_test_collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text",
    "mock_test_ids" "uuid"[] NOT NULL,
    "featured_image" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: mock_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."mock_tests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text",
    "practice_tests" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "text" NOT NULL,
    "user_id" "uuid",
    "package_type" "text",
    "duration" integer NOT NULL,
    "skill_type" "text",
    "amount" integer NOT NULL,
    "original_amount" integer,
    "discount_amount" integer DEFAULT 0,
    "coupon_id" "uuid",
    "coupon_code" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "payment_method" "text",
    "transfer_content" "text",
    "affiliate_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "orders_package_type_check" CHECK (("package_type" = ANY (ARRAY['combo'::"text", 'single'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


--
-- Name: passages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."passages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text",
    "sort_order" integer DEFAULT 0,
    "audio_start" integer,
    "audio_end" integer,
    "start_question_number" integer
);


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "affiliate_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "reject_reason" "text",
    "bank_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sepay_transaction_id" integer,
    "sepay_reference_code" "text",
    "transaction_date" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payouts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'completed'::"text", 'rejected'::"text", 'flagged'::"text"])))
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text",
    "excerpt" "text",
    "featured_image" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "pro_user_only" boolean DEFAULT false,
    "views" integer DEFAULT 0,
    "votes" "jsonb" DEFAULT '[]'::"jsonb",
    "seo" "jsonb" DEFAULT '{}'::"jsonb",
    "categories" "jsonb" DEFAULT '[]'::"jsonb",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "skill" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "passage_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text",
    "question_text" "text",
    "instructions" "text",
    "question_form" "text",
    "list_of_questions" "jsonb",
    "list_of_options" "jsonb",
    "matching_question" "jsonb",
    "matrix_question" "jsonb",
    "explanations" "jsonb",
    "sort_order" integer DEFAULT 0,
    CONSTRAINT "questions_type_check" CHECK (("type" = ANY (ARRAY['radio'::"text", 'select'::"text", 'fillup'::"text", 'checkbox'::"text", 'matching'::"text", 'matrix'::"text"])))
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "type" "text" NOT NULL,
    "skill" "text" NOT NULL,
    "time_minutes" integer DEFAULT 60 NOT NULL,
    "pro_user_only" boolean DEFAULT false,
    "score_type" "text",
    "featured_image" "text",
    "audio_url" "text",
    "pdf_url" "text",
    "tests_taken" integer DEFAULT 0,
    "source" "text",
    "year" "text",
    "quarter" "text",
    "part" "text",
    "question_form" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "votes" "jsonb" DEFAULT '[]'::"jsonb",
    "views" integer DEFAULT 0,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "quizzes_skill_check" CHECK (("skill" = ANY (ARRAY['reading'::"text", 'listening'::"text", 'writing'::"text", 'speaking'::"text"]))),
    CONSTRAINT "quizzes_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"]))),
    CONSTRAINT "quizzes_type_check" CHECK (("type" = ANY (ARRAY['practice'::"text", 'academic'::"text", 'general'::"text", 'mock'::"text"])))
);


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."rate_limits" (
    "key" "text" NOT NULL,
    "count" integer DEFAULT 1 NOT NULL,
    "reset_at" timestamp with time zone NOT NULL
);


--
-- Name: redirects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."redirects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_path" "text" NOT NULL,
    "target_path" "text" NOT NULL,
    "status_code" integer DEFAULT 301,
    "is_active" boolean DEFAULT true,
    "hits" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "redirects_status_code_check" CHECK (("status_code" = ANY (ARRAY[301, 302, 307, 308])))
);


--
-- Name: sample_essays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."sample_essays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text",
    "excerpt" "text",
    "skill" "text",
    "part" "text",
    "question_type" "text",
    "quarter" "text",
    "year" "text",
    "source" "text",
    "topic" "text",
    "task" "text",
    "passage" "text",
    "featured_image" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "pro_user_only" boolean DEFAULT false,
    "views" integer DEFAULT 0,
    "votes" "jsonb" DEFAULT '[]'::"jsonb",
    "seo" "jsonb" DEFAULT '{}'::"jsonb",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: sepay_payout_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."sepay_payout_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sepay_id" integer NOT NULL,
    "payout_id" "uuid",
    "amount" integer NOT NULL,
    "reference_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."site_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: study_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."study_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "due_date" "date" NOT NULL,
    "title" "text" NOT NULL,
    "skill" "text",
    "done" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."test_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "answers" "jsonb",
    "test_part" "jsonb",
    "time_left" "text",
    "test_time" integer,
    "test_mode" "text",
    "score" double precision,
    "status" "text" DEFAULT 'draft'::"text",
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "test_results_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


--
-- Name: user_vocab; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."user_vocab" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "word_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'learning'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "interval_days" integer DEFAULT 0 NOT NULL,
    "ease" numeric DEFAULT 2.5 NOT NULL,
    "next_review_at" timestamp with time zone,
    CONSTRAINT "user_vocab_status_check" CHECK (("status" = ANY (ARRAY['learning'::"text", 'learned'::"text"])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "is_pro" boolean DEFAULT false,
    "pro_expiration_date" "date",
    "target_score" "jsonb" DEFAULT '{}'::"jsonb",
    "gender" "text",
    "date_of_birth" "date",
    "phone_number" "text",
    "roles" "jsonb" DEFAULT '["subscriber"]'::"jsonb",
    "devices" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pro_skills" "text"[],
    "country" "text",
    "native_language" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


--
-- Name: COLUMN "users"."pro_skills"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."users"."pro_skills" IS 'Skills the user has Pro access to. NULL = all skills (combo). Array = specific skills only.';


--
-- Name: vocab_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vocab_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "word_id" "uuid",
    "action" "text" NOT NULL,
    "remembered" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vocab_activity_action_check" CHECK (("action" = ANY (ARRAY['add'::"text", 'review'::"text"])))
);


--
-- Name: vocab_words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vocab_words" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "word" "text" NOT NULL,
    "meaning" "text" NOT NULL,
    "example" "text",
    "topic" "text",
    "skill" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "owner_id" "uuid",
    "ipa" "text",
    "audio_url" "text"
);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."admin_notifications"
    ADD CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id");


--
-- Name: affiliate_bank_info affiliate_bank_info_affiliate_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_bank_info"
    ADD CONSTRAINT "affiliate_bank_info_affiliate_id_key" UNIQUE ("affiliate_id");


--
-- Name: affiliate_bank_info affiliate_bank_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_bank_info"
    ADD CONSTRAINT "affiliate_bank_info_pkey" PRIMARY KEY ("id");


--
-- Name: affiliate_links affiliate_links_custom_link_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_custom_link_key" UNIQUE ("custom_link");


--
-- Name: affiliate_links affiliate_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id");


--
-- Name: affiliate_visits affiliate_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_visits"
    ADD CONSTRAINT "affiliate_visits_pkey" PRIMARY KEY ("id");


--
-- Name: affiliates affiliates_custom_link_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_custom_link_key" UNIQUE ("custom_link");


--
-- Name: affiliates affiliates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id");


--
-- Name: affiliates affiliates_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_user_id_key" UNIQUE ("user_id");


--
-- Name: classroom_assignment_targets classroom_assignment_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignment_targets"
    ADD CONSTRAINT "classroom_assignment_targets_pkey" PRIMARY KEY ("assignment_id", "student_id");


--
-- Name: classroom_assignments classroom_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignments"
    ADD CONSTRAINT "classroom_assignments_pkey" PRIMARY KEY ("id");


--
-- Name: classroom_members classroom_members_classroom_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_members"
    ADD CONSTRAINT "classroom_members_classroom_id_user_id_key" UNIQUE ("classroom_id", "user_id");


--
-- Name: classroom_members classroom_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_members"
    ADD CONSTRAINT "classroom_members_pkey" PRIMARY KEY ("id");


--
-- Name: classrooms classrooms_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classrooms"
    ADD CONSTRAINT "classrooms_invite_code_key" UNIQUE ("invite_code");


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classrooms"
    ADD CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id");


--
-- Name: club_members club_members_club_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_club_id_user_id_key" UNIQUE ("club_id", "user_id");


--
-- Name: club_members club_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_pkey" PRIMARY KEY ("id");


--
-- Name: clubs clubs_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_name_key" UNIQUE ("name");


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");


--
-- Name: cms_configs cms_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."cms_configs"
    ADD CONSTRAINT "cms_configs_pkey" PRIMARY KEY ("id");


--
-- Name: cms_configs cms_configs_section_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."cms_configs"
    ADD CONSTRAINT "cms_configs_section_name_key" UNIQUE ("section_name");


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");


--
-- Name: community_posts community_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");


--
-- Name: media_library media_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."media_library"
    ADD CONSTRAINT "media_library_pkey" PRIMARY KEY ("id");


--
-- Name: menus menus_location_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_location_key" UNIQUE ("location");


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."menus"
    ADD CONSTRAINT "menus_pkey" PRIMARY KEY ("id");


--
-- Name: mock_test_collections mock_test_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."mock_test_collections"
    ADD CONSTRAINT "mock_test_collections_pkey" PRIMARY KEY ("id");


--
-- Name: mock_test_collections mock_test_collections_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."mock_test_collections"
    ADD CONSTRAINT "mock_test_collections_slug_key" UNIQUE ("slug");


--
-- Name: mock_tests mock_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."mock_tests"
    ADD CONSTRAINT "mock_tests_pkey" PRIMARY KEY ("id");


--
-- Name: mock_tests mock_tests_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."mock_tests"
    ADD CONSTRAINT "mock_tests_slug_key" UNIQUE ("slug");


--
-- Name: orders orders_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_id_key" UNIQUE ("order_id");


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");


--
-- Name: passages passages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."passages"
    ADD CONSTRAINT "passages_pkey" PRIMARY KEY ("id");


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");


--
-- Name: posts posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");


--
-- Name: quizzes quizzes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_slug_key" UNIQUE ("slug");


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key");


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."redirects"
    ADD CONSTRAINT "redirects_pkey" PRIMARY KEY ("id");


--
-- Name: redirects redirects_source_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."redirects"
    ADD CONSTRAINT "redirects_source_path_key" UNIQUE ("source_path");


--
-- Name: sample_essays sample_essays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sample_essays"
    ADD CONSTRAINT "sample_essays_pkey" PRIMARY KEY ("id");


--
-- Name: sample_essays sample_essays_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sample_essays"
    ADD CONSTRAINT "sample_essays_slug_key" UNIQUE ("slug");


--
-- Name: sepay_payout_transactions sepay_payout_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sepay_payout_transactions"
    ADD CONSTRAINT "sepay_payout_transactions_pkey" PRIMARY KEY ("id");


--
-- Name: sepay_payout_transactions sepay_payout_transactions_sepay_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sepay_payout_transactions"
    ADD CONSTRAINT "sepay_payout_transactions_sepay_id_key" UNIQUE ("sepay_id");


--
-- Name: site_settings site_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_key_key" UNIQUE ("key");


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");


--
-- Name: study_tasks study_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."study_tasks"
    ADD CONSTRAINT "study_tasks_pkey" PRIMARY KEY ("id");


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_pkey" PRIMARY KEY ("id");


--
-- Name: user_vocab user_vocab_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_vocab"
    ADD CONSTRAINT "user_vocab_pkey" PRIMARY KEY ("id");


--
-- Name: user_vocab user_vocab_user_id_word_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_vocab"
    ADD CONSTRAINT "user_vocab_user_id_word_id_key" UNIQUE ("user_id", "word_id");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: vocab_activity vocab_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vocab_activity"
    ADD CONSTRAINT "vocab_activity_pkey" PRIMARY KEY ("id");


--
-- Name: vocab_words vocab_words_owner_word_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vocab_words"
    ADD CONSTRAINT "vocab_words_owner_word_key" UNIQUE ("owner_id", "word");


--
-- Name: vocab_words vocab_words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vocab_words"
    ADD CONSTRAINT "vocab_words_pkey" PRIMARY KEY ("id");


--
-- Name: idx_activity_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_activity_logs_action" ON "public"."activity_logs" USING "btree" ("action");


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);


--
-- Name: idx_activity_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_activity_logs_entity_type" ON "public"."activity_logs" USING "btree" ("entity_type");


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");


--
-- Name: idx_admin_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_admin_notifications_created_at" ON "public"."admin_notifications" USING "btree" ("created_at" DESC);


--
-- Name: idx_admin_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_admin_notifications_is_read" ON "public"."admin_notifications" USING "btree" ("is_read");


--
-- Name: idx_affiliate_bank_info_affiliate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_affiliate_bank_info_affiliate" ON "public"."affiliate_bank_info" USING "btree" ("affiliate_id");


--
-- Name: idx_affiliate_visits_ip_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_affiliate_visits_ip_ref" ON "public"."affiliate_visits" USING "btree" ("ip", "affiliate_id");


--
-- Name: idx_classroom_assignment_targets_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_classroom_assignment_targets_student" ON "public"."classroom_assignment_targets" USING "btree" ("student_id");


--
-- Name: idx_classroom_assignments_classroom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_classroom_assignments_classroom" ON "public"."classroom_assignments" USING "btree" ("classroom_id");


--
-- Name: idx_classroom_assignments_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_classroom_assignments_quiz" ON "public"."classroom_assignments" USING "btree" ("quiz_id");


--
-- Name: idx_classroom_members_classroom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_classroom_members_classroom" ON "public"."classroom_members" USING "btree" ("classroom_id");


--
-- Name: idx_classroom_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_classroom_members_user" ON "public"."classroom_members" USING "btree" ("user_id");


--
-- Name: idx_classrooms_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_classrooms_owner" ON "public"."classrooms" USING "btree" ("owner_id");


--
-- Name: idx_club_members_club; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_club_members_club" ON "public"."club_members" USING "btree" ("club_id");


--
-- Name: idx_club_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_club_members_user" ON "public"."club_members" USING "btree" ("user_id");


--
-- Name: idx_clubs_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_clubs_name" ON "public"."clubs" USING "btree" ("name");


--
-- Name: idx_commissions_eligible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_commissions_eligible" ON "public"."commissions" USING "btree" ("eligible_at") WHERE ("status" = 'pending'::"text");


--
-- Name: idx_community_posts_club; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_community_posts_club" ON "public"."community_posts" USING "btree" ("club_id");


--
-- Name: idx_community_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_community_posts_created_at" ON "public"."community_posts" USING "btree" ("created_at" DESC);


--
-- Name: idx_community_posts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_community_posts_user" ON "public"."community_posts" USING "btree" ("user_id");


--
-- Name: idx_media_library_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_media_library_created_at" ON "public"."media_library" USING "btree" ("created_at" DESC);


--
-- Name: idx_media_library_filename; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_media_library_filename" ON "public"."media_library" USING "btree" ("filename");


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_orders_user" ON "public"."orders" USING "btree" ("user_id");


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");


--
-- Name: idx_passages_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_passages_quiz" ON "public"."passages" USING "btree" ("quiz_id");


--
-- Name: idx_passages_quiz_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_passages_quiz_id" ON "public"."passages" USING "btree" ("quiz_id");


--
-- Name: idx_payouts_affiliate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_payouts_affiliate" ON "public"."payouts" USING "btree" ("affiliate_id");


--
-- Name: idx_payouts_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_payouts_created" ON "public"."payouts" USING "btree" ("created_at");


--
-- Name: idx_payouts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_payouts_status" ON "public"."payouts" USING "btree" ("status");


--
-- Name: idx_questions_passage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_questions_passage" ON "public"."questions" USING "btree" ("passage_id");


--
-- Name: idx_questions_passage_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_questions_passage_id" ON "public"."questions" USING "btree" ("passage_id");


--
-- Name: idx_quizzes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_quizzes_created_at" ON "public"."quizzes" USING "btree" ("created_at" DESC);


--
-- Name: idx_quizzes_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_quizzes_skill" ON "public"."quizzes" USING "btree" ("skill");


--
-- Name: idx_quizzes_skill_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_quizzes_skill_type" ON "public"."quizzes" USING "btree" ("skill", "type");


--
-- Name: idx_quizzes_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_quizzes_slug" ON "public"."quizzes" USING "btree" ("slug");


--
-- Name: idx_quizzes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_quizzes_status" ON "public"."quizzes" USING "btree" ("status");


--
-- Name: idx_rate_limits_reset_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_rate_limits_reset_at" ON "public"."rate_limits" USING "btree" ("reset_at");


--
-- Name: idx_redirects_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_redirects_source" ON "public"."redirects" USING "btree" ("source_path") WHERE ("is_active" = true);


--
-- Name: idx_sepay_payout_tx_sepay_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_sepay_payout_tx_sepay_id" ON "public"."sepay_payout_transactions" USING "btree" ("sepay_id");


--
-- Name: idx_study_tasks_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_study_tasks_user_date" ON "public"."study_tasks" USING "btree" ("user_id", "due_date");


--
-- Name: idx_test_results_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_test_results_quiz" ON "public"."test_results" USING "btree" ("quiz_id");


--
-- Name: idx_test_results_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_test_results_submitted_at" ON "public"."test_results" USING "btree" ("submitted_at");


--
-- Name: idx_test_results_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_test_results_user" ON "public"."test_results" USING "btree" ("user_id");


--
-- Name: idx_test_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_test_results_user_id" ON "public"."test_results" USING "btree" ("user_id");


--
-- Name: idx_user_vocab_next_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_user_vocab_next_review" ON "public"."user_vocab" USING "btree" ("user_id", "next_review_at");


--
-- Name: idx_user_vocab_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_user_vocab_user" ON "public"."user_vocab" USING "btree" ("user_id");


--
-- Name: idx_user_vocab_word; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_user_vocab_word" ON "public"."user_vocab" USING "btree" ("word_id");


--
-- Name: idx_users_roles; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_users_roles" ON "public"."users" USING "btree" ("roles");


--
-- Name: idx_vocab_activity_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_vocab_activity_user_created" ON "public"."vocab_activity" USING "btree" ("user_id", "created_at");


--
-- Name: idx_vocab_words_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_vocab_words_owner" ON "public"."vocab_words" USING "btree" ("owner_id");


--
-- Name: idx_vocab_words_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_vocab_words_topic" ON "public"."vocab_words" USING "btree" ("topic");


--
-- Name: posts_is_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "posts_is_featured_idx" ON "public"."posts" USING "btree" ("is_featured");


--
-- Name: posts_skill_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "posts_skill_idx" ON "public"."posts" USING "btree" ("skill");


--
-- Name: classrooms trg_classroom_invite_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_classroom_invite_code" BEFORE INSERT ON "public"."classrooms" FOR EACH ROW EXECUTE FUNCTION "public"."set_classroom_invite_code"();


--
-- Name: classrooms trg_classroom_owner_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_classroom_owner_limit" BEFORE INSERT ON "public"."classrooms" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_classroom_owner_limit"();


--
-- Name: classroom_members trg_classroom_student_limit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_classroom_student_limit" BEFORE INSERT OR UPDATE ON "public"."classroom_members" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_classroom_student_limit"();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: affiliate_bank_info affiliate_bank_info_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_bank_info"
    ADD CONSTRAINT "affiliate_bank_info_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE CASCADE;


--
-- Name: affiliate_links affiliate_links_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE CASCADE;


--
-- Name: affiliate_visits affiliate_visits_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_visits"
    ADD CONSTRAINT "affiliate_visits_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id");


--
-- Name: affiliate_visits affiliate_visits_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliate_visits"
    ADD CONSTRAINT "affiliate_visits_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."affiliate_links"("id");


--
-- Name: affiliates affiliates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."affiliates"
    ADD CONSTRAINT "affiliates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: classroom_assignment_targets classroom_assignment_targets_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignment_targets"
    ADD CONSTRAINT "classroom_assignment_targets_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."classroom_assignments"("id") ON DELETE CASCADE;


--
-- Name: classroom_assignment_targets classroom_assignment_targets_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignment_targets"
    ADD CONSTRAINT "classroom_assignment_targets_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: classroom_assignments classroom_assignments_classroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignments"
    ADD CONSTRAINT "classroom_assignments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE CASCADE;


--
-- Name: classroom_assignments classroom_assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignments"
    ADD CONSTRAINT "classroom_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: classroom_assignments classroom_assignments_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_assignments"
    ADD CONSTRAINT "classroom_assignments_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;


--
-- Name: classroom_members classroom_members_classroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_members"
    ADD CONSTRAINT "classroom_members_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE CASCADE;


--
-- Name: classroom_members classroom_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classroom_members"
    ADD CONSTRAINT "classroom_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: classrooms classrooms_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."classrooms"
    ADD CONSTRAINT "classrooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: club_members club_members_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;


--
-- Name: club_members club_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."club_members"
    ADD CONSTRAINT "club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: commissions commissions_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id");


--
-- Name: community_posts community_posts_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;


--
-- Name: community_posts community_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: media_library media_library_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."media_library"
    ADD CONSTRAINT "media_library_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;


--
-- Name: orders orders_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id");


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: passages passages_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."passages"
    ADD CONSTRAINT "passages_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;


--
-- Name: payouts payouts_affiliate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id");


--
-- Name: questions questions_passage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE CASCADE;


--
-- Name: sepay_payout_transactions sepay_payout_transactions_payout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."sepay_payout_transactions"
    ADD CONSTRAINT "sepay_payout_transactions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id");


--
-- Name: study_tasks study_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."study_tasks"
    ADD CONSTRAINT "study_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: test_results test_results_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;


--
-- Name: test_results test_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: user_vocab user_vocab_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_vocab"
    ADD CONSTRAINT "user_vocab_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: user_vocab user_vocab_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_vocab"
    ADD CONSTRAINT "user_vocab_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "public"."vocab_words"("id") ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: vocab_activity vocab_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vocab_activity"
    ADD CONSTRAINT "vocab_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: vocab_activity vocab_activity_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vocab_activity"
    ADD CONSTRAINT "vocab_activity_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "public"."vocab_words"("id") ON DELETE SET NULL;


--
-- Name: vocab_words vocab_words_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vocab_words"
    ADD CONSTRAINT "vocab_words_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;


--
-- Name: classroom_members Add members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Add members" ON "public"."classroom_members" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_classroom_teacher"("classroom_id", "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."classrooms"
  WHERE (("classrooms"."id" = "classroom_members"."classroom_id") AND ("classrooms"."owner_id" = "auth"."uid"()))))));


--
-- Name: mock_test_collections Admin CRUD mock test collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD mock test collections" ON "public"."mock_test_collections" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: mock_tests Admin CRUD mock tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD mock tests" ON "public"."mock_tests" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: passages Admin CRUD passages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD passages" ON "public"."passages" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: posts Admin CRUD posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD posts" ON "public"."posts" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: questions Admin CRUD questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD questions" ON "public"."questions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: quizzes Admin CRUD quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD quizzes" ON "public"."quizzes" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: sample_essays Admin CRUD sample essays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin CRUD sample essays" ON "public"."sample_essays" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: media_library Admin full access media_library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access media_library" ON "public"."media_library" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: admin_notifications Admin full access notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access notifications" ON "public"."admin_notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: affiliate_links Admin full access on affiliate links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on affiliate links" ON "public"."affiliate_links" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: affiliate_visits Admin full access on affiliate visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on affiliate visits" ON "public"."affiliate_visits" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: affiliates Admin full access on affiliates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on affiliates" ON "public"."affiliates" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: affiliate_bank_info Admin full access on bank info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on bank info" ON "public"."affiliate_bank_info" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: commissions Admin full access on commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on commissions" ON "public"."commissions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: coupons Admin full access on coupon; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on coupon" ON "public"."coupons" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: coupons Admin full access on coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on coupons" ON "public"."coupons" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: orders Admin full access on orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on orders" ON "public"."orders" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: payouts Admin full access on payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on payouts" ON "public"."payouts" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: sepay_payout_transactions Admin full access on sepay_payout_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on sepay_payout_transactions" ON "public"."sepay_payout_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: users Admin full access on users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access on users" ON "public"."users" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: redirects Admin full access redirects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access redirects" ON "public"."redirects" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: activity_logs Admin insert activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin insert activity logs" ON "public"."activity_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: activity_logs Admin read activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin read activity logs" ON "public"."activity_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text")))));


--
-- Name: test_results Admin read all test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin read all test results" ON "public"."test_results" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: cms_configs Admin write cms configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin write cms configs" ON "public"."cms_configs" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: menus Admin write menus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin write menus" ON "public"."menus" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: site_settings Admin write site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin write site settings" ON "public"."site_settings" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());


--
-- Name: classrooms Anyone creates classrooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone creates classrooms" ON "public"."classrooms" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));


--
-- Name: classrooms Class teachers update classroom; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Class teachers update classroom" ON "public"."classrooms" FOR UPDATE USING (("public"."is_classroom_teacher"("id", "auth"."uid"()) OR ("owner_id" = "auth"."uid"())));


--
-- Name: club_members Club memberships are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Club memberships are publicly readable" ON "public"."club_members" FOR SELECT USING (true);


--
-- Name: clubs Clubs are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clubs are publicly readable" ON "public"."clubs" FOR SELECT USING (true);


--
-- Name: community_posts Community posts are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Community posts are publicly readable" ON "public"."community_posts" FOR SELECT USING (true);


--
-- Name: quizzes Members read assigned quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read assigned quizzes" ON "public"."quizzes" FOR SELECT USING ("public"."is_quiz_assigned_to_member"("id", "auth"."uid"()));


--
-- Name: classroom_assignment_targets Members read assignment targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read assignment targets" ON "public"."classroom_assignment_targets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."classroom_assignments" "a"
  WHERE (("a"."id" = "classroom_assignment_targets"."assignment_id") AND "public"."is_classroom_member"("a"."classroom_id", "auth"."uid"())))));


--
-- Name: classroom_assignments Members read assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read assignments" ON "public"."classroom_assignments" FOR SELECT USING (("public"."is_classroom_member"("classroom_id", "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text"))))));


--
-- Name: users Members read co-member profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read co-member profiles" ON "public"."users" FOR SELECT USING ("public"."shares_classroom"("id", "auth"."uid"()));


--
-- Name: classroom_members Members read co-members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read co-members" ON "public"."classroom_members" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_classroom_member"("classroom_id", "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text"))))));


--
-- Name: classrooms Members read their classrooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members read their classrooms" ON "public"."classrooms" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR "public"."is_classroom_member"("id", "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text"))))));


--
-- Name: classrooms Owner deletes classroom; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner deletes classroom" ON "public"."classrooms" FOR DELETE USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."roles" ? 'administrator'::"text"))))));


--
-- Name: vocab_words Owners delete own vocab_words; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners delete own vocab_words" ON "public"."vocab_words" FOR DELETE USING (("owner_id" = "auth"."uid"()));


--
-- Name: vocab_words Owners insert own vocab_words; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners insert own vocab_words" ON "public"."vocab_words" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));


--
-- Name: vocab_words Owners update own vocab_words; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners update own vocab_words" ON "public"."vocab_words" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));


--
-- Name: coupons Public read active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active coupons" ON "public"."coupons" FOR SELECT USING (("is_active" = true));


--
-- Name: redirects Public read active redirects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read active redirects" ON "public"."redirects" FOR SELECT USING (("is_active" = true));


--
-- Name: cms_configs Public read cms configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read cms configs" ON "public"."cms_configs" FOR SELECT USING (true);


--
-- Name: menus Public read menus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read menus" ON "public"."menus" FOR SELECT USING (true);


--
-- Name: mock_test_collections Public read mock test collections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read mock test collections" ON "public"."mock_test_collections" FOR SELECT USING (true);


--
-- Name: mock_tests Public read mock tests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read mock tests" ON "public"."mock_tests" FOR SELECT USING (true);


--
-- Name: passages Public read passages of published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read passages of published quizzes" ON "public"."passages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."quizzes"
  WHERE (("quizzes"."id" = "passages"."quiz_id") AND ("quizzes"."status" = 'published'::"text")))));


--
-- Name: posts Public read published posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published posts" ON "public"."posts" FOR SELECT USING (("status" = 'published'::"text"));


--
-- Name: quizzes Public read published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published quizzes" ON "public"."quizzes" FOR SELECT USING (("status" = 'published'::"text"));


--
-- Name: sample_essays Public read published sample essays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published sample essays" ON "public"."sample_essays" FOR SELECT USING (("status" = 'published'::"text"));


--
-- Name: questions Public read questions of published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read questions of published quizzes" ON "public"."questions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."passages"
     JOIN "public"."quizzes" ON (("quizzes"."id" = "passages"."quiz_id")))
  WHERE (("passages"."id" = "questions"."passage_id") AND ("quizzes"."status" = 'published'::"text")))));


--
-- Name: site_settings Public read site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read site settings" ON "public"."site_settings" FOR SELECT USING (true);


--
-- Name: vocab_words Public read vocab_words; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read vocab_words" ON "public"."vocab_words" FOR SELECT USING (true);


--
-- Name: classroom_members Remove members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Remove members" ON "public"."classroom_members" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."is_classroom_teacher"("classroom_id", "auth"."uid"())));


--
-- Name: classroom_members Teacher updates member roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teacher updates member roles" ON "public"."classroom_members" FOR UPDATE USING ("public"."is_classroom_teacher"("classroom_id", "auth"."uid"()));


--
-- Name: classroom_assignment_targets Teachers manage assignment targets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers manage assignment targets" ON "public"."classroom_assignment_targets" USING ((EXISTS ( SELECT 1
   FROM "public"."classroom_assignments" "a"
  WHERE (("a"."id" = "classroom_assignment_targets"."assignment_id") AND "public"."is_classroom_teacher"("a"."classroom_id", "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."classroom_assignments" "a"
  WHERE (("a"."id" = "classroom_assignment_targets"."assignment_id") AND "public"."is_classroom_teacher"("a"."classroom_id", "auth"."uid"())))));


--
-- Name: classroom_assignments Teachers manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers manage assignments" ON "public"."classroom_assignments" USING ("public"."is_classroom_teacher"("classroom_id", "auth"."uid"())) WITH CHECK ("public"."is_classroom_teacher"("classroom_id", "auth"."uid"()));


--
-- Name: test_results Teachers read student results in their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers read student results in their classes" ON "public"."test_results" FOR SELECT USING ("public"."shares_classroom_as_teacher"("user_id", "auth"."uid"()));


--
-- Name: affiliates User own affiliate; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own affiliate" ON "public"."affiliates" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: affiliate_links User own affiliate links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own affiliate links" ON "public"."affiliate_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."affiliates"
  WHERE (("affiliates"."id" = "affiliate_links"."affiliate_id") AND ("affiliates"."user_id" = "auth"."uid"())))));


--
-- Name: affiliate_visits User own affiliate visits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own affiliate visits" ON "public"."affiliate_visits" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."affiliates"
  WHERE (("affiliates"."id" = "affiliate_visits"."affiliate_id") AND ("affiliates"."user_id" = "auth"."uid"())))));


--
-- Name: affiliate_bank_info User own bank info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own bank info" ON "public"."affiliate_bank_info" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."affiliates"
  WHERE (("affiliates"."id" = "affiliate_bank_info"."affiliate_id") AND ("affiliates"."user_id" = "auth"."uid"())))));


--
-- Name: commissions User own commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own commissions" ON "public"."commissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."affiliates"
  WHERE (("affiliates"."id" = "commissions"."affiliate_id") AND ("affiliates"."user_id" = "auth"."uid"())))));


--
-- Name: orders User own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: payouts User own payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own payouts" ON "public"."payouts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."affiliates"
  WHERE (("affiliates"."id" = "payouts"."affiliate_id") AND ("affiliates"."user_id" = "auth"."uid"())))));


--
-- Name: study_tasks User own study tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own study tasks" ON "public"."study_tasks" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: test_results User own test results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User own test results" ON "public"."test_results" USING (("auth"."uid"() = "user_id"));


--
-- Name: affiliate_bank_info User update own bank info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User update own bank info" ON "public"."affiliate_bank_info" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."affiliates"
  WHERE (("affiliates"."id" = "affiliate_bank_info"."affiliate_id") AND ("affiliates"."user_id" = "auth"."uid"())))));


--
-- Name: community_posts Users can create their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own posts" ON "public"."community_posts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: community_posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON "public"."community_posts" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: users Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: club_members Users can join clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can join clubs" ON "public"."club_members" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: club_members Users can leave clubs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can leave clubs" ON "public"."club_members" FOR DELETE USING (("user_id" = "auth"."uid"()));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: vocab_activity Users manage own vocab activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own vocab activity" ON "public"."vocab_activity" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: user_vocab Users manage own vocab progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own vocab progress" ON "public"."user_vocab" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."admin_notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_bank_info; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."affiliate_bank_info" ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."affiliate_links" ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliate_visits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."affiliate_visits" ENABLE ROW LEVEL SECURITY;

--
-- Name: affiliates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."affiliates" ENABLE ROW LEVEL SECURITY;

--
-- Name: classroom_assignment_targets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."classroom_assignment_targets" ENABLE ROW LEVEL SECURITY;

--
-- Name: classroom_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."classroom_assignments" ENABLE ROW LEVEL SECURITY;

--
-- Name: classroom_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."classroom_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: classrooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."classrooms" ENABLE ROW LEVEL SECURITY;

--
-- Name: club_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."club_members" ENABLE ROW LEVEL SECURITY;

--
-- Name: clubs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."cms_configs" ENABLE ROW LEVEL SECURITY;

--
-- Name: commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: community_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;

--
-- Name: media_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."media_library" ENABLE ROW LEVEL SECURITY;

--
-- Name: menus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."menus" ENABLE ROW LEVEL SECURITY;

--
-- Name: mock_test_collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."mock_test_collections" ENABLE ROW LEVEL SECURITY;

--
-- Name: mock_tests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."mock_tests" ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

--
-- Name: passages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."passages" ENABLE ROW LEVEL SECURITY;

--
-- Name: payouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;

--
-- Name: redirects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."redirects" ENABLE ROW LEVEL SECURITY;

--
-- Name: sample_essays; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."sample_essays" ENABLE ROW LEVEL SECURITY;

--
-- Name: sepay_payout_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."sepay_payout_transactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: study_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."study_tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: test_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."test_results" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_vocab; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."user_vocab" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: vocab_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."vocab_activity" ENABLE ROW LEVEL SECURITY;

--
-- Name: vocab_words; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."vocab_words" ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict zICheSRaVUwvSqJW8P48iqmCZbxf6b1LE0EERTNx9ZaevbbRb8afcz7PQbBooth


