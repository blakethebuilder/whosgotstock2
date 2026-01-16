#!/bin/bash

# Setup environment variables with current API credentials
# Copy and paste these commands to configure your environment

echo "🔧 Setting up environment variables for WhosGotStock..."

# Worker environment (backend)
cd worker

# Create .env file with current API credentials
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://bfmacbook@localhost:5432/whosgotstock

# Supplier API Credentials
# Esquire API
ESQUIRE_EMAIL=blake@smartintegrate.co.za
ESQUIRE_PASSWORD=Smart@1991

# Mustek API
MUSTEK_CUSTOMER_TOKEN=f49294f4-cf6b-429c-895f-d27d539cdac4

# Syntech API
SYNTECH_API_KEY=668EFF7-494A-43B9-90A8-E72B79648CFC

# Pinnacle API
PINNACLE_UID=942709f3-9b39-4e93-9a5e-cdd883453178
PINNACLE_API_KEY=942709f3-9b39-4e93-9a5e-cdd883453178

# Evenflow API
EVENFLOW_EMAIL=blake@smartintegrate.co.za
EVENFLOW_PASSWORD=Smart@2026!

# Application Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Worker Settings
UPDATE_INTERVAL_MINUTES=60

# Security
JWT_SECRET=your-jwt-secret-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production
EOF

echo "✅ Worker .env file created successfully!"

# Web environment (frontend)
cd ../web

# Create .env.local file for Next.js
cat > .env.local << EOF
# Database Configuration
DATABASE_URL=postgresql://bfmacbook@localhost:5432/whosgotstock

# Public environment variables for frontend
NEXT_PUBLIC_ESQUIRE_EMAIL=blake@smartintegrate.co.za

# Application Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF

echo "✅ Web .env.local file created successfully!"

# Database setup
echo "🗄️ Setting up database..."
createdb whosgotstock 2>/dev/null || echo "Database already exists"

# Run database initialization
psql -d whosgotstock -f ../database/init.sql 2>/dev/null || echo "Database already initialized"

# Run supplier migration (IMPORTANT for Mustek API)
psql -d whosgotstock -f ../database/migrate-suppliers.sql

echo "🎉 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start worker: cd worker && node index.js"
echo "2. Start web app: cd web && npm run dev -- --webpack"
echo "3. Test Mustek search: curl 'http://localhost:3000/api/search?q=iphone&supplier=mustek'"
echo ""
echo "🔒 Remember to update JWT_SECRET and SESSION_SECRET for production!"
