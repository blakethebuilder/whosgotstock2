# Dockploy Deployment Checklist

## ✅ Pre-Deployment Fixes Applied

1. ✅ Fixed Next.js Turbopack/webpack conflict
2. ✅ Updated Dockerfile build configuration
3. ✅ Updated worker database connection with SSL support
4. ✅ Mustek supplier added to production database

---

## 🔧 Required Environment Variables

### Frontend (whosgotstock-frontend)

#### Database
```
DATABASE_URL=postgresql://postgres:bzzdyv9aet2pdw51@102.214.11.194:5432/postgres
DATABASE_SSL=false
```

#### Application
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

#### Public Variables (if needed)
```
NEXT_PUBLIC_ESQUIRE_EMAIL=blake@smartintegrate.co.za
```

#### Security (Generate secure values!)
```
JWT_SECRET=your-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret
TEAM_ACCESS_CODE=your-team-code
MANAGEMENT_ACCESS_CODE=your-management-code
ADMIN_ACCESS_CODE=your-admin-code
```

---

### Worker (whosgotstock-worker)

#### Database
```
DATABASE_URL=postgresql://postgres:bzzdyv9aet2pdw51@102.214.11.194:5432/postgres
DATABASE_SSL=false
```

#### Supplier API Credentials
```
MUSTEK_CUSTOMER_TOKEN=f49294f4-cf6b-429c-895f-d27d539cdac4
ESQUIRE_EMAIL=blake@smartintegrate.co.za
ESQUIRE_PASSWORD=Smart@1991
SYNTECH_API_KEY=668EFF7-494A-43B9-90A8-E72B79648CFC
PINNACLE_API_KEY=942709f3-9b39-4e93-9a5e-cdd883453178
```

#### Application
```
NODE_ENV=production
UPDATE_INTERVAL_MINUTES=60
```

---

## 📋 Deployment Steps

### 1. Verify Database is Ready

```bash
# Test database connection
export DATABASE_URL="postgresql://postgres:bzzdyv9aet2pdw51@102.214.11.194:5432/postgres"
psql "$DATABASE_URL" -c "SELECT name, slug FROM suppliers WHERE name = 'Mustek';"
# Should return: Mustek | mustek
```

### 2. Set Environment Variables in Dockploy

#### For Frontend Application:
1. Go to Dockploy dashboard
2. Select `whosgotstock-frontend` application
3. Go to Environment Variables section
4. Add all variables listed above for Frontend
5. Save

#### For Worker Application:
1. Go to Dockploy dashboard
2. Select `whosgotstock-worker` application (create if doesn't exist)
3. Go to Environment Variables section
4. Add all variables listed above for Worker
5. Save

### 3. Deploy Frontend

1. In Dockploy, go to `whosgotstock-frontend`
2. Click "Deploy" or "Redeploy"
3. Monitor build logs
4. Build should now succeed (Turbopack issue fixed)

### 4. Deploy Worker

1. In Dockploy, go to `whosgotstock-worker`
2. Click "Deploy" or "Redeploy"
3. Monitor logs to ensure:
   - Database connection successful
   - Suppliers loaded from database
   - Mustek ingestion starts
   - Products being inserted

### 5. Verify Deployment

#### Check Frontend
```bash
# Test health endpoint
curl https://stock.smartintegrate.co.za/api/health/db

# Should return:
# {
#   "status": "connected",
#   "allTablesExist": true,
#   ...
# }
```

#### Check Worker Logs
```bash
# In Dockploy, view worker logs
# Should see:
# "Worker started."
# "Database connected successfully"
# "Loading suppliers from Database..."
# "Starting ingest for Mustek (Type: csv)..."
# "Found X products for Mustek"
```

#### Check Mustek Products
```bash
# Test search API
curl "https://stock.smartintegrate.co.za/api/search?q=iphone&supplier=mustek"

# Should return products with supplier_name: "Mustek"
```

---

## 🐛 Troubleshooting

### Build Fails with Turbopack Error

**Issue**: `ERROR: This build is using Turbopack, with a webpack config`

**Fix**: Already fixed in `web/next.config.ts` and `web/Dockerfile`
- If still failing, ensure `NEXT_PRIVATE_DISABLE_TURBOPACK=1` is set in Dockerfile

### Worker Can't Connect to Database

**Issue**: `DATABASE_URL not set` or connection timeout

**Fix**:
1. Verify `DATABASE_URL` is set in worker environment variables
2. Check database is accessible from Dockploy server
3. If database requires SSL, set `DATABASE_SSL=true`

### Mustek Products Not Appearing

**Issue**: No Mustek products in search results

**Fix**:
1. Verify Mustek supplier exists: `SELECT * FROM suppliers WHERE name = 'Mustek';`
2. Check worker logs for Mustek ingestion
3. Verify `MUSTEK_CUSTOMER_TOKEN` is set in worker environment
4. Check worker can access Mustek API (network/firewall)

### Frontend Can't Connect to Database

**Issue**: API endpoints return database errors

**Fix**:
1. Verify `DATABASE_URL` is set in frontend environment variables
2. Check database connection: `curl https://stock.smartintegrate.co.za/api/health/db`
3. Verify database allows connections from Dockploy server IP

---

## ✅ Post-Deployment Verification

- [ ] Frontend builds successfully
- [ ] Frontend is accessible at https://stock.smartintegrate.co.za/
- [ ] Database health check returns `"status": "connected"`
- [ ] Worker is running and connecting to database
- [ ] Worker logs show Mustek ingestion
- [ ] Mustek products appear in search results
- [ ] All suppliers (Scoop, Esquire, Pinnacle, Syntech, Mustek) working

---

## 📝 Notes

- Database is already configured with Mustek supplier
- Worker will automatically ingest Mustek products on first run
- Update interval is set to 60 minutes (configurable via `UPDATE_INTERVAL_MINUTES`)
- All API credentials are stored in database `settings` table

---

**Last Updated**: January 2025  
**Status**: Ready for deployment
