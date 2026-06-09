-- Migration: Add Linkqage supplier configuration and token setting
-- Date: June 09, 2026

-- Add Linkqage API token to settings
INSERT INTO settings (key, value) 
VALUES ('LINKQAGE_TOKEN', 'TiZBRxFPIDTM28VhKmQAToLYSDUmkflX9DpOVYJrn6xuOiNTZpv1KgviF2iPP7uT')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add Linkqage supplier with dynamic URL using the settings token
INSERT INTO suppliers (name, slug, url, type, enabled) 
VALUES (
  'Linkqage', 
  'linkqage', 
  'https://linkqage.ftgdrop.co.za/api/v1/feed/' || (SELECT value FROM settings WHERE key = 'LINKQAGE_TOKEN'), 
  'json', 
  true
)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled;
