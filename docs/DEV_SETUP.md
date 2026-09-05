# Launchly — Local Development Setup Guide

This guide walks you through setting up Launchly locally using either full Docker containers or a hybrid local development workflow.

---

## Prerequisites

Ensure the following tools are installed on your workstation:
- **Git** `>= 2.40`
- **JDK 21** (Eclipse Temurin or OpenJDK 21)
- **Node.js** `>= 22.0.0` & **npm** `>= 10.0.0`
- **Docker Desktop** / **Docker Engine** with Compose v2
- **Maven** `>= 3.9.0` (or use `./mvnw`)

---

## Environment Configuration

Before launching any services, prepare the environment configuration files.

### 1. Backend Secrets (`backend/src/main/resources/application-secrets.properties`)
Create `application-secrets.properties` in `backend/src/main/resources/` (this file is gitignored):

```properties
# Security Keys
app.jwt.secret=bGF1bmNobHktc3VwZXItc2VjcmV0LWtleS10aGF0LWlzLWF0LWxlYXN0LTI1Ni1iaXRzLWxvbmctZm9yLWhzMjU2
app.encryption.key=ZGVmYXVsdC1kZXYta2V5LWNoYW5nZS1pbi1wcm9k
SUPER_ADMIN_EMAIL=admin@launchly.local

# Telegram
TELEGRAM_SYSTEM_BOT_TOKEN=1234567890:AAFakeTelegramTokenForLocalDevelopmentOnly
TELEGRAM_SYSTEM_BOT_USERNAME=@launchly_dev_bot

# AI Keys (At least one recommended)
GROQ_API_KEY=gsk_your_groq_key_here
GEMINI_API_KEY=AQ_your_gemini_key_here
OPENROUTER_API_KEY=sk-or-your_openrouter_key
CEREBRAS_API_KEY=csk_your_cerebras_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_API_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Cloudflare Turnstile (Anti-Bot)
CLOUDFLARE_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

### 2. Frontend Environment (`frontend/.env`)
Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=http://localhost:8080/ws
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

---

## Option 1: Hybrid Development (Recommended)

Run PostgreSQL, Redis, and Mailpit in Docker, and run the Backend and Frontend on your host for hot-reloading and instant debugging.

### Step 1: Start Infrastructure Containers
From the repository root:
```bash
docker compose up -d postgres redis
```

### Step 2: Run Backend API
Navigate to `backend/` and start the Spring Boot application:
```bash
cd backend
mvn spring-boot:run
```
*The database migrations will run automatically via Liquibase (`db-changelog-master.yaml`).*

### Step 3: Run Frontend Single Page Application
Navigate to `frontend/`, install dependencies, and start Vite dev server:
```bash
cd ../frontend
npm install
npm run dev
```

---

## Option 2: Full Docker Environment

Run the entire platform (Infrastructure, Backend API, Frontend Nginx container) inside Docker:

```bash
# Build and start all containers
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Available Local Endpoints

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:5173](http://localhost:5173) (or `http://localhost:80` for Docker) | React SPA |
| **Backend REST API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Spring Boot REST API |
| **Swagger / OpenAPI UI** | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Interactive API docs |
| **OpenAPI JSON Spec** | [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) | Raw OpenAPI v3 schema |
| **PostgreSQL Database** | `localhost:5432` | User: `postgres`, DB: `launchly`, Port: `5432` |
| **Redis Server** | `localhost:6379` | Port: `6379` |

---

## Running Verification & Tests Locally

### Backend Unit & Integration Tests:
```bash
cd backend
mvn clean verify -B
```
*Integration tests automatically start an isolated PostgreSQL Testcontainer.*

### Frontend Tests & Quality Checks:
```bash
cd frontend
npm run lint           # ESLint analysis
npm run test:coverage  # Vitest with v8 coverage
npm run build          # TypeScript typecheck & Vite build
```
