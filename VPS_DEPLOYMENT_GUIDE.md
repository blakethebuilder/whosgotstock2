# VPS Deployment Guide - WhosGotStock

**Quick Reference for Deploying to VPS/Dockploy**

## 🚨 Critical Fixes Applied

1. ✅ Fixed `migrate-suppliers.sql` - removed duplicate token bug
2. ✅ Added `category` column to `init.sql` products table
3. ✅ Made SSL configurable in `web/lib/db.ts`

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup

#### Option A: Using Dockploy's PostgreSQL Service
1. Create PostgreSQL database in Dockploy
2. Note the connection details:
   - Host: `your-db-host.dockploy.internal` or IP
   - Port: `5432`
   - Database: `whosgotstock`
   - User: `postgres` (or custom)
   - Password: (from Dockploy)

#### Option B: External PostgreSQL
1. Ensure PostgreSQL 15+ is installed
2. Create database: `createdb whosgotstock`
3. Create user (if needed): `createuser -P youruser`

### 2. Run Database Migrations

**IMPORTANT**: Run migrations BEFORE starting the application!

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host:5432/whosgotstock"

# Run all migrations
cd /path/to/your/app
./database/run-migrations.sh

# OR manually run each migration:
psql "$DATABASE_URL" -f database/init.sql
psql "$DATABASE_URL" -f database/migrate-suppliers.sql
psql "$DATABASE_URL" -f database/migrations/002_add_category_column.sql
# ... etc
```

**Verify migrations**:
```bash
psql "$DATABASE_URL" -c "\d products"  # Should show category column
psql "$DATABASE_URL" -c "SELECT name, slug FROM suppliers WHERE name = 'Mustek';"  # Should return Mustek
```

### 3. Environment Variables (Dockploy)

Add these in Dockploy's environment variables section:

#### Required Database Variables
```
DATABASE_URL=postgresql://user:password@host:5432/whosgotstock
DATABASE_SSL=false  # Set to 'true' if your database requires SSL
```

#### Supplier API Credentials
```
MUSTEK_CUSTOMER_TOKEN=f49294f4-cf6b-429c-895f-d27d539cdac4
ESQUIRE_EMAIL=blake@smartintegrate.co.za
ESQUIRE_PASSWORD=Smart@1991
SYNTECH_API_KEY=668EFF7-494A-43B9-90A8-E72B79648CFC
PINNACLE_API_KEY=942709f3-9b39-4e93-9a5e-cdd883453178
```

#### Application Settings
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
UPDATE_INTERVAL_MINUTES=60
```

#### Security (Generate secure values!)
```
JWT_SECRET=your-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret
TEAM_ACCESS_CODE=your-team-code
MANAGEMENT_ACCESS_CODE=your-management-code
ADMIN_ACCESS_CODE=your-admin-code
```

#### Frontend Public Variables
```
NEXT_PUBLIC_ESQUIRE_EMAIL=blake@smartintegrate.co.za
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "relation products does not exist"
**Cause**: Migrations haven't run  
**Solution**: Run `./database/run-migrations.sh` or manually run `init.sql`

### Issue 2: "column category does not exist"
**Cause**: Old database schema, missing migration  
**Solution**: Run `database/migrations/002_add_category_column.sql` OR recreate database with updated `init.sql`

### Issue 3: "connection refused" or "timeout"
**Cause**: Wrong DATABASE_URL or database not accessible  
**Solution**: 
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Test connection: `psql "$DATABASE_URL" -c "SELECT 1;"`
- Check firewall/network access
- If using SSL, set `DATABASE_SSL=true`

### Issue 4: "Mustek supplier not found"
**Cause**: `migrate-suppliers.sql` hasn't run  
**Solution**: Run `psql "$DATABASE_URL" -f database/migrate-suppliers.sql`

### Issue 5: "SSL connection required"
**Cause**: Database requires SSL but it's disabled  
**Solution**: Set `DATABASE_SSL=true` in environment variables

### Issue 6: Worker can't connect to database
**Cause**: Worker container doesn't have DATABASE_URL  
**Solution**: Ensure Dockploy passes environment variables to worker service

---

## ✅ Verification Steps

### 1. Database Connection
```bash
# Test connection
curl https://your-domain.com/api/health/db

# Should return:
# {
#   "status": "connected",
#   "existingTables": ["products", "suppliers", "settings", ...],
#   "allTablesExist": true
# }
```

### 2. Mustek Supplier Configuration
```bash
psql "$DATABASE_URL" -c "SELECT name, slug, type, enabled, LEFT(url, 80) as url FROM suppliers WHERE name = 'Mustek';"

# Should show:
# name  | slug   | type | enabled | url
# ------|--------|------|---------|-----
# Mustek| mustek | csv  | t       | https://api.mustek.co.za/Customer/ItemsStock.ashx?CustomerToken=...
```

### 3. Worker Ingestion
```bash
# Check worker logs (in Dockploy or via docker logs)
# Should see:
# "Starting ingest for Mustek (Type: csv)..."
# "Parsed X CSV rows for Mustek"
# "Found X products for Mustek"
```

### 4. API Search
```bash
# Test Mustek search
curl "https://your-domain.com/api/search?q=iphone&supplier=mustek"

# Should return products with supplier_name: "Mustek"
```

### 5. Product Counts
```bash
psql "$DATABASE_URL" -c "SELECT supplier_name, COUNT(*) FROM products GROUP BY supplier_name;"

# Should show Mustek with product count > 0
```

---

## 🐳 Docker Compose (If Using)

If deploying with docker-compose (not Dockploy), update `docker-compose.yml`:

```yaml
services:
  web:
    environment:
      - DATABASE_URL=${DATABASE_URL}  # Use env var, not hardcoded
      - DATABASE_SSL=${DATABASE_SSL:-false}
      # ... other vars
  
  worker:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MUSTEK_CUSTOMER_TOKEN=${MUSTEK_CUSTOMER_TOKEN}
      # ... other vars
```

Then:
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@host:5432/whosgotstock
DATABASE_SSL=false
MUSTEK_CUSTOMER_TOKEN=f49294f4-cf6b-429c-895f-d27d539cdac4
# ... etc
EOF

# Run migrations first!
./database/run-migrations.sh

# Then start services
docker-compose up -d
```

---

## 📞 Troubleshooting Commands

### Check Database Connection
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

### Check Table Structure
```bash
psql "$DATABASE_URL" -c "\d products"
psql "$DATABASE_URL" -c "\d suppliers"
```

### Check Environment Variables
```bash
# In Dockploy terminal or container
env | grep DATABASE
env | grep MUSTEK
```

### Check Worker Logs
```bash
# Dockploy: View logs in dashboard
# Docker: 
docker-compose logs -f worker
```

### Test Mustek API Directly
```bash
curl "https://api.mustek.co.za/Customer/ItemsStock.ashx?CustomerToken=f49294f4-cf6b-429c-895f-d27d539cdac4" | head -20
```

---

## 🎯 Quick Start (TL;DR)

1. **Setup Database**: Create PostgreSQL database
2. **Run Migrations**: `./database/run-migrations.sh`
3. **Set Environment Variables**: In Dockploy dashboard
4. **Deploy**: Push to Dockploy
5. **Verify**: Check `/api/health/db` endpoint
6. **Test**: Search for Mustek products

---

**Last Updated**: January 2025  
**Status**: Ready for deployment after fixes
