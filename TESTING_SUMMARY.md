# Database Testing Tools - Summary

I've created comprehensive testing tools to help you verify your database setup before and after VPS deployment.

## 🛠️ Tools Created

### 1. **Database Connection Test Script** 
   - **File**: `database/test-connection.js`
   - **Purpose**: Comprehensive database health check
   - **Checks**:
     - ✅ Connection status
     - ✅ PostgreSQL version
     - ✅ All required tables exist
     - ✅ Products table has category column
     - ✅ Mustek supplier configured
     - ✅ API tokens in settings
     - ✅ Product counts by supplier

### 2. **Quick Test Script**
   - **File**: `test-db.sh`
   - **Purpose**: Easy one-command testing
   - **Usage**: `./test-db.sh [database_url]`

### 3. **Migration Runner**
   - **File**: `database/run-migrations.sh`
   - **Purpose**: Run all migrations in correct order
   - **Usage**: `./database/run-migrations.sh`

### 4. **Quick Test Guide**
   - **File**: `database/QUICK_TEST.md`
   - **Purpose**: Step-by-step testing instructions

---

## 🚀 Quick Start

### Test Your Local Database

```bash
# Option 1: Use the quick test script
export DATABASE_URL="postgresql://bfmacbook@localhost:5432/whosgotstock"
./test-db.sh

# Option 2: Run directly
cd worker
node ../database/test-connection.js
```

### Test Your VPS Database

```bash
# SSH to your VPS
ssh user@your-vps-ip

# Set database URL
export DATABASE_URL="postgresql://user:password@host:5432/whosgotstock"

# Run test
cd /path/to/your/app
./test-db.sh
```

---

## 📋 What Gets Tested

The test script checks:

1. **Connection** ✅
   - Can connect to database
   - SSL configuration (if needed)

2. **Schema** ✅
   - All required tables exist
   - Products table has category column
   - Indexes are present

3. **Configuration** ✅
   - Mustek supplier exists
   - Mustek URL has valid token
   - API tokens in settings table

4. **Data** ✅
   - Product counts by supplier
   - Mustek products present (if worker has run)

---

## 🐛 Common Issues & Fixes

### Issue: "pg module not found"
**Fix**: 
```bash
cd worker
npm install
```

### Issue: "Connection refused"
**Fix**: 
- Check DATABASE_URL format
- Verify database is running
- Check firewall/network

### Issue: "Mustek supplier not found"
**Fix**:
```bash
psql "$DATABASE_URL" -f database/migrate-suppliers.sql
```

### Issue: "category column missing"
**Fix**:
```bash
psql "$DATABASE_URL" -f database/migrations/002_add_category_column.sql
```

---

## ✅ Expected Output

When everything is working, you should see:

```
🔍 Testing database connection...

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

5️⃣  Checking suppliers...
   ✅ Found 5 suppliers
   ✅ Mustek supplier found!
   ✅ Mustek URL configured

6️⃣  Checking settings...
   ✅ MUSTEK_CUSTOMER_TOKEN is set

7️⃣  Checking product counts...
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

---

## 🔄 Before VPS Deployment

1. **Run migrations locally first**:
   ```bash
   ./database/run-migrations.sh
   ```

2. **Test locally**:
   ```bash
   ./test-db.sh
   ```

3. **Fix any issues** before deploying to VPS

4. **On VPS**, run migrations again:
   ```bash
   ./database/run-migrations.sh
   ```

5. **Test on VPS**:
   ```bash
   ./test-db.sh
   ```

---

## 📝 Note About migrate-suppliers.sql

I noticed you reverted the fix to `migrate-suppliers.sql`. The current version (lines 8-9) will concatenate the token from settings AND the hardcoded token, which might create an invalid URL like:

```
...?CustomerToken=f49294f4-cf6b-429c-895f-d27d539cdac4f49294f4-cf6b-429c-895f-d27d539cdac4
```

The test script will detect this and warn you if the token appears invalid. If you see this warning, you may want to fix the SQL to use only one token source.

---

## 🎯 Next Steps

1. **Test your local database** using `./test-db.sh`
2. **Fix any issues** found by the test
3. **Deploy to VPS** following `VPS_DEPLOYMENT_GUIDE.md`
4. **Test on VPS** using the same script
5. **Verify Mustek API** is working with product search

---

**Ready to test?** Run `./test-db.sh` now! 🚀
