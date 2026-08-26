# Launchly — Backend Platform

High-throughput, clean-architecture backend monolith for Telegram bot orchestration, multi-channel CRM, AI workflow automation, and subscription billing.

---

## Technical Stack

- **Java 21 (LTS)** with **Spring Boot 4.0.6**
- **Project Loom Virtual Threads** (`spring.threads.virtual.enabled=true`)
- **PostgreSQL 16** with native `JSONB` graph persistence
- **Redis 7** for distributed caching, token blacklisting, tier rate limiting, and idempotency locks
- **Liquibase** for zero-downtime database migrations (60 changelogs)
- **Spring Security 7 & JWT** with stateless session management
- **Bucket4j** for dynamic token-bucket rate limiting
- **Resilience4j** for circuit breaking and external API retries
- **Testcontainers & JaCoCo** for hermetic integration testing

---

## Module Structure

```
backend/src/main/java/com/launchly/
├── admin/          # System moderation, audit logging, system broadcasts, support tickets
├── ai/             # Multi-provider LLM router (Groq, Gemini, OpenRouter, Cerebras), token budgeting
├── analytics/      # Metric aggregations, event ingestion, telemetry
├── auth/           # JWT token generation, refresh rotation, OAuth2 SSO, Telegram login
├── billing/        # Stripe integration, subscription lifecycles, plan limit enforcement
├── blog/           # Knowledge base and public blog content management
├── bot/            # Bot lifecycle, Telegram engine, node execution, flow schemas, templates
├── broadcast/      # Mass messaging campaigns, scheduling, recipient filtering
├── common/         # Cross-cutting concerns: Security, Config, Rate limiting, Outbox, Utils
├── crm/            # Live chat inbox, WebSocket STOMP messaging, Leads & Orders pipeline, Labels
├── integration/    # External connectors (Google Sheets, Webhooks, custom APIs)
└── media/          # Cloudinary uploads, MIME type validation, asset transformations
```

---

## Local Development & Testing

### Prerequisites

- JDK 21+
- Docker & Docker Compose (for PostgreSQL and Redis)

### Running Locally

```bash
# 1. Start dependent services
docker compose up -d postgres redis

# 2. Run backend application
./mvnw spring-boot:run
```

### Running Tests

```bash
# Run all unit and integration tests with Testcontainers
./mvnw clean verify -B
```
