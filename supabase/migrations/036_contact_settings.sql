-- Contact info lives in the single source of truth: site_settings.general_settings.
-- Merge the new hotline + email into the existing JSON (preserves facebook/zalo/etc).
INSERT INTO site_settings (key, value)
VALUES ('general_settings', '{"phoneNumber":"055 956 2767","email":"vitielts8.0@gmail.com"}'::jsonb)
ON CONFLICT (key) DO UPDATE
SET value = site_settings.value || EXCLUDED.value,
    updated_at = now();
