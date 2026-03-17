-- Migration: Add pro_skills column to users table
-- Supports individual skill packages (listening-only, reading-only)
-- NULL = all skills (combo package, backward-compatible)
-- Array = specific skills only, e.g. '{listening}' or '{reading}'

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pro_skills TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.users.pro_skills IS
  'Skills the user has Pro access to. NULL = all skills (combo). Array = specific skills only.';
