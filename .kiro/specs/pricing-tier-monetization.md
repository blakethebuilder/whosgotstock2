# Pricing Tier Monetization Strategy - WhosGotStock SaaS Platform

## Overview
Transform WhosGotStock from an internal Smart Integrate tool into a monetizable SaaS platform for IT companies and MSPs across South Africa, while maintaining internal access for Smart Integrate operations.

## Current State Analysis
- **Current Tiers**: Public (15% markup), Staff (10% markup), Manager (5% markup), Admin (0% markup)
- **Authentication**: Simple passphrase-based system
- **Target Market**: Currently internal tool, expanding to external IT companies/MSPs
- **Value Proposition**: Aggregates pricing/stock from 5+ major SA suppliers (Scoop, Esquire, Pinnacle, Mustek, Miro)

## Updated Tier Structure (Final)
Replace current internal tiers with commercial SaaS tiers:

#### **Free Tier** (Public Access)
- **Target**: Trial users, small IT shops
- **Pricing**: Free with limitations
- **Features**:
  - 25 searches per month (reduced from 50)
  - Basic product information
  - Watermarked quotes
  - 15% markup on pricing
  - No direct supplier contact info
  - Limited to 10 products per quote

#### **Professional Tier** 
- **Target**: Small to medium IT companies
- **Pricing**: R399/month (increased from R299)
- **Features**:
  - Unlimited searches
  - Full product details
  - Professional quotes (no watermark)
  - 5% handling fee (reduced from 8%)
  - Supplier contact information
  - Up to 50 products per quote
  - Email support
  - Basic analytics dashboard

#### **Enterprise Tier**
- **Target**: Large IT companies, MSPs with teams
- **Pricing**: R1599/month (increased from R799-1299)
- **Features**:
  - Everything in Professional
  - No markup (cost pricing for resellers)
  - Multi-user accounts (up to 10 users)
  - White label solution
  - Custom branding on quotes
  - Priority support
  - Advanced analytics & reporting
  - Bulk quote management

#### **Staff Tier** (Internal Smart Integrate - Hidden)
- **Target**: Smart Integrate field staff
- **Pricing**: Internal access via secret passphrase
- **Features**:
  - Unlimited searches
  - 10% markup (configurable in admin)
  - All Professional features
  - Access to admin portal
  - Used during field deployment before public launch

#### **Partner Tier** (Internal Smart Integrate Admin)
- **Target**: Smart Integrate management/admin
- **Pricing**: Internal access
- **Features**:
  - Cost price access (0% markup)
  - Full admin portal access
  - All Enterprise features
  - Direct supplier integration management
  - Complete system administration

### 2. User Management System

#### Authentication & Authorization
- Replace passphrase system with proper user accounts
- Email-based registration and login
- Role-based access control
- Session management with JWT tokens

#### Account Management
- User registration flow
- Email verification
- Password reset functionality
- Profile management
- Subscription management

#### Multi-User Support (Enterprise)
- Organization/team management
- User invitation system
- Role assignment within organizations
- Usage tracking per organization

### 3. Subscription Management

#### Billing Integration
- Integrate with South African payment gateway (PayFast/PayGate)
- Monthly/annual billing cycles
- Automatic subscription renewal
- Invoice generation
- Payment failure handling

#### Usage Tracking & Limits
- Search count tracking
- Quote generation limits
- API call tracking (future)
- Usage analytics and reporting
- Overage handling and notifications

#### Subscription Lifecycle
- Free trial period (14 days)
- Upgrade/downgrade flows
- Cancellation handling
- Grace periods for payment failures
- Data retention policies

### 4. Feature Restrictions by Tier

#### Search Limitations
- Free: 50 searches/month with rate limiting
- Professional/Enterprise: Unlimited searches
- Usage tracking and enforcement

#### Quote Features
- Free: Basic quotes with watermark
- Professional: Professional quotes, company branding
- Enterprise: Custom branding, bulk management

#### Data Access
- Free: Limited supplier information
- Professional: Full supplier details
- Enterprise: Advanced analytics, reporting

### 5. User Interface Updates

#### Pricing Display
- Clear tier-based pricing with discount indicators
- "Upgrade to see better pricing" prompts for Free users
- Subscription status in user dashboard
- Usage meters and limits display

#### Upgrade Prompts
- Strategic placement of upgrade CTAs
- Feature comparison tables
- Usage limit notifications
- Trial expiration warnings

#### Account Dashboard
- Subscription status and billing
- Usage analytics
- Team management (Enterprise)
- Support ticket system

## Technical Requirements

### 1. Database Schema Updates

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Organizations Table (Enterprise)
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES users(id),
  tier VARCHAR(50) DEFAULT 'enterprise',
  max_users INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_users (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Usage Tracking
```sql
CREATE TABLE usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action_type VARCHAR(50), -- 'search', 'quote_generation', 'api_call'
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  tier VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  payment_method_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/verify-email` - Email verification

#### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/subscription` - Get subscription details
- `POST /api/user/upgrade` - Upgrade subscription

#### Usage Tracking
- `GET /api/user/usage` - Get current usage stats
- `POST /api/usage/track` - Track usage event

#### Billing
- `POST /api/billing/create-subscription` - Create new subscription
- `POST /api/billing/update-payment` - Update payment method
- `GET /api/billing/invoices` - Get billing history

### 3. Middleware & Guards

#### Rate Limiting
- Implement tier-based rate limiting
- Search count enforcement
- API usage limits

#### Authentication Guards
- JWT token validation
- Route protection based on subscription tier
- Feature access control

#### Usage Enforcement
- Pre-request usage checking
- Graceful limit handling
- Upgrade prompts on limit reached

## Implementation Phases

### Phase 1: User Management Foundation (Week 1-2)
- [ ] Create user registration/login system
- [ ] Implement JWT authentication
- [ ] Update database schema
- [ ] Create user dashboard
- [ ] Migrate existing passphrase system

### Phase 2: Subscription Management (Week 3-4)
- [ ] Integrate payment gateway
- [ ] Implement subscription tiers
- [ ] Create billing dashboard
- [ ] Add usage tracking
- [ ] Implement tier-based restrictions

### Phase 3: Feature Restrictions & UI Updates (Week 5-6)
- [ ] Implement search limits
- [ ] Add upgrade prompts
- [ ] Update pricing display
- [ ] Create feature comparison pages
- [ ] Add usage meters

### Phase 4: Enterprise Features (Week 7-8)
- [ ] Multi-user organization support
- [ ] Team management interface
- [ ] Advanced analytics dashboard
- [ ] Custom branding options
- [ ] Bulk quote management

### Phase 5: Marketing & Launch (Week 9-10)
- [ ] Landing page optimization
- [ ] Pricing page creation
- [ ] Email marketing setup
- [ ] Customer onboarding flow
- [ ] Support documentation

## Success Metrics

### Business Metrics
- Monthly Recurring Revenue (MRR) target: R50,000 by month 6
- Customer Acquisition Cost (CAC) < R500
- Customer Lifetime Value (CLV) > R5,000
- Conversion rate from Free to Paid > 15%

### Usage Metrics
- Daily Active Users (DAU)
- Search volume per tier
- Quote generation rates
- Feature adoption rates

### Technical Metrics
- System uptime > 99.5%
- Search response time < 500ms
- Payment processing success rate > 98%

## Risk Mitigation

### Technical Risks
- **Database migration**: Implement gradual migration with rollback plan
- **Payment integration**: Thorough testing in sandbox environment
- **Performance impact**: Load testing with usage limits

### Business Risks
- **Customer acquisition**: Start with existing Smart Integrate network
- **Pricing sensitivity**: A/B test pricing tiers
- **Competition**: Focus on unique SA supplier integration

### Operational Risks
- **Support scaling**: Implement tiered support system
- **Billing disputes**: Clear terms and automated dispute handling
- **Data security**: Implement SOC 2 compliance measures

## Next Steps

1. **Stakeholder Approval**: Review and approve pricing strategy
2. **Technical Architecture**: Finalize database design and API structure
3. **Payment Gateway Setup**: Choose and integrate SA payment provider
4. **Development Sprint Planning**: Break down into 2-week sprints
5. **Beta Testing Program**: Recruit initial customers from Smart Integrate network

---

**Note**: This spec focuses on transforming WhosGotStock into a commercial SaaS platform while maintaining its core value proposition for the South African IT market. The phased approach allows for gradual rollout and risk mitigation.