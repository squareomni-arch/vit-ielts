-- ============================================================
-- Supabase SQL Editor — table: rate_limits  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rate_limits VALUES ('coupon:::1', 2, '2026-06-15 06:20:20.640198+00');
INSERT INTO public.rate_limits VALUES ('test-start:::1', 1, '2026-06-15 11:00:47.104399+00');
INSERT INTO public.rate_limits VALUES ('test-summary:::ffff:127.0.0.1', 1, '2026-06-10 07:15:34.42997+00');
INSERT INTO public.rate_limits VALUES ('test-summary:::1', 4, '2026-06-15 15:45:10.646993+00');
SET session_replication_role = DEFAULT;
