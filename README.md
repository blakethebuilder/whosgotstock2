# WhosGotStock - Unified IT Sourcing Platform

A comprehensive IT sourcing and stock-checking platform built for South African IT providers, MSPs, and resellers. It aggregates real-time inventory levels, live dealer pricing, and product attributes from South Africa's major IT distributors into a single searchable dashboard.

---

## 🚀 Key Features

### 🔍 Unified Search & Live Inventory
- Real-time search across 15,000+ items from all major distributors.
- Instant stock breakdown by warehouse (specifically Cape Town and Johannesburg).
- Deep filtering by price ranges, stock status, category hierarchy, and brands.
- Interactive side-by-side product comparison (up to 4 products).

### 💰 Tiered Markup & Pricing
- Dynamic pricing display based on user roles and custom markups:
  - **Public**: Retail prices with a standard default markup (e.g., 15%).
  - **Team**: Standard staff-discounts markup (e.g., 10%).
  - **Management**: Internal management tier markup (e.g., 5%).
  - **Admin / Partner**: Raw distributor cost prices.
- Dual-pricing components showing both **Ex VAT** and **Inc VAT** values throughout the UI.

### 📋 Cart, Site Organization & Quotes
- Organizes selected inventory items into custom projects or specific job sites (up to 3 active projects).
- Instant PDF quote generation for clients with markup configurations.

---

## 🏗 System Architecture

The application is split into three decoupled service layers:

```
├── web/                    # Next.js 16.1.1 Frontend & Search API
│   ├── app/                # App Router pages, admin dashboard & API endpoints
│   ├── components/         # Modular UI (BentoDashboard, FilterPanel, Cart, etc.)
│   ├── lib/                # Database pool connection (with SSL support) and utility functions
│   └── public/             # Static brand assets and icons
│
├── worker/                 # Background Node.js Ingestion Engine
│   ├── src/                # Ingest logic and mapping middleware
│   ├── index.js            # Ingestion scheduler loop
│   └── src/drivers/        # Supplier-specific parser plugins
│
└── database/               # Relational Database Layer
    ├── init.sql            # Core database schema
    ├── migrations/         # Versioned schema updates and supplier migrations
    └── run-migrations.sh   # Automated migration runner script
```

---

## 🔌 Integrated Suppliers & Drivers

Each supplier has a dedicated parsing driver located in `worker/src/drivers/`:

| Supplier | Slug | Type | Authentication / Feed Format | Location Stock Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Scoop** | `scoop` | XML | HTTP XML feed (Anonymous) | National aggregate |
| **Esquire** | `esquire` | XML | HTTP XML feed with email & password | National aggregate |
| **Pinnacle** | `pinnacle` | XML | HTTP XML feed with API keys | National aggregate |
| **Syntech** | `syntech` | XML | HTTP XML feed with API keys | National aggregate |
| **Mustek** | `mustek` | CSV | HTTP CSV API with Customer Token | National aggregate |
| **Even Flow** | `evenflow` | JSON | Axios API fetch with bearer auth | National aggregate |
| **Linkqage** | `linkqage` | JSON | FTGDrop JSON API with pagination & token | Segmented (JHB / CPT) |

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whosgotstock
DATABASE_SSL=false                       # Set to 'true' for production with SSL

# Authentication & Access Control
JWT_SECRET=your-super-secret-jwt-key
TEAM_ACCESS_CODE=your-team-code
MANAGEMENT_ACCESS_CODE=your-management-code
ADMIN_ACCESS_CODE=your-admin-code

# Supplier Credentials
ESQUIRE_EMAIL=your-email@example.com
ESQUIRE_PASSWORD=your-password
MUSTEK_CUSTOMER_TOKEN=your-mustek-token
SYNTECH_API_KEY=your-syntech-key
PINNACLE_UID=your-pinnacle-uid
PINNACLE_API_KEY=your-pinnacle-key
EVENFLOW_API_URL=https://api.evenflow.com/v1
EVENFLOW_API_KEY=your-evenflow-key
LINKQAGE_TOKEN=your-linkqage-token

# Ingestion Settings
UPDATE_INTERVAL_MINUTES=60
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Install web app packages
cd web
npm install

# Install worker packages
cd ../worker
npm install
```

### 2. Database Ingestion & Schema Setup
Make sure you have a running PostgreSQL instance locally, then:
```bash
# Run the migrations runner to create the tables, supplier rows, and settings
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whosgotstock ./database/run-migrations.sh
```

### 3. Start Development Servers
```bash
# Run Frontend (localhost:3000)
cd web
npm run dev

# Run Worker (in another terminal window)
cd worker
node index.js
```

---

## 🐳 Docker Deployment

The application is completely containerized. You can launch the frontend, worker, migrations runner, and database with:

```bash
docker-compose up -d --build
```

- **Next.js Web Client**: Exposed on port `3000`.
- **Database Migrations**: Automatically runs `run-migrations.sh` on startup before the worker starts.
- **Data Persistence**: Postgres data is saved inside the `postgres_data` volume.

---

## 🌐 Production VPS / PaaS Deployment Guide

To deploy onto a production VPS or PaaS engine (like Render, DigitalOcean, or Dockploy):

1. **Database Set Up**: Point `DATABASE_URL` to your production PostgreSQL database. Set `DATABASE_SSL=true`.
2. **Setup DB Schema**:
   - Deploy your application code.
   - Access the **Admin Control Center** inside the web app and click the **Setup Database** button in the **Maintenance** section. This executes `/api/admin/setup-db` to create all required tables, indexes, and default settings.
   - Alternatively, SSH into your VPS and run `DATABASE_URL=... ./database/run-migrations.sh`.
3. **Configure Environment Variables**: Supply all credentials and tokens inside your host environment dashboard.
4. **Ingestion Scheduling**: The background worker service will fetch automatically in the background based on the `UPDATE_INTERVAL_MINUTES` setting in the DB.

---

## 🧪 Testing & Diagnostics

### Test Database Connection
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whosgotstock"
node database/test-connection.js
```

### Verify Supplier Product Ingest Counts
```bash
psql $DATABASE_URL -c "SELECT supplier_name, COUNT(*) FROM products GROUP BY supplier_name;"
```

### Run Web Production Build
```bash
cd web
npm run build
```

---

## 🛡️ Security & Access Control
- **Database Safety**: Parameterized SQL queries block SQL injection.
- **Passphrase Portal**: Standard users view retail prices. Staff enters role-based passphrases inside the portal modal to unlock cost prices and dashboard metrics.
- **Session Tokens**: JWT-based session tokens with HTTP-only cookies prevent token stealing.
- **Ingestion Failures**: Driver errors are isolated so that if one supplier feed fails, it does not stop the ingestion of other suppliers.

---

**Last Updated**: June 2026  
**Maintainer**: Smart Integrate Development Team
