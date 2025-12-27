# WhosGotStock - IT Sourcing Platform

## Overview
WhosGotStock is a comprehensive IT sourcing platform built specifically for IT companies and MSPs in South Africa. The platform aggregates product data from multiple suppliers (Scoop, Esquire, Pinnacle, Mustek, and Miro) to provide real-time pricing comparison, stock checking, and professional quote generation.

## Target Audience
- **IT Companies**: Need to source hardware and components efficiently
- **Managed Service Providers (MSPs)**: Require bulk purchasing and competitive pricing
- **System Integrators**: Need access to multiple supplier catalogs
- **Procurement Teams**: Want streamlined sourcing workflows

## Key Features

### 🔍 **Unified Search**
- Search across 15,000+ IT products from 5 major suppliers
- Real-time stock level checking
- Advanced filtering (price range, supplier, stock status)
- Intelligent search with synonyms and brand matching

### 💰 **Tiered Pricing System**
- **Free Tier**: 25 searches/month, 15% markup, watermarked quotes
- **Professional**: R399/month, unlimited searches, 5% handling fee
- **Enterprise**: R1599/month, white-labeled, no markup
- **Staff**: Internal Smart Integrate tier, 10% markup (configurable)
- **Partner**: Admin access with cost pricing

### 📊 **Professional Tools**
- Shopping cart with bulk ordering
- Product comparison across suppliers
- Professional quote generation
- Email templates for procurement
- Usage tracking and analytics

### 🔧 **Admin Portal**
- Supplier management (XML feeds)
- Manual product import (Excel/CSV)
- Pricing tier configuration
- System settings and monitoring
- Web scraping framework (experimental)

## Technical Architecture

### Frontend (Next.js 16.1.1)
```
web/
├── app/
│   ├── page.tsx              # Main search interface
│   ├── admin/page.tsx        # Admin portal
│   ├── components/           # Reusable UI components
│   ├── api/                  # API routes
│   └── types.ts              # TypeScript definitions
├── lib/
│   ├── db.ts                 # Database connection
│   ├── pricing.ts            # Centralized pricing logic
│   ├── api-response.ts       # Standardized API responses
│   └── search-utils.ts       # Search enhancement utilities
└── globals.css               # Tailwind component classes
```

### Backend Services (Node.js)
```
worker/
├── src/
│   ├── ingestor.js           # XML feed processing
│   ├── linkqage-scraper.js   # Linkqage supplier scraper
│   └── generic-scraper.js    # Web scraping framework
├── suppliers.json            # Supplier configurations
└── package.json              # Dependencies
```

### Database (PostgreSQL)
```sql
-- Core Tables
products              # Main product catalog (15K+ items)
suppliers             # Supplier configurations
manual_products       # Manually imported products
settings              # System configuration

-- Indexes for Performance
idx_products_name     # Product name search
idx_products_brand    # Brand filtering
idx_products_category # Category filtering
```

## Data Sources

### XML Feeds (Automated)
- **Scoop**: IT hardware and components
- **Esquire**: Networking and enterprise equipment
- **Pinnacle**: General IT supplies
- **Syntech**: Specialized IT products

### Manual Import
- **Even Flow**: Excel/CSV distributor files
- **Custom Suppliers**: Ad-hoc product imports

### Web Scraping (Experimental)
- **Linkqage**: Automated product extraction
- **Generic Framework**: Configurable scraping

## Deployment Architecture

### Production Environment
- **Frontend**: Next.js on Dockploy (VPS)
- **Database**: PostgreSQL on Dockploy
- **Worker**: Node.js background processes
- **CDN**: Static assets and images

### Development Environment
```bash
# Frontend Development
cd web
npm install
npm run dev

# Worker Development
cd worker
npm install
node index.js

# Database Setup
docker-compose up postgres
```

## Recent Improvements (December 2024)

### Code Quality Enhancements
- ✅ **Centralized Pricing Logic**: Eliminated duplication across 3 components
- ✅ **Standardized API Responses**: Consistent error handling and response format
- ✅ **Component Cleanup**: Removed unused imports and optimized React components
- ✅ **Tailwind Component Classes**: Added consistent styling system
- ✅ **Removed Unused Code**: Cleaned up 3 unused API routes

### User Experience Improvements
- ✅ **Mobile Optimization**: Fixed passphrase input issues on mobile devices
- ✅ **Enhanced Messaging**: Updated homepage copy for IT companies and MSPs
- ✅ **Professional Quotes**: Improved quote generation and email templates
- ✅ **Admin Portal**: Streamlined supplier management interface

### Performance Optimizations
- ✅ **Database Indexing**: Added missing indexes for faster searches
- ✅ **Search Debouncing**: Reduced API calls with intelligent search delays
- ✅ **Component Lazy Loading**: Optimized bundle size and load times

## Business Model

### Revenue Streams
1. **Subscription Tiers**: Monthly recurring revenue from Professional/Enterprise users
2. **Transaction Fees**: Handling fees on Professional tier orders
3. **White Label**: Enterprise customers pay premium for branded experience
4. **Partner Program**: Revenue sharing with Smart Integrate

### Market Position
- **Competitive Advantage**: Only platform aggregating all major SA IT suppliers
- **Target Market**: 500+ IT companies and MSPs in South Africa
- **Value Proposition**: "One search, all suppliers, instant results"

## Future Roadmap

### Phase 1 (Q1 2025)
- [ ] Advanced analytics dashboard
- [ ] Bulk order processing
- [ ] Supplier API integrations
- [ ] Mobile app development

### Phase 2 (Q2 2025)
- [ ] AI-powered product recommendations
- [ ] Automated procurement workflows
- [ ] Integration with accounting systems
- [ ] Multi-currency support

### Phase 3 (Q3 2025)
- [ ] Marketplace expansion (African markets)
- [ ] Vendor management tools
- [ ] Advanced reporting and insights
- [ ] Enterprise SSO integration

## Development Guidelines

### Code Standards
- **TypeScript**: Strict typing for all new code
- **Component Architecture**: Functional components with hooks
- **Styling**: Tailwind CSS with component classes
- **API Design**: RESTful endpoints with standardized responses

### Performance Requirements
- **Search Response**: < 500ms for product queries
- **Page Load**: < 2s for initial page load
- **Database Queries**: Optimized with proper indexing
- **Mobile Performance**: 90+ Lighthouse score

### Security Measures
- **Authentication**: Passphrase-based tier access
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API endpoint protection
- **Database Security**: Parameterized queries, connection pooling

## Support and Maintenance

### Monitoring
- **Database Health**: Connection monitoring and query performance
- **API Performance**: Response time tracking
- **Error Logging**: Comprehensive error tracking and alerts
- **Usage Analytics**: User behavior and feature adoption

### Backup Strategy
- **Database**: Daily automated backups
- **Code**: Git version control with branch protection
- **Configuration**: Environment variable management
- **Documentation**: Up-to-date technical documentation

---

**Last Updated**: December 27, 2024  
**Version**: 2.1.0  
**Maintainer**: Smart Integrate Development Team