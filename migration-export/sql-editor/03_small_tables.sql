-- ============================================================
-- STEP 3: Small tables (users, quizzes config, classrooms, etc.)
-- Combined file — run ONCE
-- ============================================================
SET session_replication_role = replica;

-- TABLE: data_users_001.sql
-- ============================================================
-- Supabase SQL Editor — table: users  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('ba293401-7bf7-4a06-b168-aa8b3dc9e8f6', 'admin@vit.vn', 'Admin VIT', NULL, false, NULL, '{}', NULL, NULL, NULL, '["administrator"]', '{}', '2026-06-11 07:57:18.269078+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('f744c878-8a6d-472f-b1c1-971ad771f3f5', 'test-c8r6808h@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 06:51:19.756104+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('a6fe561b-f6ab-45e6-998d-86a558d1cc8a', 'test-zfx0kunx@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 08:57:39.608137+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('6167ac6b-ddef-4021-81d2-374abf7965c9', 'test-26cnoff8@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 07:13:41.544406+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('b8e75893-8a40-4eb3-b10f-14c58eb27ab3', 'test-5nn1cdys@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 09:35:03.63182+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('2b0eeda7-58ae-4ce3-b2ec-d18918c090db', 'test-avejzhqe@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 07:42:07.117552+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('c087c1ad-9d82-4e75-a508-7f55596e3003', 'test-wmrrv67n@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 07:13:41.711832+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('d1f93e95-5210-42eb-8695-b5c22bf0d680', 'test-dyrux9qr@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:39:15.819818+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('13962f3e-be85-4f80-b48e-869f4620c5e0', 'test-yg8vip2k@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 09:35:03.882928+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('48394223-2b58-4c9c-a23a-67bb52ef449e', 'test-3kasvt6c@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:33:44.762652+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('1d835d6c-3176-4ffc-87fe-6729768ca6ca', 'test-papxjyr5@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 07:13:53.080443+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('f168de7a-f114-43da-abc9-9b76041e1b31', 'test-thyuldby@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 08:22:55.312555+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('ab81ec25-f522-443c-9b86-5d309b325646', 'test-r6m7nrl2@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 08:34:33.049841+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('d373bc0f-6676-4960-b418-9b6d820c84f1', 'test-x5fupsrz@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 07:13:53.317789+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('98374dd4-d18a-434e-b207-065af43461b6', 'test-ptq1kinh@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 04:54:48.726482+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('bce28c8a-8c03-47e7-9521-50f5d95e5d8a', 'test-hk2razbj@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 08:22:55.474184+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('6bce7472-4ba6-4f0d-a413-36db5ba3fad8', 'test-6excnukx@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-15 04:44:18.772578+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('a49f7e76-69b9-441c-8137-f98a935d956b', 'test-pe535egy@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 06:51:19.606854+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('93c6596f-f2ae-4163-b713-ffa02c8db9f2', 'test-tkmyw2wz@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 07:42:06.887773+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('ece4a35c-b493-4955-a493-f16c184928ea', 'test-lkwkmcw2@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:33:44.934708+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('cef7cd5d-1aaf-42a6-b382-d22627cb4fc8', 'test-e2fs3wbm@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 08:41:45.916872+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('81f4b8fc-e720-4d89-98b0-bcf097bdfaca', 'test-rohgf14a@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 09:22:08.666268+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('a455ceda-8e58-4be7-bbc1-efb31ee0fd08', 'test-p37wb4hp@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 08:41:46.122558+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('51e42d3b-674b-4c07-a7ab-d38a911d5b08', 'test-2ta27j0d@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:12:37.002899+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('92adc14b-51c0-4edf-8328-785ef7f5828c', 'test-9c9gye4r@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-15 04:44:18.860416+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('38978516-b87f-4d93-b98b-e7fac36b1663', 'test-9iyngw8h@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 06:58:10.353902+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('0644aa6f-e3fb-485d-b8e1-0f0b3bb83a94', 'test-a2mauabl@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:12:37.174397+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('f6249401-4b33-4285-9c63-b830df5c2627', 'test-8dmrvpa6@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 04:54:48.981194+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('86845fee-e421-4c81-a2f2-8a3a29c9ce84', 'test-wep40ydt@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 08:57:39.452859+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('0f46acd1-a9e9-422d-9c01-0786afc89569', 'test-20a87854@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-10 09:22:08.795671+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('6d63fe39-c26a-41b9-a7e7-9ce1a4e45a14', 'test-eu78wdly@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 06:58:10.474559+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('6d563ba6-51d0-4c76-9e99-e9175eeff6ab', 'test-pwsegwo0@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 08:34:32.79872+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('b18518da-2ebf-4f62-bc6b-a520701e5aba', 'test-t8ifxub8@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:39:15.395769+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('973c1068-259a-45b5-a5c0-9c18141b145f', 'teacher@vit.vn', 'Teacher VIT', '/uploads/images/avatar-1781249242291-554031.jpg', false, NULL, '{}', NULL, NULL, NULL, '["teacher"]', '{}', '2026-06-11 06:47:35.180018+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('4ebe2ab1-659c-4734-82bd-066605c6eefc', 'test-o6o3uadl@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 10:35:43.227403+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('36692875-cd79-440a-92f1-6e72e7a93a5a', 'test-1yk622j2@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:53:02.712562+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('4e6d32e5-4ce9-4088-8b0e-e4414cb725b1', 'test-y61pog8e@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 10:35:43.087795+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('9079f2c3-919a-495c-b325-eca4f0215d7a', 'test-g5e4ag7a@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-11 07:53:02.880022+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('e9536f85-f63c-4936-bae8-a3fc08ef1413', 'test-x1yhgkgi@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 10:35:55.46187+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('5280d776-928d-4e08-a373-3ff9ce1dd681', 'test-gblmid9i@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 10:35:55.316832+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('dd1cb047-9eee-4053-904c-01dde201779b', 'test-9vy9i0wl@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 10:38:39.053711+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('d04360b2-7567-45aa-803e-99e907406663', 'test-vla5sxz0@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-12 10:38:39.248987+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('2ab5e2db-56a4-4098-9a0b-03a2cb4e853a', 'e2e-teacher@vit.test', 'E2E Teacher', NULL, false, NULL, '{}', NULL, NULL, NULL, '["teacher"]', '{}', '2026-06-15 05:57:27.270781+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('f9b32ed9-0fd0-41ed-99b2-0e4d000a0c74', 'test-pudoq2lg@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-15 08:07:41.061876+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('abc87a59-b6c6-494c-a153-6a8433ffc039', 'test-mwzbulhk@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-15 06:55:55.553868+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('dbed1dda-a14a-4434-b7f1-728473f00540', 'test-h62z8oqc@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-15 08:07:41.274752+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('27f93b3a-6479-4e8e-8a07-886d31c08138', 'test-livv72ol@example.com', 'Test User', NULL, false, NULL, '{}', NULL, NULL, NULL, '["subscriber"]', '{}', '2026-06-15 06:55:55.91272+00', NULL, NULL, NULL, '{}');
INSERT INTO public.users VALUES ('88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', 'devtest@vit.vn', 'Dev Test', '/uploads/images/avatar-1781491850346-288923.jpg', true, '2030-01-01', '{"reading": 8, "writing": 8, "speaking": 8, "listening": 8}', 'male', '1997-11-15', '', '["subscriber"]', '{"00efa28a-1915-4a5c-92e8-36426a743910": {"device_id": "00efa28a-1915-4a5c-92e8-36426a743910"}, "141c120f-a8bc-4fb6-9ad6-ebf93ba8dd4e": {"device_id": "141c120f-a8bc-4fb6-9ad6-ebf93ba8dd4e"}, "24fbf774-18fa-4bf8-a776-1f192c1377c6": {"device_id": "24fbf774-18fa-4bf8-a776-1f192c1377c6"}, "47db8a77-90e9-4358-8484-f86d40a53538": {"device_id": "47db8a77-90e9-4358-8484-f86d40a53538"}, "56293696-1934-43a2-835b-70af93fa65e0": {"device_id": "56293696-1934-43a2-835b-70af93fa65e0"}, "65153562-69c1-4877-a802-e8816a488049": {"device_id": "65153562-69c1-4877-a802-e8816a488049"}, "6605673b-ac1e-4b01-8d06-7e2c2adeb4a8": {"device_id": "6605673b-ac1e-4b01-8d06-7e2c2adeb4a8"}, "6717eed6-b081-44f2-9486-0d33f77e89ca": {"device_id": "6717eed6-b081-44f2-9486-0d33f77e89ca"}, "736f9be7-bbd5-43db-be8d-67619d05c7dd": {"device_id": "736f9be7-bbd5-43db-be8d-67619d05c7dd"}, "79771f67-4dbe-4963-8181-1bea7d6e3756": {"device_id": "79771f67-4dbe-4963-8181-1bea7d6e3756"}, "82e7de29-9725-4cc1-89e7-78fb464f6a01": {"device_id": "82e7de29-9725-4cc1-89e7-78fb464f6a01"}, "9507a7d3-12e7-44e9-856c-1e5145b5438f": {"device_id": "9507a7d3-12e7-44e9-856c-1e5145b5438f"}, "9e36625a-f276-47a9-abef-7f3058e24f63": {"device_id": "9e36625a-f276-47a9-abef-7f3058e24f63"}, "b6928f8c-ab01-4850-b089-846bd20bd6eb": {"device_id": "b6928f8c-ab01-4850-b089-846bd20bd6eb"}, "bd5e4862-7662-409d-a9de-1ba1286d8c70": {"device_id": "bd5e4862-7662-409d-a9de-1ba1286d8c70"}, "c7a3b694-6138-4af9-a232-6eaba00f5713": {"device_id": "c7a3b694-6138-4af9-a232-6eaba00f5713"}, "e62c4368-b2f8-48c3-b5d8-3e92ae516835": {"device_id": "e62c4368-b2f8-48c3-b5d8-3e92ae516835"}, "f1033991-60a6-4f44-a3d4-d227fd480598": {"device_id": "f1033991-60a6-4f44-a3d4-d227fd480598"}, "f906f691-40c2-4087-a024-e8b1ce9ed32b": {"device_id": "f906f691-40c2-4087-a024-e8b1ce9ed32b"}}', '2026-06-10 03:02:22.187485+00', NULL, '', '', '{"notifications": {"weeklyReport": false, "studyReminders": true}}');
SET session_replication_role = DEFAULT;

-- TABLE: data_classrooms_001.sql
-- ============================================================
-- Supabase SQL Editor — table: classrooms  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classrooms VALUES ('749ac3a9-9230-48c3-be0b-a8246ce3b104', 'Class Demo', NULL, '2DBY7F', '973c1068-259a-45b5-a5c0-9c18141b145f', 'active', '2026-06-11 06:55:38.177613+00', NULL);
SET session_replication_role = DEFAULT;

-- TABLE: data_clubs_001.sql
-- ============================================================
-- Supabase SQL Editor — table: clubs  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.clubs VALUES ('cfd614dc-2df9-4922-b1ef-e3da9c8dc5e9', 'Daily Speaking Club', 'Open practice every evening', 'All levels', '2026-06-11 07:54:01.860762+00');
INSERT INTO public.clubs VALUES ('f1a3fbc4-2ba6-4106-ab8e-e202fc1fe46b', 'Band 7+ Circle', 'Advanced fluency & ideas', 'Advanced', '2026-06-11 07:54:01.860762+00');
INSERT INTO public.clubs VALUES ('78b11cd3-a247-472c-b580-ef74ab2f96f5', 'Pronunciation Lab', 'Sounds, stress & intonation', 'Intermediate', '2026-06-11 07:54:01.860762+00');
INSERT INTO public.clubs VALUES ('63be79f2-a721-4cec-a8a4-5e1fda6793fe', 'Writing Feedback Group', 'Peer-review essays together', 'All levels', '2026-06-11 07:54:01.860762+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_affiliates_001.sql
-- ============================================================
-- Supabase SQL Editor — table: affiliates  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: affiliates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.affiliates VALUES ('d8beeb93-11e3-41a2-9581-cc1e6b71e31d', '4e6d32e5-4ce9-4088-8b0e-e4414cb725b1', 'payout-ref-4e6d32e5', 'active', 0.1, '2026-06-12 10:35:43.117329+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('c1733dd1-e715-4f98-b11d-42e94309aec1', '6167ac6b-ddef-4021-81d2-374abf7965c9', 'payout-ref-6167ac6b', 'active', 0.1, '2026-06-10 07:13:41.57513+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('b39d71ae-82ac-475f-9663-bfb78a366cbd', '48394223-2b58-4c9c-a23a-67bb52ef449e', 'payout-ref-48394223', 'active', 0.1, '2026-06-11 07:33:44.794623+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('f4e93283-b16b-44ba-81b4-f929555624a4', '81f4b8fc-e720-4d89-98b0-bcf097bdfaca', 'payout-ref-81f4b8fc', 'active', 0.1, '2026-06-10 09:22:08.943683+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('e20e4fe7-415a-4275-a6c3-71c086636ce9', '98374dd4-d18a-434e-b207-065af43461b6', 'payout-ref-98374dd4', 'active', 0.1, '2026-06-12 04:54:48.769873+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('3138d2d6-591c-4606-b84d-540f07be6c87', '1d835d6c-3176-4ffc-87fe-6729768ca6ca', 'payout-ref-1d835d6c', 'active', 0.1, '2026-06-10 07:13:53.114864+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('9baa8e60-6098-4337-bfb1-39a14b0ea0bb', 'b18518da-2ebf-4f62-bc6b-a520701e5aba', 'payout-ref-b18518da', 'active', 0.1, '2026-06-11 07:39:15.581716+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('727e4948-b5c3-4648-abab-13bc3efc6e8e', 'b8e75893-8a40-4eb3-b10f-14c58eb27ab3', 'payout-ref-b8e75893', 'active', 0.1, '2026-06-10 09:35:03.665927+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('fc97bf6e-099a-45dd-8edd-1e104b665a19', '93c6596f-f2ae-4163-b713-ffa02c8db9f2', 'payout-ref-93c6596f', 'active', 0.1, '2026-06-10 07:42:06.922363+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('7b9a09f0-7879-45f2-8f16-c81eec18b52b', 'abc87a59-b6c6-494c-a153-6a8433ffc039', 'payout-ref-abc87a59', 'active', 0.1, '2026-06-15 06:55:55.747066+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('aaa012e9-e039-43ec-bf6c-1f1e5d65a7a9', '5280d776-928d-4e08-a373-3ff9ce1dd681', 'payout-ref-5280d776', 'active', 0.1, '2026-06-12 10:35:55.344439+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('252aa396-2684-4397-b0e6-1cdada0f988b', '38978516-b87f-4d93-b98b-e7fac36b1663', 'payout-ref-38978516', 'active', 0.1, '2026-06-12 06:58:10.397072+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('aa1ece5d-a4fe-4045-9efd-04a15b9ab39f', 'cef7cd5d-1aaf-42a6-b382-d22627cb4fc8', 'payout-ref-cef7cd5d', 'active', 0.1, '2026-06-10 08:41:45.947798+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('cafb224c-713c-4378-b465-df3d464b1748', '36692875-cd79-440a-92f1-6e72e7a93a5a', 'payout-ref-36692875', 'active', 0.1, '2026-06-11 07:53:02.74453+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('77f13490-9dc0-4d5b-8cce-9d834b43c5c2', 'a49f7e76-69b9-441c-8137-f98a935d956b', 'payout-ref-a49f7e76', 'active', 0.1, '2026-06-11 06:51:19.641745+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('311eb6ba-cfc2-4054-b945-aecda587246e', '86845fee-e421-4c81-a2f2-8a3a29c9ce84', 'payout-ref-86845fee', 'active', 0.1, '2026-06-10 08:57:39.482796+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('84068998-2641-43f5-bc15-16fad3a43fd8', 'f168de7a-f114-43da-abc9-9b76041e1b31', 'payout-ref-f168de7a', 'active', 0.1, '2026-06-11 08:22:55.344178+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('431d6d57-33d2-41df-8d1d-35b504712084', '6d563ba6-51d0-4c76-9e99-e9175eeff6ab', 'payout-ref-6d563ba6', 'active', 0.1, '2026-06-12 08:34:32.85177+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('2a22d4e2-cdd0-46cf-ad0c-90f28a53c924', '51e42d3b-674b-4c07-a7ab-d38a911d5b08', 'payout-ref-51e42d3b', 'active', 0.1, '2026-06-11 07:12:37.037189+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('b6317006-f771-4ee5-a990-d1175745a433', 'dd1cb047-9eee-4053-904c-01dde201779b', 'payout-ref-dd1cb047', 'active', 0.1, '2026-06-12 10:38:39.084811+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('a5b63557-7152-4dbd-8dc0-2b8941a2ede8', 'f9b32ed9-0fd0-41ed-99b2-0e4d000a0c74', 'payout-ref-f9b32ed9', 'active', 0.1, '2026-06-15 08:07:41.142709+00', 0, 0, NULL);
INSERT INTO public.affiliates VALUES ('ce1a4e1c-108c-48f6-ae4e-973c6b86639f', '6bce7472-4ba6-4f0d-a413-36db5ba3fad8', 'payout-ref-6bce7472', 'active', 0.1, '2026-06-15 04:44:18.804344+00', 0, 0, NULL);
SET session_replication_role = DEFAULT;

-- TABLE: data_coupons_001.sql
-- ============================================================
-- Supabase SQL Editor — table: coupons  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.coupons VALUES ('cfa7670a-bb77-4a8a-ae4e-462f9a29958e', 'TEST-S9UTWYX5', 'percent', 10, 5, 1, true, NULL, '2026-04-06 10:20:06.378475+00');
INSERT INTO public.coupons VALUES ('0534eb8c-539d-419e-a06d-a7f93c4c520b', 'TEST-NZD12RCK', 'percent', 10, 1, 1, true, NULL, '2026-04-06 10:20:07.218068+00');
INSERT INTO public.coupons VALUES ('ebcefae0-a6e4-4287-9e8f-196ffa131f0f', 'FREEBYE', 'percent', 100, NULL, 2, true, NULL, '2026-04-06 10:24:17.658551+00');
INSERT INTO public.coupons VALUES ('a9889d56-9d3b-4674-90ec-a21b3aece55e', 'ANHTHO', 'fixed', 20000, 10, 1, true, '2026-05-09 17:00:00+00', '2026-05-09 03:43:42.435223+00');
INSERT INTO public.coupons VALUES ('c80e7cf1-52bb-4b00-affe-e597db48ec80', 'IELTSIDP', 'fixed', 50000, 50, 1, true, NULL, '2026-05-17 11:15:50.580352+00');
INSERT INTO public.coupons VALUES ('f794c8b7-1a9b-4398-ab1c-25eab074e821', '50LRT5', 'fixed', 50000, 30, 0, true, '2026-07-30 17:00:00+00', '2026-06-02 03:53:24.923152+00');
INSERT INTO public.coupons VALUES ('7e0819db-1629-49f8-9950-d2ada39e287f', '100LRT5', 'fixed', 100000, 10, 0, true, '2026-07-30 17:00:00+00', '2026-06-02 03:53:48.844512+00');
INSERT INTO public.coupons VALUES ('82cd8d8f-f400-46b7-9d2c-d658c4929772', 'TEST-MIR5V0Q2', 'percent', 10, 5, 1, true, NULL, '2026-05-01 08:50:21.497483+00');
INSERT INTO public.coupons VALUES ('a8043e02-a929-4a3a-bf64-c17c72752e9d', 'TEST-PERQQUEO', 'fixed', 50000, 5, 1, true, NULL, '2026-05-01 08:50:23.355554+00');
INSERT INTO public.coupons VALUES ('24e98b59-ed33-4f3b-b050-48e4e7cda8ae', 'TEST-EFYWKQ99', 'percent', 10, 1, 1, true, NULL, '2026-05-01 08:50:23.711124+00');
INSERT INTO public.coupons VALUES ('09fdb014-9aac-4fcb-afab-bf970d9ee50d', 'TEST-L6DRGE3S', 'percent', 10, 5, 1, true, NULL, '2026-05-01 08:50:37.24681+00');
INSERT INTO public.coupons VALUES ('068074fa-e566-43ba-b27e-406b75b93303', 'TEST-BQW4OYV9', 'fixed', 50000, 5, 1, true, NULL, '2026-05-01 08:50:38.755251+00');
INSERT INTO public.coupons VALUES ('584ff228-2eaf-47c1-a340-eaf6ca9d9617', 'TEST-CM0WXVWT', 'percent', 10, 1, 1, true, NULL, '2026-05-01 08:50:39.202779+00');
INSERT INTO public.coupons VALUES ('deb8caa2-875d-41ff-a45b-3f182fed6021', 'TEST-0G9P3WSJ', 'fixed', 50000, 5, 2, true, NULL, '2026-04-06 10:20:06.912515+00');
INSERT INTO public.coupons VALUES ('a5fdff24-26df-4885-9aee-b277065d38fc', 'NGOCHAI', 'fixed', 20000, 50, 0, true, NULL, '2026-05-20 15:09:32.962101+00');
INSERT INTO public.coupons VALUES ('84b60cc6-d977-4391-b2cc-abc80d6f3b41', 'TEST-6U2N2THT', 'percent', 10, 5, 1, true, NULL, '2026-06-10 07:13:41.369198+00');
INSERT INTO public.coupons VALUES ('59435acf-2792-44a7-8e5d-1014e5d7506d', 'TEST-GYWXPLU3', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 07:13:41.527615+00');
INSERT INTO public.coupons VALUES ('5de15a7d-1189-4f36-8100-91a89de65dae', 'TEST-LWMF50KT', 'percent', 10, 1, 1, true, NULL, '2026-06-10 07:13:41.546286+00');
INSERT INTO public.coupons VALUES ('f891347a-f64a-4a54-baea-26e1fa886b7f', 'TEST-K36JGOML', 'percent', 10, 5, 1, true, NULL, '2026-06-10 07:13:53.053767+00');
INSERT INTO public.coupons VALUES ('a201dd78-69c1-48bb-ad45-876d2fded4bc', 'TEST-GWH52497', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 07:13:53.087147+00');
INSERT INTO public.coupons VALUES ('82964e62-e9bb-488b-82e9-1963a21670ab', 'TEST-EB1NM9B7', 'percent', 10, 1, 1, true, NULL, '2026-06-10 07:13:53.106535+00');
INSERT INTO public.coupons VALUES ('874feddd-84ae-4792-a5da-1e31dd6295e1', 'TEST-FPK4HV0K', 'percent', 10, 5, 1, true, NULL, '2026-06-10 07:42:06.866622+00');
INSERT INTO public.coupons VALUES ('0007dc66-1bdb-418d-9fee-e03f8042fa3a', 'TEST-XUAMRRZE', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 07:42:06.904623+00');
INSERT INTO public.coupons VALUES ('517f337e-f146-4a16-9eeb-dee6d93cb4a9', 'TEST-XXNKSSMZ', 'percent', 10, 1, 1, true, NULL, '2026-06-10 07:42:06.928005+00');
INSERT INTO public.coupons VALUES ('f1321caa-e99a-4472-8f62-42405d81be0f', 'TEST-2QCU9NHX', 'percent', 10, 5, 1, true, NULL, '2026-06-10 08:41:45.867703+00');
INSERT INTO public.coupons VALUES ('cbb0229a-cefa-48dc-88f2-95dd2a1c87a4', 'TEST-P91AEYLR', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 08:41:45.90479+00');
INSERT INTO public.coupons VALUES ('6babe053-fe50-4d31-a1d8-a2846554d7cb', 'TEST-NNNJOZ6R', 'percent', 10, 1, 1, true, NULL, '2026-06-10 08:41:45.923861+00');
INSERT INTO public.coupons VALUES ('1d28831c-09b7-4315-90b8-10faae07029a', 'TEST-UIY1MP7U', 'percent', 10, 5, 1, true, NULL, '2026-06-10 08:57:39.356672+00');
INSERT INTO public.coupons VALUES ('d14e1813-96a4-4f79-9f3c-d1b548e6438b', 'TEST-EMI8L0FF', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 08:57:39.390874+00');
INSERT INTO public.coupons VALUES ('52970bc4-6952-43cc-a389-2a065b900431', 'TEST-15VHJY7D', 'percent', 10, 1, 1, true, NULL, '2026-06-10 08:57:39.408836+00');
INSERT INTO public.coupons VALUES ('a1a76970-e9f8-4028-b1bd-355ff24639ad', 'TEST-QUR7O8XM', 'percent', 10, 5, 1, true, NULL, '2026-06-10 09:22:08.546921+00');
INSERT INTO public.coupons VALUES ('aab9fa31-4d7c-46e6-9482-3ac70a5ebfb3', 'TEST-C1NWCVX0', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 09:22:08.582318+00');
INSERT INTO public.coupons VALUES ('52a42984-6df4-4fdc-99d6-9ebee6f73962', 'TEST-E1C7DI3X', 'percent', 10, 1, 1, true, NULL, '2026-06-10 09:22:08.606089+00');
INSERT INTO public.coupons VALUES ('294b9799-4823-4d05-b9eb-abcd6d4ecb59', 'TEST-62KI4OQV', 'percent', 10, 5, 1, true, NULL, '2026-06-10 09:35:03.632634+00');
INSERT INTO public.coupons VALUES ('8ae30bc9-80dc-4839-aa32-edcf333eb304', 'TEST-N4VOJFKX', 'fixed', 50000, 5, 1, true, NULL, '2026-06-10 09:35:03.673575+00');
INSERT INTO public.coupons VALUES ('f84bc600-b2fa-46dc-934c-54bcb898b69a', 'TEST-44AOA81I', 'percent', 10, 1, 1, true, NULL, '2026-06-10 09:35:03.693463+00');
INSERT INTO public.coupons VALUES ('588acdf4-d40f-4b96-8978-808b0fe1cccf', 'TEST-IN8EEN7A', 'percent', 10, 5, 1, true, NULL, '2026-06-11 06:51:19.513572+00');
INSERT INTO public.coupons VALUES ('48c0f63b-33c0-4d26-b8e5-2574d35624dc', 'TEST-NWGGM1IO', 'fixed', 50000, 5, 1, true, NULL, '2026-06-11 06:51:19.548854+00');
INSERT INTO public.coupons VALUES ('125c56bf-c969-452c-9eae-e02a6aad2dcd', 'TEST-476ATC3B', 'percent', 10, 1, 1, true, NULL, '2026-06-11 06:51:19.566431+00');
INSERT INTO public.coupons VALUES ('df07bfcc-bc44-4811-acc6-1e09bf04eef4', 'TEST-48TA80NY', 'percent', 10, 5, 1, true, NULL, '2026-06-11 07:12:36.926202+00');
INSERT INTO public.coupons VALUES ('466e7adc-d9cb-470f-8fec-2cf9f4c9c61e', 'TEST-CTXGO30C', 'fixed', 50000, 5, 1, true, NULL, '2026-06-11 07:12:36.998699+00');
INSERT INTO public.coupons VALUES ('68f7483d-919b-4780-959d-dacb7cfc24f3', 'TEST-YC1RJ9MO', 'percent', 10, 1, 1, true, NULL, '2026-06-11 07:12:37.020233+00');
INSERT INTO public.coupons VALUES ('4a83f6d3-0756-42b2-a20b-aad8b79a65be', 'TEST-RZO4C31F', 'percent', 10, 5, 1, true, NULL, '2026-06-11 07:33:44.690204+00');
INSERT INTO public.coupons VALUES ('6fa8e314-d24a-40af-92c5-9785002895af', 'TEST-PWEBSGOX', 'fixed', 50000, 5, 1, true, NULL, '2026-06-11 07:33:44.722874+00');
INSERT INTO public.coupons VALUES ('04bbf64b-937e-4c7e-95d3-f2715622e494', 'TEST-BZHLR3F1', 'percent', 10, 1, 1, true, NULL, '2026-06-11 07:33:44.736116+00');
INSERT INTO public.coupons VALUES ('94bc732a-b077-4042-b5f9-588080765f74', 'TEST-3JPA7ZYF', 'percent', 10, 5, 1, true, NULL, '2026-06-11 07:39:15.570309+00');
INSERT INTO public.coupons VALUES ('e3f19e75-1ac9-45eb-862c-1cb6e778ea07', 'TEST-D2J3AN9Z', 'fixed', 50000, 5, 1, true, NULL, '2026-06-11 07:39:15.618727+00');
INSERT INTO public.coupons VALUES ('5e7924f2-fb6e-4b11-aab6-5593c5735d34', 'TEST-JOWVE99X', 'percent', 10, 1, 1, true, NULL, '2026-06-11 07:39:15.637882+00');
INSERT INTO public.coupons VALUES ('47f4a93e-0a58-4844-9a63-1aab57a85816', 'TEST-ZS7IQP1X', 'percent', 10, 5, 1, true, NULL, '2026-06-11 07:53:02.610027+00');
INSERT INTO public.coupons VALUES ('7ac7ef5a-fc87-41c4-a7e2-598c5bdc5eb3', 'TEST-95HFKK40', 'fixed', 50000, 5, 1, true, NULL, '2026-06-11 07:53:02.648032+00');
INSERT INTO public.coupons VALUES ('2d8d299b-799f-4a2f-9b76-4020b03c29f4', 'TEST-LERS37VW', 'percent', 10, 1, 1, true, NULL, '2026-06-11 07:53:02.667781+00');
INSERT INTO public.coupons VALUES ('2eac8214-7265-4382-81c4-07a6377a1cdb', 'TEST-1OETBVHL', 'percent', 10, 5, 1, true, NULL, '2026-06-11 08:22:55.234574+00');
INSERT INTO public.coupons VALUES ('ee2c2e9c-b6c8-4e6a-93f1-7b7e7b3fc0ba', 'TEST-J3U9JH1Z', 'fixed', 50000, 5, 1, true, NULL, '2026-06-11 08:22:55.268877+00');
INSERT INTO public.coupons VALUES ('30f73ce0-ec84-4508-978a-d7ec58eaecb2', 'TEST-KVQMNP3T', 'percent', 10, 1, 1, true, NULL, '2026-06-11 08:22:55.283654+00');
INSERT INTO public.coupons VALUES ('3afc00c8-ec3a-41c6-ac16-7290c863f6dc', 'TEST-Z0PPLXQ7', 'percent', 10, 5, 1, true, NULL, '2026-06-12 04:54:48.722875+00');
INSERT INTO public.coupons VALUES ('a0257427-9774-4984-9cab-5d11ea766738', 'TEST-SJ7NHJ11', 'fixed', 50000, 5, 1, true, NULL, '2026-06-12 04:54:48.779053+00');
INSERT INTO public.coupons VALUES ('881e7cf6-0c55-409a-89ad-cae6f9439fe5', 'TEST-4224KXSC', 'percent', 10, 1, 1, true, NULL, '2026-06-12 04:54:48.797963+00');
INSERT INTO public.coupons VALUES ('64ed23b7-4eb7-4969-a78a-70ac748c3863', 'TEST-7FTO5JM1', 'percent', 10, 5, 1, true, NULL, '2026-06-12 06:58:10.204256+00');
INSERT INTO public.coupons VALUES ('bcda2d94-78cd-4caf-b79f-e0c033942774', 'TEST-PCVZLK9V', 'fixed', 50000, 5, 1, true, NULL, '2026-06-12 06:58:10.261899+00');
INSERT INTO public.coupons VALUES ('963baaa1-0d2d-4288-b6d1-bb88d5b87163', 'TEST-Q1JWAIVH', 'percent', 10, 1, 1, true, NULL, '2026-06-12 06:58:10.286388+00');
INSERT INTO public.coupons VALUES ('2451b8a6-3749-4a40-821a-4c1340754426', 'TEST-0GT4CVRN', 'percent', 10, 5, 1, true, NULL, '2026-06-12 08:34:32.807467+00');
INSERT INTO public.coupons VALUES ('052c108c-78a8-4414-9247-3d29b6741a93', 'TEST-2Y04R5D0', 'fixed', 50000, 5, 1, true, NULL, '2026-06-12 08:34:32.869372+00');
INSERT INTO public.coupons VALUES ('3d233afe-67ca-430a-a35b-affafe11daf3', 'TEST-PV5SBWPW', 'percent', 10, 1, 1, true, NULL, '2026-06-12 08:34:32.886972+00');
INSERT INTO public.coupons VALUES ('7b2e5a78-cd0d-4055-b194-15573d3060a2', 'TEST-UY8YOB3G', 'percent', 10, 5, 1, true, NULL, '2026-06-12 10:35:43.008725+00');
INSERT INTO public.coupons VALUES ('831d14c9-218b-4212-a617-f8d0b0f682e8', 'TEST-SHOR32UC', 'fixed', 50000, 5, 1, true, NULL, '2026-06-12 10:35:43.044115+00');
INSERT INTO public.coupons VALUES ('994832a1-147a-49b0-a7f9-dd6bb421f01a', 'TEST-7F6RZEJ8', 'percent', 10, 1, 1, true, NULL, '2026-06-12 10:35:43.061924+00');
INSERT INTO public.coupons VALUES ('6a79670b-8ea2-4154-8640-6eceff0ea43e', 'TEST-FEF2RWIF', 'percent', 10, 5, 1, true, NULL, '2026-06-12 10:35:55.206711+00');
INSERT INTO public.coupons VALUES ('c5f19dd3-e3b6-4d5c-a644-ff5a1a97344c', 'TEST-3EC0FIAW', 'fixed', 50000, 5, 1, true, NULL, '2026-06-12 10:35:55.241102+00');
INSERT INTO public.coupons VALUES ('9ef5731c-533c-4e2b-9c27-d39593630986', 'TEST-Q9NKUP61', 'percent', 10, 1, 1, true, NULL, '2026-06-12 10:35:55.258204+00');
INSERT INTO public.coupons VALUES ('ff6ad171-53a7-4c5b-898a-defb544f7969', 'TEST-7045DHPM', 'percent', 10, 5, 1, true, NULL, '2026-06-12 10:38:38.965391+00');
INSERT INTO public.coupons VALUES ('405847d9-9b6f-4a69-9b81-138fe81ebd29', 'TEST-M8123IFS', 'fixed', 50000, 5, 1, true, NULL, '2026-06-12 10:38:39.044883+00');
INSERT INTO public.coupons VALUES ('743a2316-58ff-4646-8de3-1d6c8fc253db', 'TEST-HDK9V66D', 'percent', 10, 1, 1, true, NULL, '2026-06-12 10:38:39.063996+00');
INSERT INTO public.coupons VALUES ('7b552c73-d629-4d73-b5c5-765a6243bb59', 'TEST-MNHYVOV0', 'percent', 10, 5, 1, true, NULL, '2026-06-15 04:44:18.581538+00');
INSERT INTO public.coupons VALUES ('853f4215-3cb0-4232-81eb-22c216bee50e', 'TEST-2HFT85XX', 'fixed', 50000, 5, 1, true, NULL, '2026-06-15 04:44:18.622529+00');
INSERT INTO public.coupons VALUES ('36827d38-f2c2-43bd-9568-8cdb7533ad96', 'TEST-AOTDOZKJ', 'percent', 10, 1, 1, true, NULL, '2026-06-15 04:44:18.646483+00');
INSERT INTO public.coupons VALUES ('e21e2fa9-2e29-435a-b46d-363acb94f9fb', 'TEST-2ZUXDYK2', 'percent', 10, 5, 1, true, NULL, '2026-06-15 06:55:55.612771+00');
INSERT INTO public.coupons VALUES ('57d0c6e4-2392-40d0-ae68-04b05bb25dee', 'TEST-EHWPWGGM', 'fixed', 50000, 5, 1, true, NULL, '2026-06-15 06:55:55.756173+00');
INSERT INTO public.coupons VALUES ('4c847537-3993-4170-b2da-adddbd461635', 'TEST-Z270BBAZ', 'percent', 10, 1, 1, true, NULL, '2026-06-15 06:55:55.77715+00');
INSERT INTO public.coupons VALUES ('1799ba7a-a008-4113-82b8-5997462ac465', 'TEST-4MJYVUIJ', 'percent', 10, 5, 1, true, NULL, '2026-06-15 08:07:41.09763+00');
INSERT INTO public.coupons VALUES ('ffa73e4c-e59e-49c5-bb5f-227eb0a2ae11', 'TEST-X84HQHAC', 'fixed', 50000, 5, 1, true, NULL, '2026-06-15 08:07:41.147517+00');
INSERT INTO public.coupons VALUES ('6245188c-2c42-45f4-a332-0319588251e0', 'TEST-87GTAA1M', 'percent', 10, 1, 1, true, NULL, '2026-06-15 08:07:41.171641+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_menus_001.sql
-- ============================================================
-- Supabase SQL Editor — table: menus  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.menus VALUES ('412cf33f-5dad-4f15-9240-30a9377a6bcd', 'main-menu', '[{"url": "https://cms.ieltspredictiontest.com/", "label": "Home", "order": 1, "children": [], "cssClasses": []}, {"url": "https://ieltspredictiontest.com/ielts-exam-library", "label": "IELTS Online Test", "order": 2, "children": [{"url": "https://ieltspredictiontest.com/ielts-exam-library", "label": "IELTS Full Test", "order": 3}, {"url": "https://ieltspredictiontest.com/ielts-practice-library/reading", "label": "IELTS Reading Practice", "order": 4}, {"url": "https://ieltspredictiontest.com/ielts-practice-library/listening", "label": "IELTS Listening Practice", "order": 5}], "cssClasses": []}, {"url": "#", "label": "IELTS Sample", "order": 6, "children": [{"url": "https://ieltspredictiontest.com/ielts-writing-sample", "label": "IELTS Writing Sample", "order": 7}, {"url": "http://ieltspredictiontest.com/ielts-speaking-sample", "label": "IELTS Speaking Sample", "order": 8}], "cssClasses": []}, {"url": "http://ieltspredictiontest.com/ielts-prediction", "label": "IELTS Prediction", "order": 9, "children": [], "cssClasses": []}]', '2026-03-09 08:02:24.994687+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_site_settings_001.sql
-- ============================================================
-- Supabase SQL Editor — table: site_settings  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.site_settings VALUES ('19b76349-8ff9-46e4-9089-f4eaed9248e4', 'site_description', '"\"\""', '2026-03-09 08:02:24.541169+00');
INSERT INTO public.site_settings VALUES ('a36d2d99-23d4-48ec-a27e-3813de1acf5e', 'site_url', '"\"https://cms.ieltspredictiontest.com\""', '2026-03-09 08:02:24.628985+00');
INSERT INTO public.site_settings VALUES ('af255a4e-9e89-469c-8198-9e4d3ecae65c', 'payment', '{"sepay_bank": "ACB", "sepay_account_name": "TRAN PHAN TIEN PHAT", "sepay_account_number": "2447967", "sepay_webhook_secret": "EAKHTNSZCLWQIEVL1TT5DVWOZ8JYLGHU2WCSMRWDBUDNGVSXPAY4AJZOODR06UBB"}', '2026-04-06 05:30:03.507+00');
INSERT INTO public.site_settings VALUES ('824b5eca-50e0-4e77-8836-99425997d6c3', 'site_title', '"Vit IELTS"', '2026-03-09 08:02:24.326706+00');
INSERT INTO public.site_settings VALUES ('ca19adda-93e6-408f-8b32-cec11e4bf43f', 'general_settings', '{"zalo": "Https://zalo.me/0927090848", "facebook": "https://www.facebook.com/share/1DfpZ5pT2E/?mibextid=wwXIfr", "defaultContentImage": "/img-admin/logo-1775629006777.png"}', '2026-04-08 14:41:17.612+00');
INSERT INTO public.site_settings VALUES ('3e9bdb5f-bb04-46f9-9379-2193b74266c6', 'affiliate_config', '{"commission_rate": 0.1, "min_payout_amount": 100000, "waiting_period_days": 7, "cookie_duration_days": 30, "payout_transfer_prefix": "PAYOUT", "click_velocity_threshold": 100, "click_rate_limit_per_ip_hours": 24}', '2026-05-02 16:00:21.2+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_cms_configs_001.sql
-- ============================================================
-- Supabase SQL Editor — table: cms_configs  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: cms_configs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cms_configs VALUES ('57f5b476-14e9-495d-95c3-595042a1ac6f', 'account/login', '{"backgroundColor": "#FAF7EB"}', '2026-04-05 21:10:27.211957+00');
INSERT INTO public.cms_configs VALUES ('7d087fd2-9deb-413b-b867-50a4e79ecb95', 'home/practice-section', '{"backgroundGradient": "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('e3cea258-da8d-4245-a447-0278d40ae24e', 'ielts-exam-library/hero-banner', '{"title": "IELTS Exam Library", "breadcrumb": {"homeLabel": "Trang chủ", "currentLabel": "IELTS Exam Library"}, "backgroundColor": "#D94A56"}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('ba4f789d-024a-4e53-a040-72f0eb318555', 'sample-essay/banner', '{"writing": {"title": "IELTS Writing Samples", "description": {"line1": "Tham khảo hàng trăm bài mẫu Writing Task 1 & Task 2", "line2": "được chấm chi tiết với band score."}, "backgroundColor": "#D94A56"}, "speaking": {"title": "IELTS Speaking Samples", "description": {"line1": "Tham khảo câu trả lời mẫu cho Part 1, 2, 3", "line2": "với phân tích chi tiết và từ vựng nâng cao."}, "backgroundColor": "#2D3142"}}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('e8bd17c4-5634-4631-9877-ad422644861c', 'privacy-policy', '{"banner": {"title": "Chính sách bảo mật", "subtitle": "Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn", "backgroundImage": ""}, "content": {"sections": [{"title": "1. Thông tin chúng tôi thu thập", "content": "Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký tài khoản, bao gồm tên, email, và thông tin thanh toán."}, {"title": "2. Cách chúng tôi sử dụng thông tin", "content": "Thông tin được sử dụng để cung cấp và cải thiện dịch vụ, xử lý thanh toán, và giao tiếp với bạn."}], "introTitle": "Chính sách bảo mật IELTS Prediction", "introParagraphs": ["Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân."]}, "heroImage": ""}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('37b4562e-4011-49a6-8120-1634e784e9c0', 'subscription/banner', '{"title": "Subscription"}', '2026-04-13 12:51:03.251+00');
INSERT INTO public.cms_configs VALUES ('cb902fd8-6b7d-4776-85d7-ad647a656aae', 'account/register', '{"backgroundColor": "#FAF7EB"}', '2026-04-05 21:10:27.211957+00');
INSERT INTO public.cms_configs VALUES ('05f041a6-da55-498f-8dfa-0b2771e52086', 'footer/cta-banner', '{"title": "Sẵn sàng cho kì thi IELTS máy?", "button": {"link": "/subscription", "text": "Nâng cấp Premium"}, "description": "Đăng ký luyện tập trên giao diện giống phòng thi thật ngay hôm nay!", "backgroundGradient": "linear-gradient(135deg, #D94A56 0%, #E86B75 100%)"}', '2026-04-06 04:33:35.221+00');
INSERT INTO public.cms_configs VALUES ('6ec395b1-5d70-4ec0-ae99-523b0c86da9a', 'header/announcement-bar', '{"items": [{"url": "", "text": "THÔNG BÁO BẢO MẬT - Các bạn có tài khoản Pro vui lòng đổi mật khẩu mới"}, {"url": "", "text": "FORECAST 1.6 - 8.6 Tại Mục Prediction và Mục Sample"}], "enabled": true, "rightLink": {"url": "https://zalo.me/g/edorpy603", "badge": "ZALO", "label": "Nhóm Dự Đoán", "enabled": true}, "textColor": "#ffffff", "settingsIcon": {"url": "", "enabled": false}, "speedSeconds": 120, "backgroundColor": "#cd3d41"}', '2026-06-05 09:36:06.432+00');
INSERT INTO public.cms_configs VALUES ('95819d76-da9e-47c6-b0d9-cd2dc87a1149', 'home/why-choose-us', '{"badge": "Tại sao chọn chúng tôi?", "stats": [{"icon": "/assets/figma/icons/LovedbyStudents.svg", "label": "HỌC VIÊN YÊU THÍCH", "number": "5,000+", "bgColor": "#D94A56"}, {"icon": "/assets/figma/icons/Aim.svg", "label": "HỌC VIÊN ĐẠT AIM", "number": "1,000+", "bgColor": "#219653"}, {"icon": "/assets/figma/icons/Legit.svg", "label": "ĐỀ THI THẬT", "number": "20+", "bgColor": "#5281F9"}, {"icon": "/assets/figma/icons/Goal.svg", "label": "HỌC VIÊN ĐẠT 8.0", "number": "100+", "bgColor": "#FC945A"}], "title": "Luyện thi IELTS Trên Giao Diện Thi Thật", "description": "IPT cung cấp bộ đề thi thật tập trung vào các dạng câu hỏi xuất hiện thường xuyên, chủ đề lặp lại và cấu trúc đề được ghi nhận từ thí sinh thi gần đây, giúp người học luyện tập hiệu quả, tránh học lan man và tiết kiệm thời gian ôn tập."}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('c2d1fca4-24a1-4ba8-a075-9e5c7abe9f32', 'home/hero-banner', '{"cta": {"link": "https://www.ieltspredictiontest.com/ielts-exam-library", "text": "Khám Phá Ngay"}, "title": {"line1": "IELTS Prediction Test", "line2": "Thi", "highlight": "Thử Như Thật"}, "images": {"mascot": "/assets/figma/icons/like 1.png", "screen": "/assets/figma/icons/screen 1.png"}, "subtitle": "Thi thử như thật với giao diện 1:1 và kho đề sát thực tế. Bứt phá band điểm cùng hệ thống giải thích chi tiết.", "checklist": ["Giao diện thi máy", "Cập nhật xu hướng đề", "Chấm chữa chi tiết, tối ưu thời gian"]}', '2026-05-08 10:22:24.583+00');
INSERT INTO public.cms_configs VALUES ('331f7c57-4999-4aa3-845e-09d24a572698', 'home/test-platform-intro', '{"badge": "PREMIUM", "cards": [{"bg": "/assets/figma/icons/Background-1.png", "href": "/ielts-exam-library", "icon": "/assets/figma/icons/book (1) 1.svg", "color": "from-rose-600 to-rose-500", "title": "IELTS Full Test"}, {"bg": "/assets/figma/icons/Background-2.png", "href": "/ielts-practice-library?skill=listening", "icon": "/assets/figma/icons/listen 1.svg", "color": "from-emerald-600 to-emerald-500", "title": "Listening Practice"}, {"bg": "/assets/figma/icons/Background-3.png", "href": "/ielts-practice-library?skill=reading", "icon": "/assets/figma/icons/reading-book 1.svg", "color": "from-orange-600 to-orange-400", "title": "Reading Practice"}, {"bg": "/assets/figma/icons/Background-4.png", "href": "/ielts-writing-sample", "icon": "/assets/figma/icons/copywriting (1) 1.svg", "color": "from-indigo-400 to-indigo-300", "title": "Sample Writing"}, {"bg": "/assets/figma/icons/Background-5.png", "href": "/ielts-speaking-sample", "icon": "/assets/figma/icons/speaking 1.svg", "color": "from-amber-500 to-yellow-400", "title": "Sample Speaking"}, {"bg": "/assets/figma/icons/Background-6.png", "href": "/ielts-prediction", "icon": "/assets/figma/icons/search 1.svg", "color": "from-blue-600 to-blue-500", "title": "IELTS Prediction"}], "title": "Khám Phá Kho Đề", "titleHighlight": "Dự Đoán"}', '2026-05-11 16:55:58.118+00');
INSERT INTO public.cms_configs VALUES ('55e8f2fe-4ab2-42b2-a461-44943c742ed4', 'home/testimonials', '{"cta": {"link": "/subscription", "text": "Xem Thêm Phản Hồi"}, "title": "Phản hồi từ học viên", "reviews": [{"name": "Nguyễn Thị Lan", "score": "IELTS 7.0 | L 8.5 | R 8.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/e05277dd7989c84d2a52f88b8cb6433a-1779445539.jpg", "rating": 5, "review": "Giao diện thi rất giống thi thật, giúp mình làm quen trước ngày thi. Mình đã đạt band 7.0 sau 2 tháng luyện tập liên tục."}, {"name": "Phương Anh Sarah", "score": "IELTS 7.5 | L 8.0 | R 8.5", "avatar": "https://cms.ieltspredictiontest.com/media/images/1040g2jo31tc2p9nime5g5nqr2pgg92c38v2bcpo-1779436970.webp", "rating": 5, "review": "Đề thi sát với cấu trúc thật. Mình thích cách chấm điểm tự động, tiết kiệm rất nhiều thời gian ôn luyện."}, {"name": "Võ Hoàng Ngọc Trân", "score": "IELTS 7.5 | L 8.5 | R 7.5", "avatar": "https://cms.ieltspredictiontest.com/media/images/images--19-1779436151.jfif", "rating": 5, "review": "Trang web này giúp mình tập làm quen với format thi thật. Sau khi luyện đủ 30 bài, mình tự tin hơn hẳn khi thi chính thức."}, {"name": "Bùi Thị Thu", "score": "IELTS 8.5 | L 9.0 | R 8.5", "avatar": "https://cms.ieltspredictiontest.com/media/images/avatar-anh-gai-xinh-k5-12-1779437694.webp", "rating": 5, "review": "Phần Listening rất chuẩn, đúng format. Mình từng mua khóa học bên ngoài nhưng giờ luyện ở đây là đủ rồi."}, {"name": "Lý Thanh Sơn", "score": "IELTS 7.5 | L 7.5 | R 8.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/1040g2jo31hqstmfhjue05p4s0e343obrjbctsio-1779437802.webp", "rating": 5, "review": "Rất hài lòng với chất lượng đề. Hệ thống chấm điểm tức thì giúp mình biết ngay điểm yếu để cải thiện."}, {"name": "Đinh Quốc Tuấn", "score": "IELTS 7.5 | L 8.5 | R 7.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/700e00c3493409190f84e3c7d846af88-1779437974.jpg", "rating": 5, "review": "Platform tốt nhất mình từng dùng để luyện IELTS. Reading và Listening đều rất chất lượng, đề đa dạng."}, {"name": "Lê Quốc Bảo", "score": "IELTS 8.0 | L 8.0 | R 9.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/5fcc79716ad80bdc008774de9986ef1f-1779438263.jpg", "rating": 5, "review": "Mình luyện tập mỗi ngày với bộ đề ở đây. Sau 3 tháng đã tăng từ 5.5 lên 6.0, rất hài lòng với kết quả."}, {"name": "Ngô Thị Mai", "score": "IELTS 8.5 | L 7.5 | R 8.5", "avatar": "https://cms.ieltspredictiontest.com/media/images/ea8a279ed6d038da54c2bc61db67f131-1779438331.jpg", "rating": 5, "review": "Giao diện rất thân thiện và chuyên nghiệp. Đề thi bám sát thực tế và cập nhật thường xuyên."}, {"name": "Đinh Văn Khoa", "score": "IELTS 7.5 | L 8.5 | R 7.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/d1fe54e0d64cd11fd80a401433942550-1779438584.jpg", "rating": 5, "review": "Trải nghiệm thi thử rất mượt mà, không khác gì thi thật. Mình đã tăng 1.0 band chỉ sau 2 tháng luyện đề đây."}, {"name": "Vương Thị Liên", "score": "IELTS 7.0 | L 7.0 | R 7.5", "avatar": "https://cms.ieltspredictiontest.com/media/images/1dcb39a82d100c8a0d310ffd17ce4d7e-1779438539.jpg", "rating": 5, "review": "Bộ đề phong phú, giải thích chi tiết. Mình đặc biệt thích tính năng xem lại lỗi sai sau mỗi bài thi."}, {"name": "Đặng Thu Hương", "score": "IELTS 8.0 | L 8.0 | R 7.5", "avatar": "https://cms.ieltspredictiontest.com/media/images/0a93db068358f68557e28bb43db9d906-1779438640.jpg", "rating": 5, "review": "Hệ thống giao diện máy tính rất mượt, đúng với format thi thật. Đặc biệt phần Listening rất chuẩn."}, {"name": "Vũ Thế Dũng", "score": "IELTS 8.0 | L 9.0 | R 9.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/1bd9f912c669b411d1c8cd34c29957b2-1779438680.jpg", "rating": 5, "review": "Luyện đề trên này giúp mình quen với áp lực thời gian. Kết quả thi thật tốt hơn mình mong đợi."}, {"name": "Trịnh Thị Ngọc", "score": "IELTS 8.0 | L 7.5 | R 8.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/a89d9990ff302ad2e5686d7d4ae030e4-1779438716.jpg", "rating": 5, "review": "Mình đã thử nhiều nền tảng luyện IELTS khác nhau. Đây là nơi có đề sát thực nhất và interface đẹp nhất."}, {"name": "Cao Minh Nhật", "score": "IELTS 8.0 | L 7.0 | R 8.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/202770e205ea25d77a7395199ba34162-1779438746.jpg", "rating": 5, "review": "Chất lượng đề thi cao, cập nhật liên tục. Mình học Read và Listen ở đây là chủ yếu và thấy hiệu quả rõ rệt."}, {"name": "Phan Thị Hải", "score": "IELTS 7.5 | L 8.0 | R 7.0", "avatar": "https://cms.ieltspredictiontest.com/media/images/00c3953a03b8252d39f7c0e15d44bc3f-1779438779.jpg", "rating": 5, "review": "Sau khi dùng nền tảng này 3 tháng, mình đạt 7.5 thật sự bất ngờ. Phần thi thật không khác gì luyện ở đây."}], "description": "Trải nghiệm thực tế từ học viên đã luyện đề sát cấu trúc thi thật và làm quen giao diện thi máy trước ngày thi."}', '2026-06-01 04:46:35.985+00');
INSERT INTO public.cms_configs VALUES ('dbb37989-fbc6-4631-9321-85aefc532635', 'ielts-practice-library/banner', '{"reading": {"title": "IELTS Reading Practice", "button": {"link": "/ielts-practice-library?skill=reading", "text": "Bắt đầu luyện tập"}, "description": {"line1": "Luyện tập IELTS Reading với hàng trăm bài tập", "line2": "từ Academic đến General Training.", "line3": ""}, "backgroundColor": "#2D3142"}, "listening": {"title": "IELTS Listening Practice", "button": {"link": "/ielts-practice-library?skill=listening", "text": "Bắt đầu luyện tập"}, "description": {"line1": "Luyện tập IELTS Listening với hàng trăm bài tập", "line2": "từ dễ đến khó, sát đề thi thật nhất.", "line3": ""}, "backgroundColor": "#D94A56"}}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('fe5fe14b-4f1c-44f0-ac76-79a5de552f12', 'terms-of-use', '{"banner": {"title": "Điều khoản sử dụng", "subtitle": "Vui lòng đọc kỹ trước khi sử dụng dịch vụ", "backgroundImage": ""}, "content": {"sections": [{"title": "1. Chấp nhận điều khoản", "content": "Bằng việc truy cập và sử dụng website, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này."}, {"title": "2. Tài khoản người dùng", "content": "Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình. Mọi hoạt động trên tài khoản là trách nhiệm của bạn."}], "introTitle": "Điều khoản sử dụng IELTS Prediction", "introParagraphs": ["Chào mừng bạn đến với IELTS Prediction. Bằng việc sử dụng dịch vụ, bạn đồng ý với các điều khoản sau."]}, "heroImage": ""}', '2026-04-06 04:08:42.538633+00');
INSERT INTO public.cms_configs VALUES ('c45bce6a-a02b-4a13-ba11-f6a74bee2183', 'contact', '{"form": {"nameLabel": "Your name", "buttonText": "Send message", "emailLabel": "Your email address", "errorMessage": "Something went wrong", "messageLabel": "Message", "subjectLabel": "Subject", "successMessage": "Thank you for your message! We will get back to you soon.", "namePlaceholder": "Name", "emailPlaceholder": "Email", "messagePlaceholder": "Message", "subjectPlaceholder": "Subject"}, "banner": {"title": "Contact", "backgroundImage": ""}, "socialLinks": [{"url": "https://www.facebook.com/groups/ielts.practice", "label": "Facebook Group", "iconUrl": "/img-admin/social/facebook.svg", "platform": "facebook", "username": "@ielts.practice"}, {"url": "https://tiktok.com/@ielts.practice", "label": "TikTok", "iconUrl": "/img-admin/social/tiktok.svg", "platform": "tiktok", "username": "@ielts.practice"}, {"url": "https://tiktok.com/@ielts.practice", "label": "YouTube", "iconUrl": "/img-admin/social/youtube.svg", "platform": "youtube", "username": "@ielts.practice"}, {"url": "https://tiktok.com/@ielts.practice", "label": "Zalo", "iconUrl": "/img-admin/social/zalo.svg", "platform": "zalo", "username": "@ielts.practice"}]}', '2026-04-08 14:04:50.052+00');
INSERT INTO public.cms_configs VALUES ('dcaefbc8-1d5a-4a5e-9e8f-83e56f23c628', 'subscription/faq', '{"badge": {"text": "FAQ"}, "items": [{"answer": "Có! Bạn có thể dùng thử miễn phí với bộ CAM sau đó quyết định đăng ký để luyện kho đề Premium", "question": "Tôi có thể dùng thử miễn phí không?"}, {"answer": "Các đề thi trên web đều là đề thi thật, có tỉ lệ cao ra lại dựa trên phản hồi từ thí sinh thi gần đây.\nMục tiêu là giúp học viên làm quen dạng bài, làm trước các đề tại nhà, cách hỏi và giao diện thi máy trước ngày thi.", "question": "Đề luyện có giống đề thi thật không?"}, {"answer": "Bạn nên làm phần Full Test từ đề mới nhất trở về để bám sát xu hướng ra đề", "question": "Tôi nên làm đề nào trước?"}, {"answer": "Tài khoản Premium cho phép bạn:\n- Truy cập đầy đủ đề luyện và đề dự đoán\n- Luyện không giới hạn lượt làm bài\n- Cập nhật đề mới theo xu hướng thi thật\nPhù hợp cho học viên đang chuẩn bị thi trong thời gian ngắn 1-4 tháng.", "question": "Gói Premium khác gì so với tài khoản thường?"}, {"answer": "Chọn gói 1-2 tháng nếu bạn sắp thi\nChọn gói 4 tháng để được tặng thêm bản PDF và ôn tập trong 1 Quý\n", "question": "Tôi nên bắt đầu với gói mấy tháng"}], "title": "Câu hỏi thường gặp", "description": "Giải đáp nhanh những câu hỏi phổ biến về cách luyện đề, gói Premium và hình thức thi máy."}', '2026-04-13 14:20:17.238+00');
INSERT INTO public.cms_configs VALUES ('91e771c6-1d6b-4bd9-9f39-62975d4e44c7', 'seo/global', '{"ogImage": "", "siteTitle": "IELTS Prediction — Luyện thi IELTS Online", "titleSuffix": "IELTS PREDICTION TEST"}', '2026-05-02 11:33:50.319+00');
INSERT INTO public.cms_configs VALUES ('dc2ef372-88cb-48a6-9048-33989ead6322', 'email-template', '{"brand": {"name": "IELTS Prediction Test", "email": "ieltsprediction9@gmail.com", "phone": "0927090848", "address": "", "logoUrl": "", "website": "https://ieltspredictiontest.com"}, "style": {"textColor": "#333333", "bodyBgColor": "#f4f6f8", "primaryColor": "#D94A56", "footerBgColor": "#2D3142", "headerBgColor": "#D94A56", "contentBgColor": "#ffffff", "footerTextColor": "#ffffff", "headerBgGradient": "linear-gradient(135deg, #D94A56 0%, #c62828 100%)"}, "adminNotification": {"subject": "[Admin] Thanh toán thành công - Đơn hàng {{orderId}}", "bodyHtml": "Xác nhận đơn hàng thanh toán thành công!", "headerTitle": "Thông báo đơn hàng mới"}, "orderConfirmation": {"subject": "Thanh toán thành công - Đơn hàng {{orderId}}", "bodyHtml": "Chúc mừng bạn! Đơn hàng của bạn đã được xử lý hoàn tất. \n\nTài khoản <strong>Pro</strong> của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập và bắt đầu làm bài dự đoán ngay.", "greeting": "Xin chào {{customerName}},", "ctaButton": {"link": "https://ieltspredictiontest.com", "text": "Bắt đầu học ngay"}, "footerText": "Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email hoặc số điện thoại bên dưới.", "closingHtml": "Hãy nhắn qua <a href=\"https://zalo.me/0927090848\" style=\"color: #0068FF; font-weight: bold;\">Zalo 0927090848</a> để nhận trọn bộ tài liệu Writing và Speaking\n\n<i>Nếu cần hỗ trợ thêm bất cứ điều gì trong quá trình sử dụng, bạn cứ nhắn qua Zalo Nhé</i>\n<i>Chúc bạn ôn luyện thật tốt!</i>", "headerTitle": "[IELTS Prediction] Tài khoản Pro của bạn đã sẵn sàng để sử dụng!", "orderTableTitle": "Tóm tắt đơn hàng"}}', '2026-04-13 15:51:40.149+00');
INSERT INTO public.cms_configs VALUES ('f5b81502-5e6b-4528-a2ee-a2ebf3e238be', 'library/mock-collections-order', '{"collection_ids": ["bbaf6f63-9175-480e-a20f-90dade47976e", "01601985-5d9d-4742-8a10-ea8dd3d02d1d", "443c48a8-e946-42f2-b85d-9cd2604c0629", "31984f09-73b0-4368-9aa5-8844844cf8a6", "9845e68b-2a0c-4ab7-b862-d8103d6f30b4", "bf2c0991-e988-4313-8395-48d1b3999652", "5561294a-d9ec-46ac-ad96-baffb4a06bc4", "eecb1f3e-3c93-4da8-8ce2-0670a0ca73d2"]}', '2026-05-27 05:06:00.085+00');
INSERT INTO public.cms_configs VALUES ('bf5de30a-8003-4f92-9de6-e9cf61f6aa46', 'home/mock-collections', '{"collection_ids": ["31984f09-73b0-4368-9aa5-8844844cf8a6", "9845e68b-2a0c-4ab7-b862-d8103d6f30b4", "bf2c0991-e988-4313-8395-48d1b3999652", "bbaf6f63-9175-480e-a20f-90dade47976e", "65ddcca3-5abe-4a79-a675-d8cde919f7ff"]}', '2026-06-12 04:18:35.916+00');
INSERT INTO public.cms_configs VALUES ('c1bd164f-f53f-43dd-bb54-bdc4aacd4f4b', 'subscription/course-packages', '{"combo": {"plans": [{"name": "Standard Plan", "price": 200000, "months": 1, "popular": false, "dealNote": "Best starter choice", "featuredDeal": true}, {"name": "Standard Plan", "price": 400000, "months": 2, "popular": true}, {"name": "Standard Plan", "price": 600000, "months": 3, "popular": true}, {"name": "Standard Plan", "price": 800000, "months": 4}, {"name": "Standard Plan", "price": 1000000, "months": 5}, {"name": "Premium Plan", "price": 1000000, "months": 6, "dealNote": "Giảm 200.000đ", "featuredDeal": true, "originalPrice": 1200000}, {"name": "Standard Plan", "price": 1400000, "months": 7}, {"name": "Standard Plan", "price": 1600000, "months": 8}, {"name": "Standard Plan", "price": 1800000, "months": 9}, {"name": "Standard Plan", "price": 2000000, "months": 10}, {"name": "Standard Plan", "price": 2200000, "months": 11}, {"name": "Premium Plan", "price": 1800000, "months": 12, "dealNote": "Giảm 600.000đ", "featuredDeal": true, "originalPrice": 2400000}], "title": "Combo Plan", "ctaText": "Đăng ký ngay", "basePrice": 200000, "monthlyIncrementPrice": 100000}, "single": {"plans": [{"name": "Single Pack", "price": 200000, "months": 2, "popular": false, "dealNote": "Best starter choice", "featuredDeal": true}, {"name": "Single Pack", "price": 300000, "months": 3, "popular": false, "dealNote": "", "featuredDeal": false}, {"name": "Single Pack", "price": 400000, "months": 4}, {"name": "Single Pack", "price": 500000, "months": 5}, {"name": "Single Pack", "price": 500000, "months": 6, "popular": true, "dealNote": "Giảm 100.000đ", "featuredDeal": true, "originalPrice": 600000}, {"name": "Single Pack", "price": 700000, "months": 7}, {"name": "Single Pack", "price": 800000, "months": 8}, {"name": "Single Pack", "price": 900000, "months": 9}, {"name": "Single Pack", "price": 1000000, "months": 10}, {"name": "Single Pack", "price": 1100000, "months": 11}, {"name": "Single Pack", "price": 900000, "months": 12, "popular": false, "dealNote": "Giảm 300.000đ", "featuredDeal": true, "originalPrice": 1200000}], "title": "Single Package", "skills": ["listening", "reading"], "ctaText": "Đăng ký ngay", "basePrice": 129000, "monthlyIncrementPrice": 80000}, "features": {"excluded": [], "included": ["Truy cập không giới hạn kho đề", "Giải thích đáp án chi tiết", "Cập nhật dự đoán W/S hàng tuần", "Giao diện mô phỏng thi máy tại nhà"]}, "monthText": {"plural": "tháng", "singular": "tháng"}, "accessText": "Truy cập", "priceSuffix": "/Tài Khoản", "skillLabels": {"reading": "Reading", "listening": "Listening"}, "currencySuffix": "đ", "dealNoteTemplate": "Tiết kiệm {percent}%", "popularBadgeText": "Phổ biến nhất"}', '2026-06-15 06:19:24.977+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_mock_test_collections_001.sql
-- ============================================================
-- Supabase SQL Editor — table: mock_test_collections  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: mock_test_collections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.mock_test_collections VALUES ('bbaf6f63-9175-480e-a20f-90dade47976e', 'Free Test', 'free-test', '{bf4220e8-66fd-41fd-8f13-3dcd3fb8eaf4}', NULL, '2026-03-09 08:03:15.139735+00');
INSERT INTO public.mock_test_collections VALUES ('eecb1f3e-3c93-4da8-8ce2-0670a0ca73d2', 'Cấp Tốc LR', 'cap-toc-lr-caxdr', '{30b52fdc-b2f0-4e5c-bf6a-f2841ed80e8d}', NULL, '2026-05-03 05:38:25.97397+00');
INSERT INTO public.mock_test_collections VALUES ('9845e68b-2a0c-4ab7-b862-d8103d6f30b4', 'IELTS General', 'ielts-general-y4frh', '{60894701-1caa-4788-86ad-1641517cd162}', NULL, '2026-05-04 08:37:00.896363+00');
INSERT INTO public.mock_test_collections VALUES ('bf2c0991-e988-4313-8395-48d1b3999652', 'IELTS 20', 'ielts-20-2025', '{3817e265-8bd3-4a77-bf18-fd8ccdb012be,004632ca-eb52-45c8-97b4-52dca44ac779}', NULL, '2026-03-09 08:03:15.541514+00');
INSERT INTO public.mock_test_collections VALUES ('01601985-5d9d-4742-8a10-ea8dd3d02d1d', '[Q2] Bộ Đề Thi Máy 2026 (Test 41-50)', 'com-quy-2-2026-test-41-50-hsbxu', '{43562451-3fe7-4377-bf88-e710e5933041}', NULL, '2026-05-03 08:11:56.070012+00');
INSERT INTO public.mock_test_collections VALUES ('31984f09-73b0-4368-9aa5-8844844cf8a6', '[Q2] Bộ Đề Thi Máy 2026 (Test 1-20)', 'com-quy-2-2025', '{99ae883c-fd2a-47e3-af5c-013581bf36a5}', NULL, '2026-03-09 08:03:15.443375+00');
INSERT INTO public.mock_test_collections VALUES ('443c48a8-e946-42f2-b85d-9cd2604c0629', '[Q2] Bộ Đề Thi Máy 2026 (Test 21-40)', 'com-quy-2-2026-test-21-40', '{ac77f66d-d707-4fff-882d-8d787203c461}', NULL, '2026-03-09 08:03:15.344742+00');
INSERT INTO public.mock_test_collections VALUES ('5561294a-d9ec-46ac-ad96-baffb4a06bc4', 'IELTS 19', 'ielts-19-evrsv', '{8b0841a8-73e3-4d00-9f85-1749eb5163e3,06f19135-46aa-4178-9d31-1d53e973c9b6}', NULL, '2026-05-08 04:25:00.958464+00');
INSERT INTO public.mock_test_collections VALUES ('65ddcca3-5abe-4a79-a675-d8cde919f7ff', 'Demo', 'demo-dfxvz', '{af565770-1021-4ba8-8620-06f9c86c8a89}', NULL, '2026-06-02 08:24:25.03064+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_mock_tests_001.sql
-- ============================================================
-- Supabase SQL Editor — table: mock_tests  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: mock_tests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.mock_tests VALUES ('004632ca-eb52-45c8-97b4-52dca44ac779', 'IELTS 20', 'ielts-20-hwgal', '[{"reading_test_id": "3aed7b7e-0623-45e1-bdf3-88f9b1c75c3f", "listening_test_id": "6c6ce9cd-080a-4eeb-8829-889311ac0fa6"}, {"reading_test_id": "e9efbf95-4fda-41aa-bfee-4d85ff7238d6", "listening_test_id": "86dac034-c6ad-47fe-b62c-a5648af3a1b7"}, {"reading_test_id": "35221124-6bca-4745-b5f8-84ab785f7fa9", "listening_test_id": "daff38f7-db32-4cf0-9fe8-ad055f8a2218"}, {"reading_test_id": "7951d1fd-7138-47c2-a3eb-517d3de25766", "listening_test_id": "d8057839-7456-4580-8bba-b10215eadaf2"}]', '2026-04-25 15:29:40.390027+00');
INSERT INTO public.mock_tests VALUES ('30b52fdc-b2f0-4e5c-bf6a-f2841ed80e8d', 'Cấp Tốc LR', 'cap-toc-lr-cao45', '[{"reading_test_id": "dc4be641-cd57-4495-822b-6efd234f6520", "listening_test_id": "c9f9f7ee-54e3-47f6-95b1-2a50f525e71c"}, {"reading_test_id": "ea44819e-475d-4d7d-b447-51eb03a4833e", "listening_test_id": "92b62632-1b19-41a6-b16c-223bfd51347e"}]', '2026-05-03 05:38:13.963442+00');
INSERT INTO public.mock_tests VALUES ('bf4220e8-66fd-41fd-8f13-3dcd3fb8eaf4', 'Free Test', 'free-test', '[{"reading_test_id": "4238eea9-9dd0-4f43-be6d-c269a7f25a02", "listening_test_id": "d25ebdf5-1b0a-45a0-92e1-c43ceb1a99e0"}, {"reading_test_id": "4e0c8180-428c-4c81-8de5-85613e8dea80", "listening_test_id": null}, {"reading_test_id": "981f85fd-9319-45a5-a089-1f2e29d3b873", "listening_test_id": "387d80e9-eee6-4b7e-b11e-ddc73abd4013"}, {"reading_test_id": "29b4f24d-ba1d-41d8-a4b3-05108c273dd1", "listening_test_id": ""}, {"reading_test_id": "162f8fda-3b05-4c0d-83f3-cca1d125c98a", "listening_test_id": ""}]', '2026-03-08 18:30:13.148326+00');
INSERT INTO public.mock_tests VALUES ('43562451-3fe7-4377-bf88-e710e5933041', '[PREMIUM] Bộ Đề Thi Máy 2026 (Test 41-50)', 'com-quy-2-2026-test-41-50-htv9v', '[{"reading_test_id": "41976fe3-743d-4272-a986-ca388cd62597", "listening_test_id": ""}, {"reading_test_id": "5070fe96-a2fd-493b-8b9a-76598328b018", "listening_test_id": ""}, {"reading_test_id": "63240d9d-3320-4f91-8ceb-003624e07073", "listening_test_id": ""}, {"reading_test_id": "4402ffa3-f698-4d26-a109-6b89115b9bb2", "listening_test_id": ""}, {"reading_test_id": "aa989af9-8657-40ae-a7e2-0b6b8af95610", "listening_test_id": ""}, {"reading_test_id": "52e66a5a-0418-46fa-b005-1163aace2446", "listening_test_id": ""}, {"reading_test_id": "e54b083f-a65c-4ace-a015-1fbda445c039", "listening_test_id": ""}, {"reading_test_id": "943c7674-a12d-4db7-a0f2-05cf38826af3", "listening_test_id": ""}, {"reading_test_id": "f7277a09-c09d-499a-a4ce-c92a836b8670", "listening_test_id": ""}, {"reading_test_id": "de60963b-5230-42f2-9555-790fe42b6ec0", "listening_test_id": ""}]', '2026-05-03 08:13:07.763992+00');
INSERT INTO public.mock_tests VALUES ('60894701-1caa-4788-86ad-1641517cd162', 'IELTS General', 'ielts-general-vgtqs', '[{"reading_test_id": "0393fdc7-79f5-4b95-8725-490db87701fd", "listening_test_id": ""}, {"reading_test_id": "aebbbb4a-dcc6-4744-8b6b-b58447fa07f7", "listening_test_id": ""}, {"reading_test_id": "764d0b7f-e99b-4c5f-9c78-b07f781553f1", "listening_test_id": ""}, {"reading_test_id": "ddaab14a-51c7-40b1-98a4-c2ee780dceea", "listening_test_id": ""}, {"reading_test_id": "fa14671c-1676-434a-a03e-3687f6b7b6ff", "listening_test_id": ""}, {"reading_test_id": "584d83a4-41c1-4164-9e48-090934f47eae", "listening_test_id": ""}, {"reading_test_id": "3871d8e4-a276-4e83-badc-6db3e96253fd", "listening_test_id": ""}, {"reading_test_id": "575f649d-0ade-46bb-af4e-0d34959bd065", "listening_test_id": ""}, {"reading_test_id": "5e825b2f-4e45-4ded-8285-1015d0d9ac09", "listening_test_id": ""}, {"reading_test_id": "2d4954d4-5003-4742-b28b-b7cd48a4f470", "listening_test_id": ""}, {"reading_test_id": "9129ee0c-7348-4c67-b4b1-8bc9f64f6945", "listening_test_id": ""}, {"reading_test_id": "ada6d966-ba0b-4965-98e8-0b7e76ca087f", "listening_test_id": ""}, {"reading_test_id": "bc70de9f-4b77-4e1b-9400-6a40341bf4a1", "listening_test_id": ""}, {"reading_test_id": "52b9b18b-f630-4d27-a7ed-0a3fcb1e4ebd", "listening_test_id": ""}, {"reading_test_id": "b8c5ad60-ed10-43e0-97c4-917fff8c11a1", "listening_test_id": ""}]', '2026-05-04 07:22:40.065641+00');
INSERT INTO public.mock_tests VALUES ('06f19135-46aa-4178-9d31-1d53e973c9b6', 'IELTS 19', 'ielts-19-ew8vd', '[{"reading_test_id": "92f69ba8-2c9a-4292-8d96-ae5501ec14f5", "listening_test_id": "c76b1a21-1829-413a-a2d4-2bc64c5bc76a"}, {"reading_test_id": "a8fca516-8803-4eda-a74c-f507411eb4f6", "listening_test_id": "10143d9c-d339-4996-9b5e-4b3976d90d0f"}, {"reading_test_id": "ed092694-c462-4874-a1dd-96cf20cee8eb", "listening_test_id": "df8dca0a-b8f6-4427-a76a-a71f8f327e2f"}, {"reading_test_id": "4eb555fa-52a1-4d3f-83c7-848691bf88dc", "listening_test_id": "129649ac-59dd-4731-8615-0b55c6fd27cd"}]', '2026-05-08 04:25:23.084397+00');
INSERT INTO public.mock_tests VALUES ('3817e265-8bd3-4a77-bf18-fd8ccdb012be', 'General 20', 'general-20-es2qw', '[{"reading_test_id": "3cc9c013-da0c-4da4-9a5c-492589d20bf6", "listening_test_id": "23cc21ba-665f-4e98-82f9-5de9414bfb2c"}, {"reading_test_id": "e823ded9-d20f-426e-b238-c021ca1e56cd", "listening_test_id": "7a6b4092-6574-4579-8113-ac7cb87b54c6"}, {"reading_test_id": "81a9baf5-a54a-41a7-b3f1-3d2352430068", "listening_test_id": "809329b9-d2c3-4a9a-a376-da4a7d47def6"}, {"reading_test_id": "b6bc4abf-646a-4697-bb81-0390c92eb882", "listening_test_id": "3b851239-095e-408c-a8fe-c0820ced0119"}]', '2026-05-08 04:22:08.521993+00');
INSERT INTO public.mock_tests VALUES ('99ae883c-fd2a-47e3-af5c-013581bf36a5', '[Q2] Bộ Đề Thi Máy 2026 (Test 1-20)', 'com-quy-2-2025', '[{"reading_test_id": "884bcf61-f22e-49dd-8578-c5f53b6342a3", "listening_test_id": "2e01d2e9-f49f-41a3-a3bd-c9dfed837a40"}, {"reading_test_id": "6dc750f3-2a38-44b2-8771-331d7bd07c55", "listening_test_id": "ffe1ef2d-2063-421a-90e3-33aa92ef8910"}, {"reading_test_id": "8759290f-1982-4395-ad8b-16ffb59a5cd3", "listening_test_id": "27530ce9-a712-4a39-8c1c-9180fb9b86b8"}, {"reading_test_id": "5a53bbc1-17ae-4827-bb68-730ae538df12", "listening_test_id": "07036b6c-3ab5-45af-8c97-e5dab1d41f22"}, {"reading_test_id": "1aa276a8-172d-4dd2-beb8-6f187a260b70", "listening_test_id": "ba3f22e1-c227-4507-b43b-8e5f3aa87551"}, {"reading_test_id": "50ad5302-626e-4e47-9eab-7939449323c3", "listening_test_id": "b5d6dacc-309e-4048-995c-d05fa35c4ce0"}, {"reading_test_id": "5b337916-1e1c-4ca7-beef-9ef1e993d3c7", "listening_test_id": "c9dcc83f-fb8a-4b67-a987-5e3491146cab"}, {"reading_test_id": "a61dc410-7f28-4423-8338-8775df891803", "listening_test_id": "a421cdc5-d23c-4515-bea0-0588da4bffc8"}, {"reading_test_id": "9edf045a-9f37-4114-a9b8-3a80a70dd93a", "listening_test_id": "c1ae9ccd-1a2e-415e-8d63-9c89a6fa29d6"}, {"reading_test_id": "de08e021-1621-4056-a2ad-85409c3f2790", "listening_test_id": "64ce4617-0c88-49c5-812c-4f157968499e"}, {"reading_test_id": "f2cf0845-4d20-473e-b760-41146b8e749a", "listening_test_id": "3436a3ad-920b-4ab0-9cde-8450154062ea"}, {"reading_test_id": "d92381d8-fef5-4ef2-b9b9-913b3a73e697", "listening_test_id": "9b3d543d-5766-495f-ad6a-c9fc21beeba8"}, {"reading_test_id": "2f331710-00b3-4dcb-a954-bfce6ad9b676", "listening_test_id": "4a92e427-6015-4eea-a6bf-cbd277e00d13"}, {"reading_test_id": "4226c521-d947-49e4-8d93-cde445b4d3da", "listening_test_id": "efae2d19-ec15-411c-badb-c1098d167ca4"}, {"reading_test_id": "6714c284-2e92-4706-b49d-0b60d6b83332", "listening_test_id": "0a67771a-182e-4b7a-a43a-b56d4b3140b2"}, {"reading_test_id": "1e83b044-4c1b-4409-b441-6a71033ff76f", "listening_test_id": "5acb1589-6a47-42b9-b020-dbf21fdb1acb"}, {"reading_test_id": "1465af59-1ee5-43c5-8999-b67805e05423", "listening_test_id": "057814c5-9ba0-4b41-950d-ec52933dcd2b"}, {"reading_test_id": "21e527cb-d06f-496d-9675-4a2130c32127", "listening_test_id": "cb132fec-9ca9-471b-9557-3c7b66722365"}, {"reading_test_id": "6df0511f-a959-4110-8dad-d3712d537b9a", "listening_test_id": "f083870a-266f-46b4-9548-b06aa1d63e20"}, {"reading_test_id": "83897dcd-da99-45d5-8b55-8a0fa550aa09", "listening_test_id": "5182d95c-a3ac-4eee-b982-86f5e5591f9b"}, {"reading_test_id": "981f85fd-9319-45a5-a089-1f2e29d3b873", "listening_test_id": ""}]', '2026-03-08 18:30:13.231465+00');
INSERT INTO public.mock_tests VALUES ('ac77f66d-d707-4fff-882d-8d787203c461', '[PREMIUM] Bộ Đề Thi Máy 2026 (Test 21-40)', 'com-quy-1-2026-test-21-40', '[{"reading_test_id": "8d28ee48-c2c8-43a5-9eb7-4e090f12482c", "listening_test_id": "6261d6ac-ab9e-4ee1-898f-955ff4476012"}, {"reading_test_id": "04631407-5c01-46b0-977e-9ac3a7935fa7", "listening_test_id": "1e168178-0e82-477e-8c57-62ea88feb0e1"}, {"reading_test_id": "1a007400-b83c-4a86-9449-188c55126673", "listening_test_id": "3e3dcd3c-b01a-4143-9b1e-d0b66b777238"}, {"reading_test_id": "31b26303-bfe5-4a5f-b94b-56f08c429e59", "listening_test_id": "3329f3c4-628b-4989-b3a7-a4795041a92f"}, {"reading_test_id": "ab6ebe2a-4c6c-4750-80a3-f82a17dfc5cc", "listening_test_id": "5f876c15-fb86-4765-93f5-eb73a3701013"}, {"reading_test_id": "2a5e7a71-4538-4956-a6d7-8638ac2e4c36", "listening_test_id": "bc3982b8-0735-4e3d-b454-caf86dda9237"}, {"reading_test_id": "38698976-f89a-48d9-b297-64e76a78cae5", "listening_test_id": "61ce4bb6-fd91-445d-bdd7-3f69289106f2"}, {"reading_test_id": "6770dbcf-e7b2-4762-8f44-401efa4dc26f", "listening_test_id": "f558eb64-c27c-4e1a-9031-266ead70f8ce"}, {"reading_test_id": "a28522ee-5289-4449-b732-22c0c08706df", "listening_test_id": "33d314ad-02ea-44cc-88a4-66117b9f6704"}, {"reading_test_id": "d545cc33-56fd-491c-805b-7b67aa661796", "listening_test_id": "7168c38f-ac0e-400a-a824-dafe34590a8e"}, {"reading_test_id": "547e8173-b3a3-4dee-95a9-87e65fb162bf", "listening_test_id": "14cc3fbf-f95b-4b1d-9516-179932c7e411"}, {"reading_test_id": "b2881d43-2e8f-4b80-80df-d11a66baa68f", "listening_test_id": "273df71c-d9c9-44e4-9053-fe6d0cba2b4f"}, {"reading_test_id": "72a81993-a0bd-42cf-a7d4-c7d6d192b236", "listening_test_id": "3375b249-016d-4c1e-85f2-8b900d23781c"}, {"reading_test_id": "9ebdbb5c-c37b-49a0-bf7f-caf93e856cf9", "listening_test_id": "da69515f-c9a8-4c16-a3e7-83a397dcba40"}, {"reading_test_id": "5fb1a0a1-7aac-47dd-9abc-919a7ed4ed65", "listening_test_id": "ec7c340b-6871-4d4b-baed-d8e329662b5b"}, {"reading_test_id": "4ed6c010-07ac-4771-ad11-a06bd0e490de", "listening_test_id": "714b8527-a0b9-4cee-8467-cb96f48be534"}, {"reading_test_id": "54119246-a47e-463d-9f3a-23797044a2d5", "listening_test_id": "87af006e-fb8e-4f3c-9cd8-1971fcc9fdbd"}, {"reading_test_id": "3e4c3983-d5cc-4710-8110-22d54c0d27fe", "listening_test_id": "3ec41d37-a7fa-4fff-b608-b7f45e54cc6e"}, {"reading_test_id": "8376eda5-479e-4ce9-b25e-c7b4eed75185", "listening_test_id": "6a1f3d6a-2233-42de-a338-4d230f2f303f"}, {"reading_test_id": "98b4950c-aff0-47c3-803b-59d58a8ba082", "listening_test_id": "94989d0c-b32e-4b87-896f-d863a2b1b597"}]', '2026-03-08 18:30:12.940134+00');
INSERT INTO public.mock_tests VALUES ('8b0841a8-73e3-4d00-9f85-1749eb5163e3', 'IELTS 19', 'ielts-19-len2f', '[{"reading_test_id": "461e652d-660a-4eec-9f14-19847df03789", "listening_test_id": "2a7ac681-4bcc-4f32-b3b5-fe0db4d96e99"}, {"reading_test_id": "d3171d5b-a8a1-41f4-b9ec-2deab02ad8d6", "listening_test_id": "56811ee2-ba05-4485-bc53-093e5681a799"}, {"reading_test_id": "f0edb2b5-4642-402a-9b38-83bdf5ded63c", "listening_test_id": "59e47f6a-22a3-415d-a785-6a93226ad588"}, {"reading_test_id": "db5b1298-40f3-4219-bcdf-38b84c2ef8a8", "listening_test_id": "1c77d32c-6e23-4c64-ad13-f2eee3800d64"}]', '2026-05-27 04:57:25.779998+00');
INSERT INTO public.mock_tests VALUES ('af565770-1021-4ba8-8620-06f9c86c8a89', 'Demo', 'demo-dfckt', '[{"reading_test_id": "40070e9d-a12e-4b55-a639-f0207ed253a0", "listening_test_id": ""}, {"reading_test_id": "6bc47692-0262-489e-a198-c8da0486a109", "listening_test_id": ""}, {"reading_test_id": "ae73c8f7-4464-400e-ab4e-e3df86275a6b", "listening_test_id": ""}, {"reading_test_id": "80d2daf7-7c2b-42f4-90d4-5a792add9d37", "listening_test_id": ""}, {"reading_test_id": "da9287ed-aa9a-4530-8a03-94d6fbccbf45", "listening_test_id": ""}, {"reading_test_id": "5d1b14b3-63c5-4447-9e42-3daf4f1190a2", "listening_test_id": ""}, {"reading_test_id": "456216d0-cf0d-44b5-a570-410b7a0fb079", "listening_test_id": ""}, {"reading_test_id": "e41386b2-18a0-4dcf-be22-a07c0f069ee0", "listening_test_id": ""}, {"reading_test_id": "de0a6986-f357-4b76-95a6-4dd36439349b", "listening_test_id": ""}]', '2026-06-02 08:23:57.433677+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_media_library_001.sql
-- ============================================================
-- Supabase SQL Editor — table: media_library  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: media_library; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.media_library VALUES ('96f3b4de-238f-4a05-aec2-2e4a1b041ec0', 'https://cms.ieltspredictiontest.com/media/audio/test-31-1776413180.mp3', 'test-31-1776413180.mp3', 'audio/mpeg', 43349104, NULL, '2026-04-17 08:24:33.683588+00');
INSERT INTO public.media_library VALUES ('ed1a29bc-7bec-4b4f-93a8-443790c3f3b4', 'https://cms.ieltspredictiontest.com/media/images/logo-1776410314.png', 'logo-1776410314.png', 'image/png', 100921, NULL, '2026-04-17 08:24:33.827565+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_payouts_001.sql
-- ============================================================
-- Supabase SQL Editor — table: payouts  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: payouts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payouts VALUES ('43a63fcd-5b33-47af-a5b1-f96403fe18d9', 'c1733dd1-e715-4f98-b11d-42e94309aec1', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 592006, 'REF123', '2026-06-10 07:13:41.653+00', '2026-06-10 07:13:41.647+00', '2026-06-10 07:13:41.659+00', '2026-06-10 07:13:41.637593+00');
INSERT INTO public.payouts VALUES ('a21a03cd-d04a-4697-8b60-83f48078eb96', 'c1733dd1-e715-4f98-b11d-42e94309aec1', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 07:13:41.676919+00');
INSERT INTO public.payouts VALUES ('17eee396-1ec9-4d45-84b0-5b777da7f0cd', '3138d2d6-591c-4606-b84d-540f07be6c87', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 848679, 'REF123', '2026-06-10 07:13:53.184+00', '2026-06-10 07:13:53.177+00', '2026-06-10 07:13:53.195+00', '2026-06-10 07:13:53.168506+00');
INSERT INTO public.payouts VALUES ('20de4230-2579-4474-af2c-5c1ea00b64cc', '3138d2d6-591c-4606-b84d-540f07be6c87', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 07:13:53.216377+00');
INSERT INTO public.payouts VALUES ('b6e28c10-e13f-400c-9a83-a4458351a4d0', 'fc97bf6e-099a-45dd-8edd-1e104b665a19', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 801489, 'REF123', '2026-06-10 07:42:06.98+00', '2026-06-10 07:42:06.975+00', '2026-06-10 07:42:06.987+00', '2026-06-10 07:42:06.965827+00');
INSERT INTO public.payouts VALUES ('0843114a-232e-44ce-9bdb-461a61f5dff9', 'fc97bf6e-099a-45dd-8edd-1e104b665a19', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 07:42:07.008528+00');
INSERT INTO public.payouts VALUES ('c01af548-dde8-4cdb-bb8f-93025f3c669b', 'aa1ece5d-a4fe-4045-9efd-04a15b9ab39f', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 435612, 'REF123', '2026-06-10 08:41:46.002+00', '2026-06-10 08:41:45.997+00', '2026-06-10 08:41:46.01+00', '2026-06-10 08:41:45.98706+00');
INSERT INTO public.payouts VALUES ('ea1a433c-4639-437c-8bd7-11e69d29b98f', 'aa1ece5d-a4fe-4045-9efd-04a15b9ab39f', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 08:41:46.027792+00');
INSERT INTO public.payouts VALUES ('9f429b57-8ae9-4526-845f-c21a71b48086', '311eb6ba-cfc2-4054-b945-aecda587246e', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 519468, 'REF123', '2026-06-10 08:57:39.538+00', '2026-06-10 08:57:39.533+00', '2026-06-10 08:57:39.544+00', '2026-06-10 08:57:39.52326+00');
INSERT INTO public.payouts VALUES ('f66a9225-4831-4b01-a8e4-77db2c1dcd41', '311eb6ba-cfc2-4054-b945-aecda587246e', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 08:57:39.563649+00');
INSERT INTO public.payouts VALUES ('62a31d50-4d26-4729-9aef-fd61a899f34a', 'f4e93283-b16b-44ba-81b4-f929555624a4', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 618263, 'REF123', '2026-06-10 09:22:09+00', '2026-06-10 09:22:08.996+00', '2026-06-10 09:22:09.007+00', '2026-06-10 09:22:08.987129+00');
INSERT INTO public.payouts VALUES ('1d56c577-df3c-45b4-a551-fa85fea6417a', 'f4e93283-b16b-44ba-81b4-f929555624a4', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 09:22:09.024574+00');
INSERT INTO public.payouts VALUES ('851e4256-2a4e-48cc-993f-841e9655a8e2', '727e4948-b5c3-4648-abab-13bc3efc6e8e', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 836321, 'REF123', '2026-06-10 09:35:03.718+00', '2026-06-10 09:35:03.714+00', '2026-06-10 09:35:03.724+00', '2026-06-10 09:35:03.705979+00');
INSERT INTO public.payouts VALUES ('61045493-27b1-4dcd-8883-57929ccf81da', '727e4948-b5c3-4648-abab-13bc3efc6e8e', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-10 09:35:03.744406+00');
INSERT INTO public.payouts VALUES ('fdc60dd7-066a-4b59-b4a3-d55339c74b55', '77f13490-9dc0-4d5b-8cce-9d834b43c5c2', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 886236, 'REF123', '2026-06-11 06:51:19.694+00', '2026-06-11 06:51:19.69+00', '2026-06-11 06:51:19.7+00', '2026-06-11 06:51:19.681944+00');
INSERT INTO public.payouts VALUES ('0db3cd2f-134d-47a5-9a0a-43405ceb3557', '77f13490-9dc0-4d5b-8cce-9d834b43c5c2', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-11 06:51:19.719122+00');
INSERT INTO public.payouts VALUES ('cc101b5b-372f-4ee8-a2d1-b6da39727231', '2a22d4e2-cdd0-46cf-ad0c-90f28a53c924', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 954573, 'REF123', '2026-06-11 07:12:37.096+00', '2026-06-11 07:12:37.09+00', '2026-06-11 07:12:37.103+00', '2026-06-11 07:12:37.080828+00');
INSERT INTO public.payouts VALUES ('43d02807-a50f-40da-a850-e22d7b033ada', '2a22d4e2-cdd0-46cf-ad0c-90f28a53c924', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:12:37.12237+00');
INSERT INTO public.payouts VALUES ('6d0d881d-1c05-4d16-bd41-dbce42e3b695', 'b39d71ae-82ac-475f-9663-bfb78a366cbd', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 63323, 'REF123', '2026-06-11 07:33:44.846+00', '2026-06-11 07:33:44.841+00', '2026-06-11 07:33:44.852+00', '2026-06-11 07:33:44.83196+00');
INSERT INTO public.payouts VALUES ('bad458ef-42de-45c6-985d-5caa387974b5', 'b39d71ae-82ac-475f-9663-bfb78a366cbd', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:33:44.869547+00');
INSERT INTO public.payouts VALUES ('4c9ab4a5-6d3f-441e-a2a0-da4077644eb2', '9baa8e60-6098-4337-bfb1-39a14b0ea0bb', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 829034, 'REF123', '2026-06-11 07:39:15.648+00', '2026-06-11 07:39:15.642+00', '2026-06-11 07:39:15.655+00', '2026-06-11 07:39:15.631018+00');
INSERT INTO public.payouts VALUES ('52e9cef9-7337-48c3-b51a-db76998ac635', '9baa8e60-6098-4337-bfb1-39a14b0ea0bb', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:39:15.692862+00');
INSERT INTO public.payouts VALUES ('f53aaaed-7002-4a04-a098-bcde7ebd67c8', 'cafb224c-713c-4378-b465-df3d464b1748', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 74200, 'REF123', '2026-06-11 07:53:02.804+00', '2026-06-11 07:53:02.799+00', '2026-06-11 07:53:02.81+00', '2026-06-11 07:53:02.790506+00');
INSERT INTO public.payouts VALUES ('38e43af1-5645-4367-bdc8-ffc5cc62c071', 'cafb224c-713c-4378-b465-df3d464b1748', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-11 07:53:02.832166+00');
INSERT INTO public.payouts VALUES ('b221b1ad-e2eb-4cb2-a084-88a904c03f4a', '84068998-2641-43f5-bc15-16fad3a43fd8', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 293184, 'REF123', '2026-06-11 08:22:55.398+00', '2026-06-11 08:22:55.393+00', '2026-06-11 08:22:55.403+00', '2026-06-11 08:22:55.384427+00');
INSERT INTO public.payouts VALUES ('31d545b3-60d3-4df1-934e-58243fc1dcdc', '84068998-2641-43f5-bc15-16fad3a43fd8', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-11 08:22:55.421815+00');
INSERT INTO public.payouts VALUES ('6ecff30b-69c7-438c-be1a-066f0ef0361f', 'e20e4fe7-415a-4275-a6c3-71c086636ce9', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 815679, 'REF123', '2026-06-12 04:54:48.83+00', '2026-06-12 04:54:48.825+00', '2026-06-12 04:54:48.838+00', '2026-06-12 04:54:48.812103+00');
INSERT INTO public.payouts VALUES ('37f8ac73-81a3-4299-a1fe-e5144de1d55c', 'e20e4fe7-415a-4275-a6c3-71c086636ce9', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-12 04:54:48.859867+00');
INSERT INTO public.payouts VALUES ('2f68795b-53e4-4efd-bdab-6287c7c20651', '252aa396-2684-4397-b0e6-1cdada0f988b', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 755192, 'REF123', '2026-06-12 06:58:10.46+00', '2026-06-12 06:58:10.454+00', '2026-06-12 06:58:10.467+00', '2026-06-12 06:58:10.440561+00');
INSERT INTO public.payouts VALUES ('6617d3cc-1514-4ac0-8040-5a5549a00910', '252aa396-2684-4397-b0e6-1cdada0f988b', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-12 06:58:10.487447+00');
INSERT INTO public.payouts VALUES ('edf66c90-757b-4f44-81c9-d7ca1f049d62', '431d6d57-33d2-41df-8d1d-35b504712084', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 830265, 'REF123', '2026-06-12 08:34:32.906+00', '2026-06-12 08:34:32.9+00', '2026-06-12 08:34:32.911+00', '2026-06-12 08:34:32.891523+00');
INSERT INTO public.payouts VALUES ('26e1a6f4-cbf1-4cce-9c1d-a9797b953e88', '431d6d57-33d2-41df-8d1d-35b504712084', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-12 08:34:32.933448+00');
INSERT INTO public.payouts VALUES ('0c953da4-6c96-49b1-9cf8-a264c9370c7a', 'd8beeb93-11e3-41a2-9581-cc1e6b71e31d', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 766296, 'REF123', '2026-06-12 10:35:43.17+00', '2026-06-12 10:35:43.165+00', '2026-06-12 10:35:43.175+00', '2026-06-12 10:35:43.156609+00');
INSERT INTO public.payouts VALUES ('9096e672-80cd-4858-87cf-fa49ed7d0c3b', 'd8beeb93-11e3-41a2-9581-cc1e6b71e31d', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-12 10:35:43.191709+00');
INSERT INTO public.payouts VALUES ('fa76dcf7-f295-4a8b-b25a-ae1850e9393c', 'aaa012e9-e039-43ec-bf6c-1f1e5d65a7a9', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 538179, 'REF123', '2026-06-12 10:35:55.402+00', '2026-06-12 10:35:55.397+00', '2026-06-12 10:35:55.409+00', '2026-06-12 10:35:55.38916+00');
INSERT INTO public.payouts VALUES ('5f3e7add-8640-458b-9966-971193aee0c9', 'aaa012e9-e039-43ec-bf6c-1f1e5d65a7a9', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-12 10:35:55.42712+00');
INSERT INTO public.payouts VALUES ('4eb091be-388c-4972-8159-147ac9bc3e68', 'b6317006-f771-4ee5-a990-d1175745a433', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 702644, 'REF123', '2026-06-12 10:38:39.163+00', '2026-06-12 10:38:39.153+00', '2026-06-12 10:38:39.174+00', '2026-06-12 10:38:39.135286+00');
INSERT INTO public.payouts VALUES ('a4af210a-63ea-4eef-a781-0558f251c795', 'b6317006-f771-4ee5-a990-d1175745a433', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-12 10:38:39.202195+00');
INSERT INTO public.payouts VALUES ('66a2ce86-9241-4df9-9ec6-6c14541a54a3', 'ce1a4e1c-108c-48f6-ae4e-973c6b86639f', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 228594, 'REF123', '2026-06-15 04:44:18.863+00', '2026-06-15 04:44:18.858+00', '2026-06-15 04:44:18.87+00', '2026-06-15 04:44:18.842898+00');
INSERT INTO public.payouts VALUES ('8fd7a3f6-d166-4219-a264-d437daaf2a0c', 'ce1a4e1c-108c-48f6-ae4e-973c6b86639f', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-15 04:44:18.889523+00');
INSERT INTO public.payouts VALUES ('ed7f5a41-f841-4e0f-8604-839d106d9801', '7b9a09f0-7879-45f2-8f16-c81eec18b52b', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 575404, 'REF123', '2026-06-15 06:55:55.808+00', '2026-06-15 06:55:55.803+00', '2026-06-15 06:55:55.816+00', '2026-06-15 06:55:55.790707+00');
INSERT INTO public.payouts VALUES ('de4411bd-c185-4175-947c-0dc7c2a268f7', '7b9a09f0-7879-45f2-8f16-c81eec18b52b', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-15 06:55:55.836848+00');
INSERT INTO public.payouts VALUES ('5814a484-de80-4f87-a7d2-373c6e30be72', 'a5b63557-7152-4dbd-8dc0-2b8941a2ede8', 500000, 'completed', NULL, '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', 735591, 'REF123', '2026-06-15 08:07:41.209+00', '2026-06-15 08:07:41.202+00', '2026-06-15 08:07:41.217+00', '2026-06-15 08:07:41.193148+00');
INSERT INTO public.payouts VALUES ('f4a6c59e-888d-454d-8528-2ef45060bb58', 'a5b63557-7152-4dbd-8dc0-2b8941a2ede8', 300000, 'rejected', 'Test rejection', '{"bank_name": "ACB", "account_holder": "TEST HOLDER", "account_number": "123456789"}', NULL, NULL, NULL, NULL, NULL, '2026-06-15 08:07:41.241801+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_classroom_assignments_001.sql
-- ============================================================
-- Supabase SQL Editor — table: classroom_assignments  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: classroom_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classroom_assignments VALUES ('7e8dfab0-30d7-4251-be14-4e3e9f59fef7', '749ac3a9-9230-48c3-be0b-a8246ce3b104', 'de0a6986-f357-4b76-95a6-4dd36439349b', NULL, NULL, true, '973c1068-259a-45b5-a5c0-9c18141b145f', '2026-06-11 06:55:51.112167+00');
INSERT INTO public.classroom_assignments VALUES ('047b73da-ca69-4dcc-ae69-aaf2bab67882', '749ac3a9-9230-48c3-be0b-a8246ce3b104', '6bc47692-0262-489e-a198-c8da0486a109', NULL, NULL, true, '973c1068-259a-45b5-a5c0-9c18141b145f', '2026-06-11 06:55:51.112167+00');
INSERT INTO public.classroom_assignments VALUES ('6bea00d6-5783-4c1c-ac97-cdd7903856c1', '749ac3a9-9230-48c3-be0b-a8246ce3b104', '40070e9d-a12e-4b55-a639-f0207ed253a0', NULL, NULL, true, '973c1068-259a-45b5-a5c0-9c18141b145f', '2026-06-11 06:55:51.112167+00');
INSERT INTO public.classroom_assignments VALUES ('58b482a3-74d7-4b3d-83c3-c4b9ec21b545', '749ac3a9-9230-48c3-be0b-a8246ce3b104', '9c3dba7a-10c4-451f-96b4-918431bb0b17', NULL, NULL, true, '973c1068-259a-45b5-a5c0-9c18141b145f', '2026-06-11 06:55:51.112167+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_classroom_members_001.sql
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

-- TABLE: data_classroom_assignment_targets_001.sql
-- ============================================================
-- Supabase SQL Editor — table: classroom_assignment_targets  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: classroom_assignment_targets; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_club_members_001.sql
-- ============================================================
-- Supabase SQL Editor — table: club_members  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: club_members; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_orders_001.sql
-- ============================================================
-- Supabase SQL Editor — table: orders  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_commissions_001.sql
-- ============================================================
-- Supabase SQL Editor — table: commissions  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_rate_limits_001.sql
-- ============================================================
-- Supabase SQL Editor — table: rate_limits  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.rate_limits VALUES ('test-summary:::1', 7, '2026-06-15 07:51:04.941122+00');
INSERT INTO public.rate_limits VALUES ('coupon:::1', 2, '2026-06-15 06:20:20.640198+00');
INSERT INTO public.rate_limits VALUES ('test-start:::1', 1, '2026-06-15 02:54:26.207334+00');
INSERT INTO public.rate_limits VALUES ('test-summary:::ffff:127.0.0.1', 1, '2026-06-10 07:15:34.42997+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_redirects_001.sql
-- ============================================================
-- Supabase SQL Editor — table: redirects  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: redirects; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_admin_notifications_001.sql
-- ============================================================
-- Supabase SQL Editor — table: admin_notifications  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_affiliate_bank_info_001.sql
-- ============================================================
-- Supabase SQL Editor — table: affiliate_bank_info  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: affiliate_bank_info; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_affiliate_links_001.sql
-- ============================================================
-- Supabase SQL Editor — table: affiliate_links  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: affiliate_links; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_affiliate_visits_001.sql
-- ============================================================
-- Supabase SQL Editor — table: affiliate_visits  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: affiliate_visits; Type: TABLE DATA; Schema: public; Owner: -
--
SET session_replication_role = DEFAULT;

-- TABLE: data_community_posts_001.sql
-- ============================================================
-- Supabase SQL Editor — table: community_posts  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: community_posts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.community_posts VALUES ('a19e727e-a67d-4400-afa4-9036de33e979', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', NULL, 'How do you paraphrase the question fast?', 'I usually read the question twice and try to swap key nouns with synonyms. Any faster tricks?', '2026-06-12 10:43:45.58599+00');
INSERT INTO public.community_posts VALUES ('762c2642-d6ea-4b6a-8d31-b46fadcfff56', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', NULL, 'Best resources for Part 3 ideas?', 'I struggle with abstract questions in Part 3. What sources do you use to build vocabulary of ideas?', '2026-06-12 10:43:45.58599+00');
INSERT INTO public.community_posts VALUES ('a492b861-b2f5-4e6d-9d6d-0bf8038a9c10', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', NULL, 'Got 8.0 — here''s my 30-day routine', 'Sharing my study schedule that got me from 6.5 to 8.0 in a single month. Happy to answer questions!', '2026-06-12 10:43:45.58599+00');
INSERT INTO public.community_posts VALUES ('68f8340b-94ff-4257-8557-28641aa4c617', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', NULL, 'Listening Section 4 always trips me up', 'Section 4 monologue is brutal. Anyone have a strategy for keeping up with academic lectures?', '2026-06-12 10:43:45.58599+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_sepay_payout_transactions_001.sql
-- ============================================================
-- Supabase SQL Editor — table: sepay_payout_transactions  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: sepay_payout_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sepay_payout_transactions VALUES ('8a2f8f8b-ca3d-406e-9903-8e55cc9f1485', 592006, '43a63fcd-5b33-47af-a5b1-f96403fe18d9', 500000, 'REF123', '2026-06-10 07:13:41.665748+00');
INSERT INTO public.sepay_payout_transactions VALUES ('05f9154e-1123-41d8-9e3a-837e00347648', 848679, '17eee396-1ec9-4d45-84b0-5b777da7f0cd', 500000, 'REF123', '2026-06-10 07:13:53.203777+00');
INSERT INTO public.sepay_payout_transactions VALUES ('a3697607-ed63-43c7-a2b3-72d00217ab81', 801489, 'b6e28c10-e13f-400c-9a83-a4458351a4d0', 500000, 'REF123', '2026-06-10 07:42:06.995411+00');
INSERT INTO public.sepay_payout_transactions VALUES ('354a484c-c722-450c-a6d0-f8585ae80021', 435612, 'c01af548-dde8-4cdb-bb8f-93025f3c669b', 500000, 'REF123', '2026-06-10 08:41:46.016863+00');
INSERT INTO public.sepay_payout_transactions VALUES ('c7fee7e4-62bd-4db5-a20c-032c9dbf5a91', 519468, '9f429b57-8ae9-4526-845f-c21a71b48086', 500000, 'REF123', '2026-06-10 08:57:39.550749+00');
INSERT INTO public.sepay_payout_transactions VALUES ('12a00023-2845-4bdc-9a20-1a8527cc066b', 618263, '62a31d50-4d26-4729-9aef-fd61a899f34a', 500000, 'REF123', '2026-06-10 09:22:09.012524+00');
INSERT INTO public.sepay_payout_transactions VALUES ('6b8ad5c7-37b3-4572-932a-ea23489634ed', 836321, '851e4256-2a4e-48cc-993f-841e9655a8e2', 500000, 'REF123', '2026-06-10 09:35:03.732699+00');
INSERT INTO public.sepay_payout_transactions VALUES ('7431df2f-62e9-4053-970a-83cefba33309', 886236, 'fdc60dd7-066a-4b59-b4a3-d55339c74b55', 500000, 'REF123', '2026-06-11 06:51:19.707489+00');
INSERT INTO public.sepay_payout_transactions VALUES ('02d87505-8031-49bd-b40f-1f69f30f95af', 954573, 'cc101b5b-372f-4ee8-a2d1-b6da39727231', 500000, 'REF123', '2026-06-11 07:12:37.111012+00');
INSERT INTO public.sepay_payout_transactions VALUES ('6d7adfd0-42b1-4692-a257-4eeba19d587a', 63323, '6d0d881d-1c05-4d16-bd41-dbce42e3b695', 500000, 'REF123', '2026-06-11 07:33:44.858417+00');
INSERT INTO public.sepay_payout_transactions VALUES ('f59db4e2-24f4-4efd-83e8-15fbc26c28bc', 829034, '4c9ab4a5-6d3f-441e-a2a0-da4077644eb2', 500000, 'REF123', '2026-06-11 07:39:15.662389+00');
INSERT INTO public.sepay_payout_transactions VALUES ('379d5192-4090-46b3-82d5-c7b57c66a90a', 74200, 'f53aaaed-7002-4a04-a098-bcde7ebd67c8', 500000, 'REF123', '2026-06-11 07:53:02.818889+00');
INSERT INTO public.sepay_payout_transactions VALUES ('6548c896-0221-4395-af1c-551d6fc10abe', 293184, 'b221b1ad-e2eb-4cb2-a084-88a904c03f4a', 500000, 'REF123', '2026-06-11 08:22:55.410715+00');
INSERT INTO public.sepay_payout_transactions VALUES ('bf987cef-ec0c-467c-928d-63036a4953c3', 815679, '6ecff30b-69c7-438c-be1a-066f0ef0361f', 500000, 'REF123', '2026-06-12 04:54:48.844873+00');
INSERT INTO public.sepay_payout_transactions VALUES ('85a0831b-f83d-4bf8-8de6-2af8cdda8906', 755192, '2f68795b-53e4-4efd-bdab-6287c7c20651', 500000, 'REF123', '2026-06-12 06:58:10.474604+00');
INSERT INTO public.sepay_payout_transactions VALUES ('8457695c-934a-4fe2-8d4c-fd8074554bc4', 830265, 'edf66c90-757b-4f44-81c9-d7ca1f049d62', 500000, 'REF123', '2026-06-12 08:34:32.918679+00');
INSERT INTO public.sepay_payout_transactions VALUES ('6a7d00ce-2a7a-4ee2-8120-12af52c2efc8', 766296, '0c953da4-6c96-49b1-9cf8-a264c9370c7a', 500000, 'REF123', '2026-06-12 10:35:43.181098+00');
INSERT INTO public.sepay_payout_transactions VALUES ('6ba84d31-5122-4c3e-9e65-20e58a97dbb3', 538179, 'fa76dcf7-f295-4a8b-b25a-ae1850e9393c', 500000, 'REF123', '2026-06-12 10:35:55.415363+00');
INSERT INTO public.sepay_payout_transactions VALUES ('605f89a4-50fd-4c4a-aa59-261d24a418eb', 702644, '4eb091be-388c-4972-8159-147ac9bc3e68', 500000, 'REF123', '2026-06-12 10:38:39.186044+00');
INSERT INTO public.sepay_payout_transactions VALUES ('b428334d-95fb-4dca-befc-28cc9412a9db', 228594, '66a2ce86-9241-4df9-9ec6-6c14541a54a3', 500000, 'REF123', '2026-06-15 04:44:18.876287+00');
INSERT INTO public.sepay_payout_transactions VALUES ('cf8e31c6-23a8-416e-81f3-a22445a65e26', 575404, 'ed7f5a41-f841-4e0f-8604-839d106d9801', 500000, 'REF123', '2026-06-15 06:55:55.823358+00');
INSERT INTO public.sepay_payout_transactions VALUES ('4bb38fa0-da25-4353-9489-fdd28310bfa0', 735591, '5814a484-de80-4f87-a7d2-373c6e30be72', 500000, 'REF123', '2026-06-15 08:07:41.227928+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_vocab_words_001.sql
-- ============================================================
-- Supabase SQL Editor — table: vocab_words  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: vocab_words; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vocab_words VALUES ('e6117506-ab3c-4ac6-8253-e50eff59a88d', 'ubiquitous', 'Present, appearing, or found everywhere.', 'Mobile phones have become ubiquitous in modern society.', 'Technology', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('852582ce-6b15-4eba-be2c-f118eadb1dbb', 'mitigate', 'Make less severe, serious, or painful.', 'Governments must act swiftly to mitigate the effects of climate change.', 'Environment', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('0e53f192-523d-49f9-b0c1-ed474b92c5bc', 'proliferate', 'Increase rapidly in number; multiply.', 'Social media platforms have proliferated over the last decade.', 'Technology', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('46006ca4-e383-40ca-b70f-712019d910bf', 'exacerbate', 'Make a problem, bad situation, or negative feeling worse.', 'Pollution exacerbates respiratory diseases in urban areas.', 'Environment', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('f498823f-62e0-40a8-af35-925628682d40', 'detrimental', 'Tending to cause harm.', 'Excessive screen time can be detrimental to children''s development.', 'Health', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('86cc0ca2-eb7c-4818-a63a-adb90b15a453', 'paramount', 'More important than anything else; supreme.', 'It is paramount that students develop critical thinking skills.', 'Education', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('3af3ba0f-c73d-4780-af04-09449135dbfb', 'alleviate', 'Make suffering, deficiency, or a problem less severe.', 'New infrastructure projects aim to alleviate traffic congestion.', 'Society', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('caac00ca-6045-448f-b739-1636e7f2fa17', 'inevitable', 'Certain to happen; unavoidable.', 'Technological change is inevitable in today''s fast-moving world.', 'Technology', 'general', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('860afe04-a809-4384-894e-fdfab5eee92f', 'substantial', 'Of considerable importance, size, or worth.', 'The government allocated a substantial budget to healthcare reform.', 'Health', 'reading', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('f961994d-00e3-4bf5-9f1f-2dcb6d1c2537', 'advocate', 'Publicly recommend or support a cause or policy.', 'Many scientists advocate for stricter carbon emission limits.', 'Environment', 'speaking', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('8fe8530a-8c76-45a5-8d72-e89f46e64f16', 'feasible', 'Possible to do easily or conveniently.', 'Renewable energy is now a feasible alternative to fossil fuels.', 'Environment', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('6e3b209b-51c5-4802-9a25-219c12494bd1', 'disparity', 'A great difference between two or more things.', 'There is a growing disparity between the rich and the poor.', 'Society', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('b6de53c5-3d40-48dd-8d03-e9350e23d54f', 'undermine', 'Lessen the effectiveness or strength of, often gradually.', 'Corruption can undermine public trust in democratic institutions.', 'Society', 'writing', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('5b3e26d7-14ac-4ff7-8109-103ec6cf3d12', 'contemporary', 'Living or occurring at the same time; belonging to the present.', 'Contemporary education must address digital literacy.', 'Education', 'reading', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('a738de02-c85a-4176-b4f9-c9edcdb7c5f6', 'criterion', 'A principle or standard by which something may be judged.', 'Academic performance is one criterion used in university admissions.', 'Education', 'reading', '2026-06-11 07:54:01.846427+00', NULL, NULL, NULL);
INSERT INTO public.vocab_words VALUES ('f472ecd8-3696-41e4-9ca0-a29f24fc928c', 'confidence', 'Self-assurance.', NULL, NULL, NULL, '2026-06-12 10:45:08.332793+00', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '/ˈkɒnfɪdəns/', 'https://api.dictionaryapi.dev/media/pronunciations/en/confidence-us.mp3');
INSERT INTO public.vocab_words VALUES ('5005a052-3aa5-47c9-9b6b-c7f795cb60c5', 'Vocabulary', 'A usually alphabetized and explained collection of words e.g. of a particular field, or prepared for a specific purpose, often for learning.', 'My Russian vocabulary is very limited.', NULL, NULL, '2026-06-15 03:47:21.305451+00', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '/vəʊˈkabjʊləɹɪ/', 'https://api.dictionaryapi.dev/media/pronunciations/en/vocabulary-us.mp3');
INSERT INTO public.vocab_words VALUES ('348d94d9-2f3f-4050-be56-da0c6ef5bf37', 'Build', 'The physique of a human body; constitution or structure of a human body.', 'Rugby players are of sturdy build.', NULL, NULL, '2026-06-15 03:48:37.183615+00', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '/bɪld/', 'https://api.dictionaryapi.dev/media/pronunciations/en/build-uk.mp3');
INSERT INTO public.vocab_words VALUES ('3d4a3424-173a-4ac9-9ae3-db083611c7b1', 'personal', 'An advertisement by which individuals attempt to meet others with similar interests.', 'Her song was her personal look at the values of friendship.', NULL, NULL, '2026-06-15 03:48:41.227197+00', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '/ˈpɜː.sən.əl/', 'https://api.dictionaryapi.dev/media/pronunciations/en/personal-us.mp3');
SET session_replication_role = DEFAULT;

-- TABLE: data_user_vocab_001.sql
-- ============================================================
-- Supabase SQL Editor — table: user_vocab  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: user_vocab; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_vocab VALUES ('f1501b7c-605f-4afd-8613-69f2db6202fc', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', 'f472ecd8-3696-41e4-9ca0-a29f24fc928c', 'learning', '2026-06-12 10:45:08.349387+00', 1, 2.6, '2026-06-16 03:46:48.649+00');
INSERT INTO public.user_vocab VALUES ('0c03e049-cb25-4edb-a506-5c16cb9029d8', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '5005a052-3aa5-47c9-9b6b-c7f795cb60c5', 'learning', '2026-06-15 03:47:21.327077+00', 0, 2.5, NULL);
INSERT INTO public.user_vocab VALUES ('23fe2af9-e161-4c9e-bc9d-c20e8aab47c6', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '348d94d9-2f3f-4050-be56-da0c6ef5bf37', 'learning', '2026-06-15 03:48:37.233942+00', 0, 2.5, NULL);
INSERT INTO public.user_vocab VALUES ('98396299-00fc-4980-ba79-0874973d69e6', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '3d4a3424-173a-4ac9-9ae3-db083611c7b1', 'learning', '2026-06-15 03:48:41.247381+00', 0, 2.5, NULL);
SET session_replication_role = DEFAULT;

-- TABLE: data_vocab_activity_001.sql
-- ============================================================
-- Supabase SQL Editor — table: vocab_activity  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: vocab_activity; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vocab_activity VALUES ('f9e6e12e-faf7-4812-91ba-ea14b4b2f722', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', 'f472ecd8-3696-41e4-9ca0-a29f24fc928c', 'add', NULL, '2026-06-12 10:45:08.359534+00');
INSERT INTO public.vocab_activity VALUES ('30d0b478-6268-457a-95fa-cacd6e8cf404', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', 'f472ecd8-3696-41e4-9ca0-a29f24fc928c', 'review', true, '2026-06-15 03:46:48.669552+00');
INSERT INTO public.vocab_activity VALUES ('081fdc24-a2c6-470c-a236-1ac2476c7d36', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '5005a052-3aa5-47c9-9b6b-c7f795cb60c5', 'add', NULL, '2026-06-15 03:47:21.341586+00');
INSERT INTO public.vocab_activity VALUES ('0e953d43-28b1-4da6-a04a-cfe087a66bba', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '348d94d9-2f3f-4050-be56-da0c6ef5bf37', 'add', NULL, '2026-06-15 03:48:37.248894+00');
INSERT INTO public.vocab_activity VALUES ('2d7dcd23-7142-48a5-9573-9e9f9270b398', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '3d4a3424-173a-4ac9-9ae3-db083611c7b1', 'add', NULL, '2026-06-15 03:48:41.254584+00');


--
-- PostgreSQL database dump complete
--

\unrestrict dBCdv77L5pnJYjW4PPfl3ukazMXf43hFq0MR6HRWOxopskluwg26wf9yOzVzn4l
SET session_replication_role = DEFAULT;

-- TABLE: data_study_tasks_001.sql
-- ============================================================
-- Supabase SQL Editor — table: study_tasks  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: study_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.study_tasks VALUES ('75ed1966-4638-43a0-bf8f-dce7a5e6eee5', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '2026-06-08', 'Reading practice — Academic passages', 'Reading', false, '2026-06-12 04:23:57.533347+00');
INSERT INTO public.study_tasks VALUES ('0ac08457-f38d-41b1-a0ab-bba513c6e037', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '2026-06-09', 'Listening practice — Section 3 & 4', 'Listening', false, '2026-06-12 04:23:57.533347+00');
INSERT INTO public.study_tasks VALUES ('9bdc1c87-8d1b-4420-a2de-170e1cedfd29', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '2026-06-10', 'Writing Task 2 — argument essay', 'Writing', false, '2026-06-12 04:23:57.533347+00');
INSERT INTO public.study_tasks VALUES ('aa521775-8f98-47f5-add3-42c3dfcb3a09', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '2026-06-11', 'Speaking practice — Part 2 cue card', 'Speaking', false, '2026-06-12 04:23:57.533347+00');
INSERT INTO public.study_tasks VALUES ('9e078539-34f3-442c-825c-74e0898db4ca', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '2026-06-13', 'Review & vocabulary building', 'Writing', false, '2026-06-12 04:23:57.533347+00');
INSERT INTO public.study_tasks VALUES ('1fd5adc9-34cc-4c1e-9814-86c4534518e1', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '2026-06-12', 'Full mock test — Listening & Reading', 'Listening', true, '2026-06-12 04:23:57.533347+00');
SET session_replication_role = DEFAULT;

-- TABLE: data_test_results_001.sql
-- ============================================================
-- Supabase SQL Editor — table: test_results  chunk: 1
-- Run with: session_replication_role=replica (FK triggers off)
-- ============================================================
SET session_replication_role = replica;

--
-- Data for Name: test_results; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.test_results VALUES ('ab08c858-a0cb-4479-bfaf-5ad361064d81', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', 'de0a6986-f357-4b76-95a6-4dd36439349b', '{"answers": [1, 1, 1, 1, 1, 1, 1, 2, "king", "queen", "princess", "liquid", "water", {"0": "option-13-3", "1": "option-13-2", "2": "option-13-0", "3": "option-13-4", "4": "option-13-6", "5": "option-13-1"}, null, null, null, null, null, {"0": 3, "1": 2, "2": 5, "3": 4}, null, null, null, "world", "war", "machine", 2, 1, 1, 2, 0, 1, 2, 2, 2, {"0": 3, "1": 1, "2": 6, "3": 7, "4": 2}], "totalCorrect": 11, "totalQuestions": 40}', '[0, 1, 2]', '58:33', 60, 'simulation', 4, 'published', '2026-06-11 07:14:25.165+00', '2026-06-11 07:12:54.219373+00');
INSERT INTO public.test_results VALUES ('0b7456ec-a743-4e7c-a119-17fd5ab2abe0', '88da8ada-bbc2-490e-b6aa-4ddb3baafc2a', '4238eea9-9dd0-4f43-be6d-c269a7f25a02', NULL, '[0]', NULL, 60, 'practice', NULL, 'draft', NULL, '2026-06-15 02:53:26.331157+00');
SET session_replication_role = DEFAULT;


SET session_replication_role = DEFAULT;
