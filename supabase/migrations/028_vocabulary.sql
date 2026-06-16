-- ============================================================================
-- Vit IELTS — Vocabulary feature
-- Migration: 028_vocabulary.sql
-- Description:
--   Shared word corpus (vocab_words) readable by everyone, plus per-user
--   learning progress (user_vocab) with RLS scoped to the owning user.
-- ============================================================================

-- ===========================
-- TABLES
-- ===========================

-- Shared word corpus — one row per IELTS word
CREATE TABLE public.vocab_words (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word       TEXT NOT NULL,
  meaning    TEXT NOT NULL,
  example    TEXT,
  topic      TEXT,          -- e.g. 'Environment', 'Education', 'Technology'
  skill      TEXT,          -- e.g. 'writing', 'reading', 'speaking', 'general'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (word)
);

-- Per-user learning progress
CREATE TABLE public.user_vocab (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id    UUID NOT NULL REFERENCES vocab_words(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'learning'
               CHECK (status IN ('learning', 'learned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, word_id)
);

-- ===========================
-- INDEXES
-- ===========================

CREATE INDEX idx_user_vocab_user ON user_vocab(user_id);
CREATE INDEX idx_user_vocab_word ON user_vocab(word_id);
CREATE INDEX idx_vocab_words_topic ON vocab_words(topic);

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================

ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon) can read the shared corpus
CREATE POLICY "Public read vocab_words"
  ON public.vocab_words FOR SELECT
  USING (true);

ALTER TABLE public.user_vocab ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own progress rows
CREATE POLICY "Users manage own vocab progress"
  ON public.user_vocab FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===========================
-- GRANTS
-- ===========================

GRANT SELECT ON public.vocab_words TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_vocab TO authenticated;

-- ===========================
-- SEED — 15 common IELTS words
-- Idempotent: ON CONFLICT (word) DO NOTHING
-- ===========================

INSERT INTO public.vocab_words (word, meaning, example, topic, skill) VALUES
  ('ubiquitous',    'Present, appearing, or found everywhere.',
   'Mobile phones have become ubiquitous in modern society.',
   'Technology', 'writing'),
  ('mitigate',      'Make less severe, serious, or painful.',
   'Governments must act swiftly to mitigate the effects of climate change.',
   'Environment', 'writing'),
  ('proliferate',   'Increase rapidly in number; multiply.',
   'Social media platforms have proliferated over the last decade.',
   'Technology', 'writing'),
  ('exacerbate',    'Make a problem, bad situation, or negative feeling worse.',
   'Pollution exacerbates respiratory diseases in urban areas.',
   'Environment', 'writing'),
  ('detrimental',   'Tending to cause harm.',
   'Excessive screen time can be detrimental to children''s development.',
   'Health', 'writing'),
  ('paramount',     'More important than anything else; supreme.',
   'It is paramount that students develop critical thinking skills.',
   'Education', 'writing'),
  ('alleviate',     'Make suffering, deficiency, or a problem less severe.',
   'New infrastructure projects aim to alleviate traffic congestion.',
   'Society', 'writing'),
  ('inevitable',    'Certain to happen; unavoidable.',
   'Technological change is inevitable in today''s fast-moving world.',
   'Technology', 'general'),
  ('substantial',   'Of considerable importance, size, or worth.',
   'The government allocated a substantial budget to healthcare reform.',
   'Health', 'reading'),
  ('advocate',      'Publicly recommend or support a cause or policy.',
   'Many scientists advocate for stricter carbon emission limits.',
   'Environment', 'speaking'),
  ('feasible',      'Possible to do easily or conveniently.',
   'Renewable energy is now a feasible alternative to fossil fuels.',
   'Environment', 'writing'),
  ('disparity',     'A great difference between two or more things.',
   'There is a growing disparity between the rich and the poor.',
   'Society', 'writing'),
  ('undermine',     'Lessen the effectiveness or strength of, often gradually.',
   'Corruption can undermine public trust in democratic institutions.',
   'Society', 'writing'),
  ('contemporary',  'Living or occurring at the same time; belonging to the present.',
   'Contemporary education must address digital literacy.',
   'Education', 'reading'),
  ('criterion',     'A principle or standard by which something may be judged.',
   'Academic performance is one criterion used in university admissions.',
   'Education', 'reading')
ON CONFLICT (word) DO NOTHING;
