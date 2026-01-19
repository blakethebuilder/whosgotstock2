# Docker Deployment Guide for WhosGotStock

## 🚀 Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your actual credentials
nano .env

# 3. Start all services
docker-compose up -d

# 4. Check logs
docker-compose logs -f
```

## 📋 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://user:pass@host:5432/whosgotstock` |
| `POSTGRES_USER` | PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `securepassword` |
| `JWT_SECRET` | JWT secret key (32+ chars) | `your-super-secret-jwt-key` |
| `TEAM_ACCESS_CODE` | Team access passphrase | `team-passphrase` |
| `MANAGEMENT_ACCESS_CODE` | Management access passphrase | `management-passphrase` |
| `ADMIN_ACCESS_CODE` | Admin access passphrase | `admin-passphrase` |

### Supplier API Keys

| Variable | Description | Required |
|----------|-------------|----------|
| `ESQUIRE_EMAIL` | Esquire API email | ✅ Yes |
| `ESQUIRE_PASSWORD` | Esquire API password | ✅ Yes |
| `MUSTEK_CUSTOMER_TOKEN` | Mustek API token | ✅ Yes |
| `SYNTECH_API_KEY` | Syntech API key | ✅ Yes |
| `PINNACLE_UID` | Pinnacle UID | ✅ Yes |
| `PINNACLE_API_KEY` | Pinnacle API key | ✅ Yes |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_SSL` | Enable SSL for database | `false` |
| `NODE_ENV` | Environment mode | `production` |
| `UPDATE_INTERVAL_MINUTES` | Data refresh interval | `60` |
| `EVENFLOW_API_URL` | Evenflow API endpoint | - |
| `EVENFLOW_API_KEY` | Evenflow API key | - |

## 🏗 Services

### 1. Web Service
- **Port**: 3000
- **Health Check**: `GET /api/health`
- **Dependencies**: PostgreSQL
- **Restart Policy**: Always

### 2. Worker Service
- **Purpose**: Data ingestion from suppliers
- **Interval**: Configurable (default: 60 minutes)
- **Health Check**: Database connection test
- **Dependencies**: PostgreSQL, Migrations
- **Restart Policy**: Always

### 3. Migrations Service
- **Purpose**: Run database migrations
- **Run Order**: Before web and worker services
- **Status**: One-time execution
- **Dependencies**: PostgreSQL

### 4. PostgreSQL
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Volume**: `postgres_data` (persistent storage)
- **Health Check**: `pg_isready`
- **Restart Policy**: Always

## 🎯 Deployment Process

### 1. Prepare Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env

# Set all required variables
```

### 2. Start Services

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Verify Deployment

```bash
# Check web service health
curl http://localhost:3000/api/health

# Check database connection
curl http://localhost:3000/api/health/db

# Test search functionality
curl "http://localhost:3000/api/search?q=laptop"
```

## 🔄 Service Management

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
docker-compose logs -f [service]
```

### Check Service Health
```bash
# Web service
docker-compose exec web curl http://localhost:3000/api/health

# Database
docker-compose exec postgres pg_isready -U ${POSTGRES_USER}

# Worker
docker-compose exec worker node -e "require('./src/ingestor.js').testConnection()"
```

## 🐳 Docker Commands

### Build Images
```bash
docker-compose build
```

### Pull Latest Images
```bash
docker-compose pull
```

### Remove Volumes (DANGER: Data loss!)
```bash
docker-compose down -v
```

### Scale Services
```bash
docker-compose up -d --scale worker=2
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection manually
docker-compose exec postgres psql -U ${POSTGRES_USER} -d whosgotstock
```

### Migration Problems
```bash
# Run migrations manually
docker-compose run migrations

# Check migration logs
docker-compose logs migrations
```

### Worker Issues
```bash
# Check worker logs
docker-compose logs worker

# Test worker connection
docker-compose exec worker node -e "require('./src/ingestor.js').testConnection()"
```

## 📊 Monitoring

### Service Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Disk Space
```bash
docker system df
```

## 🔒 Security

### Environment Variables
- Never commit `.env` files to Git
- Use Docker secrets for production
- Rotate API keys regularly

### Database
- Use strong passwords
- Enable SSL in production (`DATABASE_SSL=true`)
- Restrict database port exposure

### Network
- Use Docker networks for internal communication
- Limit exposed ports
- Use firewall rules

## 🎯 Production Deployment

### Recommended Setup
```bash
# Use environment file
docker-compose --env-file .env.prod up -d

# Enable SSL
export DATABASE_SSL=true

# Use proper secrets management
# Consider using Docker secrets or vault
```

### Scaling
```bash
# Scale worker services
docker-compose up -d --scale worker=3

# Use load balancer for web service
# Consider adding Redis for caching
```

## 📝 Notes

- Migrations run automatically on first startup
- Worker waits for migrations to complete
- Health checks ensure services are ready
- All services restart automatically on failure
- Database data persists in `postgres_data` volume