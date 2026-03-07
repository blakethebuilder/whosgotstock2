# AI Instructions for WhosGotStock Codebase

## 🏗 Architecture & "Why"

**Major Components:**
- **Frontend**: Next.js 16.1.1 with TypeScript and Tailwind CSS
- **Backend**: Node.js worker service for data ingestion
- **Database**: PostgreSQL 15 with connection pooling
- **Deployment**: Docker/Dockploy on VPS with health checks

**Service Boundaries:**
- `web/`: Next.js frontend with API routes for search and authentication
- `worker/`: Background service that fetches and processes supplier data
- `database/`: Schema definitions, migrations, and initialization scripts

**Rationale:**
- **Next.js**: Chosen for SSR/SSG capabilities and API routes to reduce backend complexity
- **PostgreSQL**: Provides robust relational data model with JSONB support for flexible product data
- **Worker Service**: Decouples data ingestion from web requests for better performance

## 🌐 Environment & Deployment

**Deployment Target:** Dockploy on VPS with Docker Compose

**Networking:**
- Frontend: Port 3000 with health check endpoint `/api/health`
- Worker: Depends on PostgreSQL service with health checks
- Database: PostgreSQL 15 with configurable SSL

**Volumes:**
- PostgreSQL data persisted in Docker volume `postgres_data`
- Database migrations mounted from `./database` directory

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (required)
- `DATABASE_SSL`: Set to 'true' for SSL connections
- `MUSTEK_CUSTOMER_TOKEN`: API token for Mustek supplier
- `ESQUIRE_EMAIL`/`ESQUIRE_PASSWORD`: Credentials for Esquire API
- `JWT_SECRET`: Authentication secret (min 32 chars)
- `TEAM_ACCESS_CODE`, `MANAGEMENT_ACCESS_CODE`, `ADMIN_ACCESS_CODE`: Role-based access codes

## 🔧 Workflows

**Critical Commands:**
```bash
# Local development
cd web && npm run dev
cd worker && node index.js

# Production build
cd web && npm run build

# Database setup
psql $DATABASE_URL -f database/init.sql
./database/run-migrations.sh

# Docker deployment
docker-compose up -d
```

**Key Scripts:**
- `database/run-migrations.sh`: Runs all migrations in order with error handling
- `worker/index.js`: Main worker loop with configurable interval
- `web/lib/db.ts`: Database connection pool with SSL support

## 🔗 Integration Surface

**External APIs:**
- **Mustek**: CSV feed with customer token authentication
- **Esquire**: XML feed with email/password authentication
- **Pinnacle/Syntech**: XML feeds with API keys
- **Evenflow**: JSON API with bearer token

**Cross-Component Communication:**
- Worker queries `suppliers` table to determine which feeds to process
- Frontend API routes query `products` table with joins to `suppliers`
- All components use `DATABASE_URL` environment variable for connection

## 📝 Local Conventions

**Naming Conventions:**
- `snake_case` for database tables and columns
- `camelCase` for JavaScript/TypeScript variables and functions
- `PascalCase` for React components and TypeScript types

**Directory Structure:**
```
web/
├── app/                # Next.js pages and API routes
├── components/         # Reusable UI components
├── lib/                # Utility functions and database
└── public/             # Static assets

worker/
├── src/                # Data ingestion logic
├── suppliers.json      # Supplier configurations
└── drivers/            # Supplier-specific parsers

database/
├── init.sql            # Initial schema
├── migrations/         # Ordered migration scripts
└── run-migrations.sh   # Migration runner
```

**Error Handling:**
- Database errors logged and process exits on critical failures
- API routes return standardized error responses with status codes
- Worker continues on individual supplier failures

**Code Style:**
- TypeScript with strict typing
- Tailwind CSS for styling
- Functional React components with hooks
- RESTful API design with standardized responses

## 📋 Key Patterns

**Database Access:**
```typescript
// web/lib/db.ts
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' 
        ? { rejectUnauthorized: false } 
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
});
```

**API Response Format:**
```json
{
  "results": [...],
  "total": 34,
  "page": 1,
  "limit": 50
}
```

**Supplier Integration:**
```javascript
// worker/src/ingestor.js
async function ingestData(client) {
    const res = await client.query("SELECT * FROM suppliers WHERE enabled = true");
    const suppliers = res.rows.map(r => ({ id: r.slug, name: r.name, url: r.url, type: r.type }));
    // Process each supplier feed
}
```

**Search Implementation:**
```typescript
// web/app/api/search/route.ts
const sql = `
    SELECT p.id, p.name, p.brand, p.price_ex_vat, p.qty_on_hand
    FROM products p
    JOIN suppliers s ON p.supplier_name = s.name
    WHERE s.enabled = true
    AND (p.name ILIKE $1 OR p.supplier_sku ILIKE $1)
`;
```

## 🚀 Getting Started

1. **Setup environment variables** (copy `.env.example` and configure)
2. **Initialize database** (`./database/run-migrations.sh`)
3. **Start services** (`docker-compose up -d`)
4. **Verify deployment** (`curl http://localhost:3000/api/health`)

## 🔍 Debugging

**Common Issues:**
- Database connection failures (check `DATABASE_URL` and SSL settings)
- Missing environment variables (validate with `web/lib/env.ts`)
- Migration order problems (run `run-migrations.sh` manually)

**Debugging Commands:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check worker logs
docker logs worker-service

# Verify migrations
psql $DATABASE_URL -c "\d products"
```
