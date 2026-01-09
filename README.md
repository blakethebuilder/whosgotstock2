# WhosGotStock - IT Sourcing Platform

A comprehensive IT sourcing platform built for South African IT companies and MSPs, aggregating product data from multiple suppliers to provide real-time pricing comparison and stock checking.

## 🚀 Features

### 🔍 **Unified Product Search**
- Search across 10,000+ IT products from 5 major suppliers
- Real-time stock level checking
- Advanced filtering (price range, supplier, stock status)
- Intelligent search with synonyms and brand matching

### 📊 **Supplier Integration**
- **Scoop**: IT hardware and components (XML feed)
- **Esquire**: Networking and enterprise equipment (XML feed)
- **Pinnacle**: General IT supplies (XML feed)
- **Syntech**: Specialized IT products (XML feed)
- **Mustek**: Hardware and consumer electronics (CSV API) ✨ *NEW*

### 💰 **Tiered Pricing System**
- **Free Tier**: 25 searches/month, 15% markup, watermarked quotes
- **Professional**: R399/month, unlimited searches, 5% handling fee
- **Enterprise**: R1599/month, white-labeled, no markup
- **Staff**: Internal Smart Integrate tier, 10% markup
- **Partner**: Admin access with cost pricing

### 🛠 **Technical Stack**
- **Frontend**: Next.js 16.1.1, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL
- **Worker Services**: Automated data ingestion
- **APIs**: RESTful with standardized responses

## 🏗 Architecture

```
├── web/                    # Next.js frontend application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and database
│   └── public/           # Static assets
├── worker/               # Background data processing
│   ├── src/             # Data ingestion logic
│   └── suppliers.json   # Supplier configurations
├── database/            # Database schema and initialization
└── docker-compose.yml   # Container orchestration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Local Development

1. **Clone repository**
```bash
git clone https://github.com/blakethebuilder/whosgotstock2.git
cd whosgotstock
```

2. **Install dependencies**
```bash
# Frontend
cd web
npm install

# Worker
cd ../worker
npm install
```

3. **Setup database**
```bash
# Create database
createdb whosgotstock

# Run initialization script
psql -d whosgotstock -f database/init.sql

# Run supplier migration (IMPORTANT for Mustek API)
psql -d whosgotstock -f database/migrate-suppliers.sql
```

4. **Configure environment**
```bash
# Worker environment
cd worker
echo "DATABASE_URL=postgresql://username@localhost:5432/whosgotstock" > .env

# Web environment
cd ../web
echo "DATABASE_URL=postgresql://username@localhost:5432/whosgotstock" > .env.local
```

5. **Start services**
```bash
# Start worker (in one terminal)
cd worker
node index.js

# Start web app (in another terminal)
cd web
npm run dev
```

6. **Access the application**
- Web App: http://localhost:3000
- API: http://localhost:3000/api/search

### Production Deployment

#### Database Setup
```bash
# 1. Run database initialization
psql -d whosgotstock -f database/init.sql

# 2. Run supplier migration (CRITICAL for Mustek)
psql -d whosgotstock -f database/migrate-suppliers.sql

# 3. Set environment variables
export DATABASE_URL="postgresql://user@host:5432/whosgotstock"
export MUSTEK_CUSTOMER_TOKEN="your-production-token"
export ESQUIRE_EMAIL="your-production-email"
export ESQUIRE_PASSWORD="your-production-password"
```

#### Environment Variables Required for Production
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Required variables:
DATABASE_URL=postgresql://user@host:5432/whosgotstock
MUSTEK_CUSTOMER_TOKEN=your-mustek-token
ESQUIRE_EMAIL=your-esquire-email
ESQUIRE_PASSWORD=your-esquire-password
SYNTECH_API_KEY=your-syntech-key
PINNACLE_API_KEY=your-pinnacle-key
```

### Docker Deployment

```bash
docker-compose up -d
```

## 📡 API Documentation

### Search API
```bash
GET /api/search?q=iphone&supplier=mustek&min_price=1000&max_price=20000
```

**Parameters:**
- `q`: Search query
- `supplier`: Filter by supplier (scoop, esquire, pinnacle, syntech, mustek)
- `brand`: Filter by brand
- `min_price`/`max_price`: Price range
- `in_stock`: Only show items with stock
- `sort`: relevance, price_asc, price_desc, newest

**Response:**
```json
{
  "results": [...],
  "total": 34,
  "page": 1,
  "limit": 50,
  "searchTerms": ["iphone"]
}
```

## 🔧 Configuration

### Adding New Suppliers

1. **Add to database:**
```sql
INSERT INTO suppliers (name, slug, url, type, enabled) 
VALUES ('NewSupplier', 'newsupplier', 'https://api.example.com/feed', 'xml', true);
```

2. **Configure in worker:**
```json
{
  "id": "newsupplier",
  "name": "NewSupplier", 
  "url": "https://api.example.com/feed",
  "type": "xml",
  "enabled": true
}
```

3. **Implement parser in `worker/src/ingestor.js`**

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment | development |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | 1 |

## 🔄 Data Ingestion

The worker service automatically:
1. Fetches data from all enabled suppliers
2. Parses XML/CSV feeds
3. Normalizes product data
4. Updates PostgreSQL database
5. Saves fallback JSON file

**Manual ingestion:**
```bash
cd worker
node -e "require('./src/ingestor.js').ingestData().then(() => process.exit(0))"
```

## 🧪 Testing

### API Testing
```bash
# Test search
curl "http://localhost:3000/api/search?q=laptop"

# Test supplier filter
curl "http://localhost:3000/api/search?q=iphone&supplier=mustek"
```

### Database Testing
```bash
# Check product counts
psql -d whosgotstock -c "SELECT supplier_name, COUNT(*) FROM products GROUP BY supplier_name;"
```

## 📊 Performance

- **Search Response**: < 500ms for product queries
- **Page Load**: < 2s for initial page load
- **Database**: Optimized with proper indexing
- **Mobile**: 90+ Lighthouse score

## 🔒 Security

- **Authentication**: Passphrase-based tier access
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API endpoint protection
- **Database**: Parameterized queries, connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary to Smart Integrate. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the Smart Integrate development team

---

**Last Updated**: January 2025  
**Version**: 2.2.0 (Mustek Integration)  
**Maintainer**: Smart Integrate Development Team
