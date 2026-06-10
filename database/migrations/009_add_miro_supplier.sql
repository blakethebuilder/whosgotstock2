-- Migration: Add Miro supplier configuration
-- Date: June 10, 2026

-- Add Miro API settings
INSERT INTO settings (key, value) VALUES
('MIRO_USER', 'blake-foster'),
('MIRO_KEY', '64055d56367c68545b1ad9b86faee20c'),
('MIRO_DATASET', '292')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add Miro supplier with dynamic URL using settings
INSERT INTO suppliers (name, slug, url, type, enabled)
VALUES (
  'Miro',
  'miro',
  'https://miro.co.za/custom_xml_feed/getproductfeeds.php?user=' || 
  (SELECT value FROM settings WHERE key = 'MIRO_USER') || 
  '&key=' || (SELECT value FROM settings WHERE key = 'MIRO_KEY') || 
  '&dataset=' || (SELECT value FROM settings WHERE key = 'MIRO_DATASET'),
  'xml',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled;
