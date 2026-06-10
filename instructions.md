# How to Add a New Supplier to WhosGotStock

This guide provides a step-by-step procedure for adding new distributor/supplier product feeds to the WhosGotStock application.

---

## Step 1: Database Schema & Seeding Configurations

Every supplier is represented in the database `suppliers` table and might have secret credentials in the `settings` table.

### A. Create a Database Migration File
Create a new SQL file under `database/migrations/` (e.g. `009_add_miro_supplier.sql`) to insert configuration settings and the supplier description.
```sql
-- Migration: Add <SupplierName> supplier configuration
-- Date: <CurrentDate>

-- Add configuration settings (credentials)
INSERT INTO settings (key, value) VALUES
('<SUPPLIER>_USER', 'your-user-value'),
('<SUPPLIER>_KEY', 'your-key-value')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add supplier with dynamic URL using settings variables
INSERT INTO suppliers (name, slug, url, type, enabled)
VALUES (
  'Supplier Name',
  'supplier-slug',
  'https://api.supplier.com/feed?user=' || 
  (SELECT value FROM settings WHERE key = '<SUPPLIER>_USER') || 
  '&key=' || (SELECT value FROM settings WHERE key = '<SUPPLIER>_KEY'),
  'xml', -- Can be 'xml', 'csv', 'json'
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  type = EXCLUDED.type,
  enabled = EXCLUDED.enabled;
```

### B. Update Migration Runner
Add the new migration file to the `MIGRATIONS` array inside `database/run-migrations.sh`:
```bash
MIGRATIONS=(
    ...
    "migrations/008_add_trigram_search_indexes.sql"
    "migrations/009_add_miro_supplier.sql" # <- Add here
)
```

### C. Update Database Initialization Route
Add the default credentials and supplier insertion query to the Next.js database setup route at `web/app/api/admin/setup-db/route.ts` inside the `POST` function handler:
```typescript
// Under Insert default settings query:
('MIRO_USER', 'blake-foster'),
...

// Under Insert default suppliers query:
('Miro', 'miro', 'https://miro.co.za/...', 'xml', true)
```

---

## Step 2: Configure Scraper Worker Fallbacks

The backend worker maintains a static fallback configuration array.
Add the supplier definition to `worker/suppliers.json`:
```json
[
  ...
  {
    "id": "supplier-slug",
    "name": "Supplier Name",
    "url": "https://api.supplier.com/feed?...",
    "type": "xml",
    "enabled": true
  }
]
```

---

## Step 3: Implement Parser Driver

The scraper dynamically loads a driver based on the supplier's slug or fallback format type.

### A. Create Driver File
Create a new file `worker/src/drivers/<supplier-slug>.js`:
```javascript
const { XMLParser } = require('fast-xml-parser'); // If feed is XML

/**
 * Driver for <SupplierName> (XML RSS Feed)
 */
async function supplierDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    // Normalize products list (handle arrays/single objects)
    const raw = Array.isArray(parsed.rss?.channel?.item)
        ? parsed.rss.channel.item
        : (parsed.rss?.channel?.item ? [parsed.rss.channel.item] : []);

    return raw.map(p => {
        const sku = p._sku ? String(p._sku).trim() : 'UNKNOWN';
        return {
            supplier_sku: sku,
            supplier_name: supplier.name,
            name: String(p.title || ''),
            description: String(p.description || ''),
            brand: String(p.brand || ''),
            price_ex_vat: parseFloat(p._price || 0),
            qty_on_hand: parseInt(p.qty || 0),
            stock_jhb: parseInt(p.stock_jhb || 0), // Optional: JHB stock split
            stock_cpt: parseInt(p.stock_cpt || 0), // Optional: CPT stock split
            image_url: String(p.featured_image || ''),
            category: helpers.normalizeCategory(p.category || '', supplier.id),
            master_sku: `${supplier.id}-${sku}`,
            raw_data: JSON.stringify(p)
        };
    });
}

module.exports = supplierDriver;
```

---

## Step 4: Update Documentation

Update search API docs inside `web/app/api-docs/page.tsx` to list the new supplier as part of the system capabilities and list of active suppliers response examples.

---

## Step 5: Test and Verify

1. **Apply migration**: Run `DATABASE_URL=... ./database/run-migrations.sh` (or using a node migration script) to apply database changes.
2. **Test parser**: Write a small test script to retrieve the feed, pass it to your driver, and print the parsed count and sample schema to ensure all columns (sku, name, description, brand, pricing, stock quantities) are correctly parsed.
