# Deployment & DevOps Engineering Guide
## Project: FixoBoard Manufacturing Management System (MMS)
**Document Version:** 1.0.0  
**Target Environments:** Local Dev, Docker Compose, Production Kubernetes / VPS  

---

### 1. Docker Compose Multi-Container Topography

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: fixoboard_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: fixoboard_mms
      POSTGRES_USER: ${POSTGRES_USER:-fixouser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-fixopassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fixouser -d fixoboard_mms"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: fixoboard_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: fixoboard_backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER:-fixouser}:${POSTGRES_PASSWORD:-fixopassword}@postgres:5432/fixoboard_mms
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET: ${JWT_SECRET:-supersecret_fixoboard_jwt_key_2026}
      ENVIRONMENT: production
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: fixoboard_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "3000:80"

volumes:
  postgres_data:
  redis_data:
```

---

### 2. Environment Configuration (`.env.example`)

```ini
# Application Core
ENVIRONMENT=development
PROJECT_NAME="FixoBoard MMS"
API_V1_STR="/api/v1"
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:8000"]

# Security & Tokens
JWT_SECRET=supersecret_dev_key_fixoboard_min_32_chars_long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (PostgreSQL)
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fixoboard_mms
POSTGRES_USER=fixouser
POSTGRES_PASSWORD=fixopassword

# Redis Cache & Broker
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# File Storage
STORAGE_BACKEND=local # local | s3
LOCAL_UPLOAD_DIR=./uploads
```

---

### 3. Database Migration & Seeding Commands

```bash
# Apply pending database schema migrations
alembic upgrade head

# Seed core roles, admin user, product categories, thicknesses, densities, and test machines
python -m app.db.seed
```

---

### 4. Health Check Endpoints
* `GET /health` $\rightarrow$ Returns overall system health (`{"status": "ok", "db": "connected", "redis": "connected", "version": "1.0.0"}`).
* `GET /api/v1/health` $\rightarrow$ Service status for load balancers and container orchestrators.
