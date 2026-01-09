# Dockploy Deployment Guide for WhosGotStock

## 🚀 Dockploy Environment Setup

Since you're using Dockploy, you need to set environment variables through the Dockploy interface, not SSH commands.

## 🔧 **Required Environment Variables**

Add these to your Dockploy environment variables:

### Database Configuration
```
DATABASE_URL=postgresql://your-db-user@your-db-host:5432/whosgotstock
```

### Supplier API Credentials
```
ESQUIRE_EMAIL=blake@smartintegrate.co.za
ESQUIRE_PASSWORD=Smart@1991
MUSTEK_CUSTOMER_TOKEN=f49294f4-cf6b-429c-895f-d27d539cdac4
SYNTECH_API_KEY=668EFF7-494A-43B9-90A8-E72B79648CFC
PINNACLE_UID=942709f3-9b39-4e93-9a5e-cdd883453178
PINNACLE_API_KEY=942709f3-9b39-4e93-9a5e-cdd883453178
```

### Frontend Public Variables
```
NEXT_PUBLIC_ESQUIRE_EMAIL=blake@smartintegrate.co.za
```

### Application Settings
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
UPDATE_INTERVAL_MINUTES=60
JWT_SECRET=your-secure-jwt-secret-for-production
SESSION_SECRET=your-secure-session-secret-for-production
```

## 🗄️ **Database Setup on VPS**

Since you're on Dockploy, you need to run the database migration:

### Option 1: Through Dockploy Terminal
```bash
# Access your Dockploy terminal
psql -d whosgotstock -f database/migrate-suppliers.sql
```

### Option 2: SSH to VPS and Run
```bash
# SSH to your VPS
ssh root@your-vps-ip

# Navigate to app directory
cd /path/to/your/app

# Run migration
psql -d whosgotstock -f database/migrate-suppliers.sql
```

## 🔄 **Deployment Steps**

1. **Update Environment Variables in Dockploy**
   - Go to your Dockploy dashboard
   - Add all the environment variables above
   - Save and restart the application

2. **Run Database Migration**
   - Use Dockploy terminal or SSH
   - Run the migrate-suppliers.sql script

3. **Verify Deployment**
   ```bash
   # Test the API
   curl "https://your-domain.com/api/search?q=iphone&supplier=mustek"
   # Should return 34 products
   ```

## 🐳 **Docker Considerations**

Your docker-compose.yml should include environment variables:

```yaml
version: '3.8'

services:
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_ESQUIRE_EMAIL=${NEXT_PUBLIC_ESQUIRE_EMAIL}
      - NODE_ENV=${NODE_ENV}
      - NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}
    depends_on:
      - postgres

  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ESQUIRE_EMAIL=${ESQUIRE_EMAIL}
      - ESQUIRE_PASSWORD=${ESQUIRE_PASSWORD}
      - MUSTEK_CUSTOMER_TOKEN=${MUSTEK_CUSTOMER_TOKEN}
      - SYNTECH_API_KEY=${SYNTECH_API_KEY}
      - PINNACLE_UID=${PINNACLE_UID}
      - PINNACLE_API_KEY=${PINNACLE_API_KEY}
      - NODE_ENV=${NODE_ENV}
      - UPDATE_INTERVAL_MINUTES=${UPDATE_INTERVAL_MINUTES}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## 🔍 **Troubleshooting**

If Mustek search still doesn't work:

1. **Check Environment Variables**
   ```bash
   # In Dockploy terminal
   env | grep MUSTEK
   env | grep ESQUIRE
   ```

2. **Verify Database**
   ```bash
   psql -d whosgotstock -c "SELECT name, url FROM suppliers WHERE name = 'Mustek';"
   ```

3. **Check Logs**
   ```bash
   # View application logs
   docker-compose logs -f worker
   docker-compose logs -f web
   ```

## 🎯 **Expected Result**

After setup, this should work:
```bash
curl "https://your-domain.com/api/search?q=iphone&supplier=mustek"
# Returns: {"results": [...], "total": 34, ...}
```
