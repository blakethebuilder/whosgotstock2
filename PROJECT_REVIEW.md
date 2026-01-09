# WhosGotStock - Project Review & VPS Deployment Issues

**Date**: January 2025  
**Status**: Mustek API Integration Complete, VPS Deployment Issues Identified

## 📋 Project Overview

**WhosGotStock** is an IT sourcing platform aggregating product data from multiple South African suppliers (Scoop, Esquire, Pinnacle, Syntech, Mustek) to provide real-time pricing comparison and stock checking for IT companies and MSPs.

### Architecture
- **Frontend**: Next.js 16.1.1 (TypeScript, Tailwind CSS)
- **Backend Worker**: Node.js data ingestion service
- **Database**: PostgreSQL 15
- **Deployment**: Docker/Dockploy on VPS

---

## ✅ Recent Work: Mustek API Integration

### What Was Added
1. **Mustek Supplier Configuration** (`worker/suppliers.json`)
   - CSV feed type
   - API endpoint with customer token
   - Enabled status

2. **CSV Parser** (`worker/src/ingestor.js`)
   - Custom CSV parsing function with quote handling
   - Mustek-specific field mapping:
     - `ItemId` → `supplier_sku`
     - `Description` → `name` & `description`
     - `QtyAvailable` → `qty_on_hand`
     - `Price` → `price_ex_vat`
     - `ProductLine` → `brand` & `category`
     - `Status` → filter (only "Active" products)

3. **Database Migration** (`database/migrate-suppliers.sql`)
   - Adds Mustek supplier to `suppliers` table
   - Stores API credentials in `settings` table

### Status
✅ **Working locally** - Mustek API integration is functional

---

## 🐛 Critical Issues Found

### 1. **BUG: Duplicate Token in Migration Script** ⚠️ CRITICAL

**File**: `database/migrate-suppliers.sql` (Lines 7-9)

**Problem**:
```sql
'https://api.mustek.co.za/Customer/ItemsStock.ashx?CustomerToken=' || 
(SELECT value FROM settings WHERE key = 'MUSTEK_CUSTOMER_TOKEN') || 
'f49294f4-cf6b-429c-895f-d27d539cdac4',  -- ❌ Hardcoded token duplicated!
```

The script tries to get the token from settings table AND appends a hardcoded token, resulting in an invalid URL like:
```
...?CustomerToken=f49294f4-cf6b-429c-895f-d27d539cdac4f49294f4-cf6b-429c-895f-d27d539cdac4
```

**Fix Required**: Remove the hardcoded token, use only the settings value or environment variable.

---

### 2. **Database Connection Issues on VPS** ⚠️ CRITICAL

**Problem**: Multiple potential issues:

#### A. Hardcoded Database Credentials
- `docker-compose.yml` uses hardcoded credentials: `postgres:postgres@postgres:5432`
- On Dockploy/VPS, database might be:
  - External PostgreSQL instance
  - Different hostname/IP
  - Different credentials
  - Requires SSL connection

#### B. SSL Configuration
- `web/lib/db.ts` has `ssl: false` hardcoded
- Production databases often require SSL
- Should be configurable via environment variable

#### C. Connection String Format
- VPS databases may require password in connection string
- Format: `postgresql://user:password@host:port/database`
- Current setup assumes no password or different format

---

### 3. **Database Schema Issues** ⚠️ HIGH

#### A. Missing Category Column in Initial Schema
- `database/init.sql` creates `products` table **without** `category` column
- `database/migrations/002_add_category_column.sql` adds it later
- Worker ingestor tries to insert `category` data immediately
- **Risk**: Migration 002 might not run, causing INSERT failures

#### B. Migration Order Not Enforced
- No migration runner/versioning system
- Manual execution required
- Easy to miss migrations or run out of order

#### C. Missing Indexes
- `init.sql` creates some indexes
- Migration 002 adds category index
- But `master_sku` index might be missing initially

---

### 4. **Environment Variable Issues** ⚠️ MEDIUM

#### A. Missing Environment Variables
- `web/lib/env.ts` requires strict validation
- Missing vars cause app to exit on startup
- Dockploy might not have all required vars set

#### B. Settings Table Dependency
- `migrate-suppliers.sql` reads from `settings` table
- But `settings` table might be empty on first run
- Should use COALESCE or environment variables directly

#### C. Worker Environment Variables
- Worker needs `DATABASE_URL`, `MUSTEK_CUSTOMER_TOKEN`, etc.
- No validation in worker code
- Silent failures if missing

---

### 5. **Docker Deployment Issues** ⚠️ MEDIUM

#### A. Database Initialization
- `docker-compose.yml` mounts `init.sql` to `/docker-entrypoint-initdb.d/`
- Only runs on **first container creation**
- If volume exists, init script doesn't run
- Migrations won't run automatically

#### B. Worker Dependencies
- Worker depends on `postgres` service
- But doesn't wait for migrations to complete
- Might start before database is ready

#### C. Build Context Issues
- Dockerfiles reference `worker/` and `web/` subdirectories
- But build context might be wrong if run from root
- Need to verify build paths

---

## 🔧 Recommended Fixes

### Priority 1: Fix Critical Bugs

1. **Fix migrate-suppliers.sql**
   ```sql
   -- Use environment variable or settings, not both
   'https://api.mustek.co.za/Customer/ItemsStock.ashx?CustomerToken=' || 
   COALESCE(
     (SELECT value FROM settings WHERE key = 'MUSTEK_CUSTOMER_TOKEN'),
     'f49294f4-cf6b-429c-895f-d27d539cdac4'  -- Fallback only
   )
   ```

2. **Add Category Column to init.sql**
   - Include `category VARCHAR(255)` in initial `products` table creation
   - Or ensure migration 002 runs before worker starts

3. **Make SSL Configurable**
   ```typescript
   // web/lib/db.ts
   ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
   ```

### Priority 2: Improve Database Setup

1. **Create Migration Runner Script**
   - `database/run-migrations.sh` or Node.js script
   - Runs all migrations in order
   - Tracks which migrations have run

2. **Add Database Health Check**
   - Verify all required tables exist
   - Check for required columns
   - Validate indexes

3. **Improve Error Messages**
   - Better connection error messages
   - Clear migration status reporting

### Priority 3: Deployment Improvements

1. **Update docker-compose.yml**
   - Use environment variables for database connection
   - Add health checks
   - Ensure migrations run before services start

2. **Create Deployment Checklist**
   - Step-by-step VPS deployment guide
   - Environment variable checklist
   - Database setup verification steps

3. **Add Monitoring**
   - Database connection monitoring
   - Worker ingestion status
   - API health endpoints

---

## 📝 VPS Deployment Checklist

### Pre-Deployment
- [ ] Fix `migrate-suppliers.sql` bug
- [ ] Update `init.sql` to include category column
- [ ] Make SSL configurable in `db.ts`
- [ ] Test database connection locally with production-like settings

### Database Setup
- [ ] Create PostgreSQL database on VPS
- [ ] Set up database user with proper permissions
- [ ] Run `init.sql` to create schema
- [ ] Run `migrate-suppliers.sql` to add Mustek
- [ ] Run all migration files in order (001, 002, 004, 005)
- [ ] Verify all tables exist: `\dt` in psql
- [ ] Verify Mustek supplier exists: `SELECT * FROM suppliers WHERE name = 'Mustek';`

### Environment Variables (Dockploy)
- [ ] `DATABASE_URL` - Full connection string with credentials
- [ ] `DATABASE_SSL` - Set to 'true' if required
- [ ] `MUSTEK_CUSTOMER_TOKEN` - Mustek API token
- [ ] `ESQUIRE_EMAIL` - Esquire API email
- [ ] `ESQUIRE_PASSWORD` - Esquire API password
- [ ] `NODE_ENV=production`
- [ ] `NEXT_TELEMETRY_DISABLED=1`
- [ ] All JWT/Session secrets

### Verification
- [ ] Test database connection: `curl https://your-domain.com/api/health/db`
- [ ] Check worker logs for successful ingestion
- [ ] Test Mustek search: `curl "https://your-domain.com/api/search?q=iphone&supplier=mustek"`
- [ ] Verify products in database: `SELECT COUNT(*) FROM products WHERE supplier_name = 'Mustek';`

---

## 🔍 Debugging Commands

### Check Database Connection
```bash
# From Dockploy terminal or SSH
psql $DATABASE_URL -c "SELECT version();"
```

### Verify Schema
```bash
psql $DATABASE_URL -c "\d products"  # Check products table structure
psql $DATABASE_URL -c "\d suppliers"  # Check suppliers table
```

### Check Mustek Configuration
```bash
psql $DATABASE_URL -c "SELECT name, slug, type, enabled, LEFT(url, 80) as url FROM suppliers WHERE name = 'Mustek';"
```

### Test Worker Connection
```bash
# In worker container/terminal
node -e "require('dotenv').config(); const {Client} = require('pg'); const c = new Client({connectionString: process.env.DATABASE_URL}); c.connect().then(() => console.log('Connected!')).catch(e => console.error(e));"
```

### Check Product Counts
```bash
psql $DATABASE_URL -c "SELECT supplier_name, COUNT(*) FROM products GROUP BY supplier_name;"
```

---

## 📊 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Mustek API Integration | ✅ Working | CSV parser functional, field mapping correct |
| Local Development | ✅ Working | All services running locally |
| Database Schema | ⚠️ Issues | Category column missing in init, migration order unclear |
| Migration Scripts | ⚠️ Bug | Duplicate token in migrate-suppliers.sql |
| VPS Deployment | ❌ Blocked | Database connection issues, missing migrations |
| Docker Setup | ⚠️ Needs Work | Hardcoded credentials, no migration runner |

---

## 🎯 Next Steps

1. **Immediate**: Fix the critical bugs (migrate-suppliers.sql, category column)
2. **Short-term**: Improve database setup process, add migration runner
3. **Medium-term**: Enhance error handling, add monitoring
4. **Long-term**: Automated deployment pipeline, database versioning

---

**Last Updated**: January 2025  
**Reviewer**: AI Assistant  
**Next Review**: After VPS deployment issues resolved
