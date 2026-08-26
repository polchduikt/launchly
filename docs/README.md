# Launchly — Documentation Hub

Master documentation index for the Launchly platform, covering architecture, database models, security, deployment, and development guides.

---

## Architectural Specifications

- [Backend Architecture](backend/ARCHITECTURE.md) — Modular monolith design, Project Loom virtual threads, transactional outbox, and security filter chains.
- [Frontend Architecture](frontend/ARCHITECTURE.md) — Layered SPA architecture, React Flow graph builder, and Zustand/TanStack state design.
- [Backend Architecture Decisions (ADRs)](backend/decisions/README.md) — Record of architectural decisions (JSONB, Outbox, Redis Idempotency, Rate Limiting, PII Masking, Entity Graphs).
- [Frontend Architecture Decisions (ADRs)](frontend/decisions/README.md) — Record of frontend decisions (React 19, React Flow, TanStack Query, Tailwind CSS v4).

---

## API & Data Models

- [API Surface Specification](backend/API_SURFACE.md) — Complete REST endpoints and WebSocket STOMP topic catalog.
- [Data Model & Schema ERD](DATA_MODEL.md) — PostgreSQL table definitions, JSONB schemas, and relationship diagrams.
- [Platform Features Matrix](FEATURES.md) — Comprehensive feature matrix and capabilities.

---

## Setup, Deployment & Maintenance

- [Local Development Setup](DEV_SETUP.md) — Step-by-step local environment installation.
- [Third-Party API Keys Guide](API_KEYS_GUIDE.md) — Credentials configuration for Telegram, Stripe, Cloudinary, Groq, Gemini, and Google Sheets.
- [Production Deployment](deployment/DEPLOYMENT.md) — Multi-stage Docker Compose, reverse proxy, and CI/CD pipelines.
- [Contributing Guidelines](CONTRIBUTING.md) — Commit standards, branching rules, and PR checklist.
- [Technical Debt Log](TECH_DEBT.md) — Technical debt registry and refactoring milestones.
