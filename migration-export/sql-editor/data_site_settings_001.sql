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
