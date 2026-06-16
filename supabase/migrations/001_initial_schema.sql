-- ============================================================================
-- Vit IELTS — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates 18 tables, indexes, RPC functions, and RLS policies
-- ============================================================================

-- ===========================
-- 1. USERS (extends Supabase auth.users)
-- ===========================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT false,
  pro_expiration_date DATE,
  target_score JSONB DEFAULT '{}',
  -- { reading: 7.0, listening: 7.5, speaking: 6.5, writing: 6.5, exam_date: "2026-06-01" }
  gender TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  roles JSONB DEFAULT '["subscriber"]',
  devices JSONB DEFAULT '{}',
  -- { mobile: { device_id: "xxx" }, desktop: { device_id: "yyy" } }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 2. QUIZZES (replaces WP post_type=quiz)
-- ===========================
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  type TEXT NOT NULL CHECK (type IN ('practice', 'exam')),
  skill TEXT NOT NULL CHECK (skill IN ('reading', 'listening')),
  time_minutes INTEGER NOT NULL DEFAULT 60,
  pro_user_only BOOLEAN DEFAULT false,
  score_type TEXT,
  featured_image TEXT,
  audio_url TEXT,
  pdf_url TEXT,
  tests_taken INTEGER DEFAULT 0,
  source TEXT,
  year TEXT,
  quarter TEXT,
  part TEXT,
  question_form TEXT, -- comma-separated: "true_false_not_given,matching"
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  votes JSONB DEFAULT '[]',
  -- [{ user_id: "uuid", rate: 5 }, ...]
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 3. PASSAGES (replaces ACF repeater)
-- ===========================
CREATE TABLE public.passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT, -- HTML rich text
  sort_order INTEGER DEFAULT 0,
  audio_start INTEGER,
  audio_end INTEGER
);

-- ===========================
-- 4. QUESTIONS (replaces ACF repeater nested)
-- ===========================
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id UUID NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('radio', 'select', 'fillup', 'checkbox', 'matching', 'matrix')),
  title TEXT,
  question_text TEXT,
  instructions TEXT,
  question_form TEXT,
  list_of_questions JSONB,
  -- radio/select: [{ question: "...", correct: "1", options: [{option_text: "A"}, ...] }]
  list_of_options JSONB,
  -- checkbox: [{ option_text: "A", correct: true }, ...]
  matching_question JSONB,
  -- { layout_type: "standard"|"summary"|"heading", matching_items: [...], answer_options: [...], summary_text: "..." }
  matrix_question JSONB,
  -- { matrix_categories: [{ category_letter: "A", category_text: "..." }], matrix_items: [{ item_text: "...", correct_category_letter: "A" }] }
  explanations JSONB,
  -- fillup: [{ content: "correct answer 1 / alternate" }]
  sort_order INTEGER DEFAULT 0
);

-- ===========================
-- 5. TEST RESULTS (replaces WP post_type=test-result)
-- ===========================
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  answers JSONB,
  -- { answers: [answer1, answer2, ...] }
  test_part JSONB,
  -- [0, 1, 2] (indices of selected passages)
  time_left TEXT,
  test_time INTEGER,
  test_mode TEXT,
  score FLOAT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 6. MOCK TESTS (replaces WP post_type=mock_test)
-- ===========================
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  practice_tests JSONB NOT NULL,
  -- [{ reading_test_id: "uuid", listening_test_id: "uuid" }, ...]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 7. MOCK TEST COLLECTIONS (replaces WP post_type=mock-test-collection)
-- ===========================
CREATE TABLE public.mock_test_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  mock_test_ids UUID[] NOT NULL,
  -- Array of mock_test IDs
  featured_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 8. COUPONS (replaces data/coupons.json)
-- NOTE: Created before orders due to FK dependency
-- ===========================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percent', 'fixed')),
  value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 9. ORDERS (replaces data/orders.json)
-- ===========================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  package_type TEXT CHECK (package_type IN ('combo', 'single')),
  duration INTEGER NOT NULL,
  skill_type TEXT,
  amount INTEGER NOT NULL,
  original_amount INTEGER,
  discount_amount INTEGER DEFAULT 0,
  coupon_id UUID REFERENCES coupons(id),
  coupon_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  transfer_content TEXT,
  affiliate_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 10. AFFILIATES (replaces data/affiliates.json)
-- ===========================
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  custom_link TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  commission_rate FLOAT DEFAULT 0.1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 11. AFFILIATE LINKS (replaces data/affiliate-links.json)
-- ===========================
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  custom_link TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 12. AFFILIATE VISITS (replaces data/affiliate-visits.json)
-- ===========================
CREATE TABLE public.affiliate_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id),
  link_id UUID REFERENCES affiliate_links(id),
  ip TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT false,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 13. COMMISSIONS (replaces data/affiliate-commissions.json)
-- ===========================
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id),
  order_id TEXT,
  amount INTEGER,
  commission_rate FLOAT,
  commission_amount INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 14. CMS CONFIGS (replaces config/*.json + Vercel KV)
-- ===========================
CREATE TABLE public.cms_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 15. SITE SETTINGS (replaces WordPress Options)
-- ===========================
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 16. MENUS (replaces WordPress Menus)
-- ===========================
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT UNIQUE NOT NULL, -- 'main-menu', 'footer-menu'
  items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 17. POSTS (replaces WP post_type=post)
-- ===========================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status TEXT DEFAULT 'draft',
  pro_user_only BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  votes JSONB DEFAULT '[]',
  seo JSONB DEFAULT '{}',
  categories JSONB DEFAULT '[]',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 18. SAMPLE ESSAYS (replaces WP post_type=sample-essay)
-- ===========================
CREATE TABLE public.sample_essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  skill TEXT, -- reading, listening, speaking, writing
  part TEXT,
  question_type TEXT,
  quarter TEXT,
  year TEXT,
  source TEXT,
  topic TEXT,
  task TEXT,
  passage TEXT,
  featured_image TEXT,
  status TEXT DEFAULT 'draft',
  pro_user_only BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  votes JSONB DEFAULT '[]',
  seo JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_quizzes_skill_type ON quizzes(skill, type);
CREATE INDEX idx_quizzes_slug ON quizzes(slug);
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_quiz ON test_results(quiz_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_passages_quiz ON passages(quiz_id);
CREATE INDEX idx_questions_passage ON questions(passage_id);


-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_tests_taken(p_quiz_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quizzes SET tests_taken = tests_taken + 1 WHERE id = p_quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- -----------------------------------------------
-- USERS
-- -----------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access on users"
  ON users
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- QUIZZES
-- -----------------------------------------------
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published quizzes"
  ON quizzes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin CRUD quizzes"
  ON quizzes
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- PASSAGES
-- -----------------------------------------------
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read passages of published quizzes"
  ON passages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = passages.quiz_id AND quizzes.status = 'published')
  );

CREATE POLICY "Admin CRUD passages"
  ON passages
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- QUESTIONS
-- -----------------------------------------------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read questions of published quizzes"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM passages
      JOIN quizzes ON quizzes.id = passages.quiz_id
      WHERE passages.id = questions.passage_id AND quizzes.status = 'published'
    )
  );

CREATE POLICY "Admin CRUD questions"
  ON questions
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- TEST RESULTS
-- -----------------------------------------------
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own test results"
  ON test_results FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admin read all test results"
  ON test_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- MOCK TESTS
-- -----------------------------------------------
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read mock tests"
  ON mock_tests FOR SELECT
  USING (true);

CREATE POLICY "Admin CRUD mock tests"
  ON mock_tests
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- MOCK TEST COLLECTIONS
-- -----------------------------------------------
ALTER TABLE mock_test_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read mock test collections"
  ON mock_test_collections FOR SELECT
  USING (true);

CREATE POLICY "Admin CRUD mock test collections"
  ON mock_test_collections
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- COUPONS
-- -----------------------------------------------
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access on coupons"
  ON coupons
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- ORDERS
-- -----------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on orders"
  ON orders
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- AFFILIATES
-- -----------------------------------------------
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own affiliate"
  ON affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on affiliates"
  ON affiliates
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- AFFILIATE LINKS
-- -----------------------------------------------
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own affiliate links"
  ON affiliate_links FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_links.affiliate_id AND affiliates.user_id = auth.uid())
  );

CREATE POLICY "Admin full access on affiliate links"
  ON affiliate_links
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- AFFILIATE VISITS
-- -----------------------------------------------
ALTER TABLE affiliate_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own affiliate visits"
  ON affiliate_visits FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_visits.affiliate_id AND affiliates.user_id = auth.uid())
  );

CREATE POLICY "Admin full access on affiliate visits"
  ON affiliate_visits
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- COMMISSIONS
-- -----------------------------------------------
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = commissions.affiliate_id AND affiliates.user_id = auth.uid())
  );

CREATE POLICY "Admin full access on commissions"
  ON commissions
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- CMS CONFIGS
-- -----------------------------------------------
ALTER TABLE cms_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cms configs"
  ON cms_configs FOR SELECT
  USING (true);

CREATE POLICY "Admin write cms configs"
  ON cms_configs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- SITE SETTINGS
-- -----------------------------------------------
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin write site settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- MENUS
-- -----------------------------------------------
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read menus"
  ON menus FOR SELECT
  USING (true);

CREATE POLICY "Admin write menus"
  ON menus FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- POSTS
-- -----------------------------------------------
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published posts"
  ON posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin CRUD posts"
  ON posts
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- SAMPLE ESSAYS
-- -----------------------------------------------
ALTER TABLE sample_essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published sample essays"
  ON sample_essays FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin CRUD sample essays"
  ON sample_essays
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );
