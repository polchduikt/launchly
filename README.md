# Launchly — Telegram Bot Builder, Multi-Channel CRM

[![Checks & Validation](https://github.com/polchduikt/launchly/actions/workflows/checks.yml/badge.svg)](https://github.com/polchduikt/launchly/actions/workflows/checks.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=polchduikt_launchly&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=polchduikt_launchly)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=polchduikt_launchly&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=polchduikt_launchly)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=polchduikt_launchly&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=polchduikt_launchly)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=polchduikt_launchly&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=polchduikt_launchly)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=polchduikt_launchly&metric=coverage)](https://sonarcloud.io/summary/new_code?id=polchduikt_launchly)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=polchduikt_launchly&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=polchduikt_launchly)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 4.0.6](https://img.shields.io/badge/Spring%20Boot-4.0.6-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38b2ac.svg)](https://tailwindcss.com/)

---

## Overview

**Launchly** is a comprehensive, enterprise-grade SaaS platform for building, automating, and scaling Telegram bots, managing live customer support via an omnichannel CRM, executing targeted broadcast campaigns, and generating conversational flows with AI.

It serves as a full-scale technical showcase of building resilient, high-concurrency monoliths using **Clean Architecture**, **Domain-Driven Design (DDD)** principles, and modern reactive frontend design.

---

## Video & UI Walkthrough

The complete Launchly platform experience includes:
- **Visual Drag-and-Drop Bot Builder**: Interactive node canvas with instant branch testing and schema export.
- **Omnichannel CRM Live Inbox**: Real-time two-way Telegram live chat with human agent takeover, color-coded tags, and conversation notes.
- **AI Flow Generator & Copilot**: Prompt-to-bot generation with multi-model fallback (Groq, Gemini, OpenRouter, Cerebras).
- **Leads & Order Pipeline**: Automated customer capture, status pipelines, and currency fulfillment tracking.
- **Scheduled Broadcast Campaigns**: Filtered cohort messaging with delivery metrics.
- **Stripe Subscription Billing**: Tiered monetization, usage limits enforcement, and customer portal.
- **Templates Marketplace**: One-click bot cloning and community workflow sharing.

---

## Tech Stack

### Backend — `backend/`
- **Java 21** with **Spring Boot 4.0.6** (Spring Framework 7.x)
- **Virtual Threads (Project Loom)**: High-throughput lightweight request execution
- **Clean Architecture & Package-by-Feature Modular Design**
- **PostgreSQL** (Relational data & native `JSONB` for graph storage)
- **Liquibase**: Zero-downtime database migrations (54 versioned changelogs)
- **Redis**: Fast distributed caching and token blacklist management
- **Spring Security 7 & JWT**: Stateless authentication with HMAC-SHA256 and Google OAuth2 SSO
- **Spring WebSockets & STOMP**: Low-latency bidirectional live chat streaming over SockJS
- **Multi-Provider AI Router**: Dynamic failover across **Groq**, **Google Gemini**, **OpenRouter**, and **Cerebras**
- **Cloudinary SDK**: Media processing, image transformations, and asset management
- **Stripe Java SDK**: Recurring subscriptions, webhooks, and tier limit verification
- **Resilience4j**: Circuit breakers, rate limiters, and retry pipelines
- **Testcontainers & JaCoCo**: Hermetic PostgreSQL container testing (part of 700+ automated full-stack test suite)

### Frontend — `frontend/`
- **React 19 + TypeScript + Vite 8**
- **@xyflow/react (React Flow)**: Interactive visual bot graph and node constructor
- **Tailwind CSS v4**: High-performance modern utility styling
- **TanStack Query v5**: Server state caching, background synchronization, and optimistic mutations
- **Zustand v5**: Client-only synchronous state (auth session, canvas selection, UI theme)
- **React Hook Form + Zod v4**: Strict type-safe form validation and DTO transformations
- **React Router v7**: Nested dashboard layouts and role-based route guards
- **STOMP & SockJS Client**: Real-time live chat subscriptions
- **Vitest & Testing Library**: Unit and component test suites with v8 coverage
- **Playwright**: End-to-end browser automation suite

---

## Core Features

- **Visual Bot Constructor**: Drag-and-drop conversational graph builder supporting Message, Menu, Action, Condition, and AI nodes.
- **Omnichannel CRM & Live Inbox**: Two-way Telegram chat with live agent intervention, conversation search, and lead status pipelines.
- **AI-Powered Bot Generation**: Natural language prompt-to-bot generation with automatic JSON graph repair.
- **Scheduled Broadcast Engine**: Mass cohort notifications with rich media, interactive buttons, and delivery analytics.
- **Granular RBAC & Team Management**: Multi-tier roles (`ROLE_SUPER_ADMIN`, `ROLE_OWNER`, `ROLE_ADMIN`, `ROLE_MANAGER`) with email invites.
- **Tiered Subscriptions & Stripe Billing**: Automatic plan quota enforcement (`PlanLimitService`) and customer portal management.
- **Community Templates Marketplace**: Shareable bot flow codes with one-click installation.

Full specification & feature matrix: [docs/FEATURES.md](docs/FEATURES.md)

---

## System Architecture & Patterns

This platform follows a decoupled Client-Server architecture.

### Backend Architecture
- **Clean Architecture Monolith**: Structured as a modular package-by-feature codebase (`admin`, `ai`, `bot`, `crm`, `billing`, `broadcast`, `auth`).
- **Resilient AI Router**: Automated fallback engine preventing downtime across external AI inference providers.
- **JSONB Graph Persistence**: Combines relational integrity for users/orders with PostgreSQL JSONB for flexible bot schemas.
- **Hermetic Integration Tests**: Real PostgreSQL Testcontainers ensuring zero disparity between local development, CI, and production.

Detailed backend architecture & ADRs: [docs/backend/ARCHITECTURE.md](docs/backend/ARCHITECTURE.md) | [docs/backend/decisions/README.md](docs/backend/decisions/README.md)

### Frontend Architecture
- **Layer-Based & Feature-Sliced**: Clear separation between API clients, shared UI primitives, custom hooks, and route views.
- **Strict State Separation**: Server state managed exclusively via TanStack Query; client state managed via Zustand.
- **Silent JWT Refresh Interceptor**: Axios queue mechanism ensuring transparent token rotation on HTTP 401 without user disruption.

Detailed frontend architecture & ADRs: [docs/frontend/ARCHITECTURE.md](docs/frontend/ARCHITECTURE.md) | [docs/frontend/decisions/README.md](docs/frontend/decisions/README.md)

### Code Quality & Tooling
- **Code Duplication Protection**: Enforces a strict maximum of **<= 6% code duplication** via `jscpd` across all Java backend and TypeScript/TSX frontend files, validated in CI.
- **SonarCloud & JaCoCo**: Continuous inspection of code quality, security vulnerabilities, reliability rating, and test coverage on every push.
- **Gitleaks Secret Scanning**: Automated secret scanning on every pull request and push to prevent credential leakage.

---

## Testing & Code Quality

The platform undergoes rigorous automated testing and static analysis across both backend and frontend, boasting over **700+ automated tests**:

- **700+ Automated Full-Stack Tests**: Complete test coverage spanning 389+ Spring Boot JUnit 5 & PostgreSQL Testcontainers integration/unit tests alongside 310+ Vitest, React Testing Library, and Playwright E2E tests.
- **JaCoCo Coverage**: Automated backend code coverage analysis reporting to SonarCloud.
- **Vitest & Testing Library**: Component lifecycle, state mutations, and integration tests with v8 code coverage.
- **ESLint & TypeScript Compiler**: Zero-warning strict typechecking gate.
- **Docker Validation**: Multi-stage production container build validation in CI.

To run tests locally:

```bash
# Run backend tests with Testcontainers
cd backend
mvn clean verify -B

# Run frontend test suite
cd ../frontend
npm run test:coverage
```

---

## Repository Structure

```
launchly/
├── .github/
│   └── workflows/
│       ├── checks.yml               # CI: Test, JaCoCo, SonarCloud, Lint, Docker build
│       └── deploy.yml               # CD: Build and push production images to GHCR
├── backend/
│   ├── src/main/java/com/launchly/  # Modular domain features (auth, bot, crm, ai, billing)
│   ├── src/main/resources/          # Liquibase migrations, application.properties
│   ├── src/test/                    # 389+ Backend JUnit 5 & Testcontainers integration tests
│   └── Dockerfile                   # Multi-stage production Java 21 build
├── frontend/
│   ├── src/                         # React 19 SPA (components, pages, store, hooks, router)
│   ├── nginx.conf                   # High-performance SPA reverse proxy config
│   └── Dockerfile                   # Multi-stage Nginx static container build
├── docs/
│   ├── backend/                     # Backend architecture specifications & ADRs
│   │   ├── API_SURFACE.md           # Complete REST & WebSocket API specification
│   │   ├── ARCHITECTURE.md          # Backend architecture & request lifecycle
│   │   └── decisions/               # Backend Architecture Decision Records (ADRs)
│   ├── frontend/                    # Frontend architecture specifications & ADRs
│   ├── deployment/                  # Production Docker & CI/CD deployment guide
│   ├── API_KEYS_GUIDE.md            # Third-party credentials & API guide
│   ├── CONTRIBUTING.md              # Commit conventions & pull request guidelines
│   ├── DATA_MODEL.md                # PostgreSQL schema & Entity Relationship diagrams
│   ├── DEV_SETUP.md                 # Step-by-step local development guide
│   ├── FEATURES.md                  # Comprehensive platform feature matrix
│   └── TECH_DEBT.md                 # Technical debt tracking & maintenance log
├── docker-compose.yml               # Local infrastructure (PostgreSQL, Redis)
└── docker-compose.prod.yml          # Production multi-container stack
```

---

## Running Locally

Detailed setup instructions, including environment variables and third-party API key configurations, can be found in the documentation:

[Local Development Setup Guide (docs/DEV_SETUP.md)](docs/DEV_SETUP.md)

### Option 1: Hybrid Development (Recommended)

Run PostgreSQL & Redis in Docker, and run Backend & Frontend locally on your host with hot-reloading:

```bash
# 1. Start infrastructure containers
docker compose up -d postgres redis

# 2. Start Backend API
cd backend
mvn spring-boot:run

# 3. Start Frontend SPA
cd ../frontend
npm install
npm run dev
```

### Option 2: Full Docker Stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Available Local Endpoints:
- **Frontend Client**: [http://localhost:5173](http://localhost:5173) (or `http://localhost:80` in Docker)
- **Backend REST API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **Swagger / OpenAPI Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **PostgreSQL Database**: `localhost:5432`

---

## Documentation Index

All architectural choices, setup guides, and project specifications are documented in the `docs/` directory:

- [docs/DEV_SETUP.md](docs/DEV_SETUP.md) — Step-by-step local setup checklist.
- [docs/API_KEYS_GUIDE.md](docs/API_KEYS_GUIDE.md) — External services & API keys configuration guide.
- [docs/FEATURES.md](docs/FEATURES.md) — Full feature specification & platform capabilities.
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — Database ER diagram & table specifications.
- [docs/backend/API_SURFACE.md](docs/backend/API_SURFACE.md) — Complete REST & WebSocket API specification.
- [docs/backend/ARCHITECTURE.md](docs/backend/ARCHITECTURE.md) — Backend architecture & request lifecycles.
- [docs/frontend/ARCHITECTURE.md](docs/frontend/ARCHITECTURE.md) — Frontend architecture & state design.
- [docs/backend/decisions/README.md](docs/backend/decisions/README.md) — Backend Architecture Decision Records (ADRs).
- [docs/frontend/decisions/README.md](docs/frontend/decisions/README.md) — Frontend Architecture Decision Records (ADRs).
- [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) — Production Docker & CI/CD deployment guide.
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — Repository commit conventions & PR guidelines.
- [docs/TECH_DEBT.md](docs/TECH_DEBT.md) — Technical debt & refactoring plans.

---

## Status

Launchly is actively maintained, thoroughly tested, and continuously updated with new features, integrations, and architectural enhancements.

---

## License

This project is licensed under the [MIT License](LICENSE).
