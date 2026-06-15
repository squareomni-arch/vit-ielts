-- ============================================================
-- Supabase SQL Editor — table: classroom_members  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: classroom_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classroom_members VALUES ('88340dad-5b7e-44d9-8c48-ceb688cbed38', '749ac3a9-9230-48c3-be0b-a8246ce3b104', '973c1068-259a-45b5-a5c0-9c18141b145f', 'teacher', '2026-06-11 06:55:38.193533+00', 'active', NULL);
INSERT INTO public.classroom_members VALUES ('8f5c3a51-f99f-4760-8ca0-0affb3d506ae', '749ac3a9-9230-48c3-be0b-a8246ce3b104', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', 'student', '2026-06-11 06:56:40.938011+00', 'pending', NULL);
SET session_replication_role = DEFAULT;
