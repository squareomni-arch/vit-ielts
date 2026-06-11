-- Migration: 024_user_profile_fields.sql
-- Adds optional profile fields surfaced on the My Profile page.
-- Additive only — safe to run on existing data (columns default NULL).

ALTER TABLE users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language text;
