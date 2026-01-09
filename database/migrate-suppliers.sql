-- Supplier Migration Script
-- Run this script to update supplier configurations with environment variables

-- Add Mustek supplier if not exists
INSERT INTO suppliers (name, slug, url, type, enabled) 
VALUES ('Mustek', 'mustek', 
  'https://api.mustek.co.za/Customer/ItemsStock.ashx?CustomerToken=' || 
  COALESCE(
    (SELECT value FROM settings WHERE key = 'MUSTEK_CUSTOMER_TOKEN'),
    'f49294f4-cf6b-429c-895f-d27d539cdac4'
  ), 
  'csv', true)
ON CONFLICT (slug) DO UPDATE SET 
  url = EXCLUDED.url,
  enabled = EXCLUDED.enabled;

-- Add environment variable settings
INSERT INTO settings (key, value) VALUES 
('MUSTEK_CUSTOMER_TOKEN', 'f49294f4-cf6b-429c-895f-d27d539cdac4'),
('ESQUIRE_EMAIL', 'blake@smartintegrate.co.za'),
('ESQUIRE_PASSWORD', 'Smart@1991'),
('SYNTECH_API_KEY', '668EFF7-494A-43B9-90A8-E72B79648CFC'),
('PINNACLE_API_KEY', '942709f3-9b39-4e93-9a5e-cdd883453178')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update existing suppliers with environment variables
UPDATE suppliers SET 
  url = 'https://api.esquire.co.za/api/DataFeed?u=' || 
  (SELECT value FROM settings WHERE key = 'ESQUIRE_EMAIL') || 
  '&p=' || (SELECT value FROM settings WHERE key = 'ESQUIRE_PASSWORD') || 
  '&t=xml&m=10&o=ascending&r=RoundNone&rm=10&min=0'
WHERE name = 'Esquire';

-- Verify Mustek configuration
SELECT name, slug, LEFT(url, 50) as url_preview 
FROM suppliers 
WHERE name = 'Mustek';
