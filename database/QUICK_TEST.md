# Quick Database Test Guide

## 🚀 Quick Test Commands

### 1. Test Database Connection

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host:5432/whosgotstock"

# Run the test script
node database/test-connection.js
```

### 2. Test Locally (if you have local PostgreSQL)

```bash
# If using local database
export DATABASE_URL="postgresql://bfmacbook@localhost:5432/whosgotstock"
node database/test-connection.js
```

### 3. Test on VPS (via SSH)

```bash
# SSH to your VPS
ssh user@your-vps-ip

# Navigate to app directory
cd /path/to/your/app

# Set database URL
export DATABASE_URL="postgresql://user:password@host:5432/whosgotstock"

# Run test
node database/test-connection.js
```

## ✅ What the Test Checks

1. **Connection** - Can we connect to the database?
2. **Version** - What PostgreSQL version?
3. **Tables** - Do all required tables exist?
4. **Schema** - Does products table have all required columns (including category)?
5. **Suppliers** - Is Mustek supplier configured?
6. **Settings** - Are API tokens stored?
7. **Data** - Are there products in the database?

## 🔧 If Tests Fail

### Connection Failed
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Verify database is running
- Check firewall/network access
- If SSL required: `export DATABASE_SSL=true`

### Tables Missing
```bash
# Run migrations
./database/run-migrations.sh
```

### Mustek Supplier Missing
```bash
# Run supplier migration
psql "$DATABASE_URL" -f database/migrate-suppliers.sql
```

### Category Column Missing
```bash
# Run migration
psql "$DATABASE_URL" -f database/migrations/002_add_category_column.sql
```

## 📝 Expected Output

```
🔍 Testing database connection...

Database URL: postgresql://user:****@host:5432/whosgotstock

1️⃣  Testing connection...
   ✅ Connected successfully

2️⃣  Checking PostgreSQL version...
   ✅ PostgreSQL 15.4

3️⃣  Checking required tables...
   ✅ products exists (1234 rows)
   ✅ suppliers exists (5 rows)
   ✅ settings exists (10 rows)
   ✅ manual_products exists (0 rows)

4️⃣  Checking products table structure...
   ✅ All required columns exist
   Columns: id, master_sku, supplier_sku, supplier_name, name, brand, price_ex_vat, qty_on_hand, last_updated, raw_data, image_url, description, category

5️⃣  Checking suppliers...
   ✅ Found 5 suppliers:
      ✅ Esquire (esquire) - xml
      ✅ Mustek (mustek) - csv
      ✅ Pinnacle (pinnacle) - xml
      ✅ Scoop (scoop) - xml
      ✅ Syntech (syntech) - xml

   ✅ Mustek supplier found!
   ✅ Mustek URL configured (token length: 36)

6️⃣  Checking settings...
   ✅ MUSTEK_CUSTOMER_TOKEN is set
   ✅ update_interval_minutes = 60
   ...

7️⃣  Checking product counts...
   Product counts by supplier:
      Mustek: 1234 products
      Esquire: 567 products
      ...

   ✅ Mustek has 1234 products

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Database connection: OK
✅ All required tables: OK
✅ Mustek supplier: Configured
✅ No errors found

🎉 Database is ready for deployment!
```
