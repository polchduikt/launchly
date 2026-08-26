# Launchly — Backend Architecture Decision Records (ADRs)

This directory contains records of key architectural decisions made in the development of the Launchly Backend.

---

## Index of Decisions

| ADR ID | Title | Status | Date |
| :--- | :--- | :--- | :--- |
| **ADR-001** | [Use PostgreSQL with JSONB for Flow Graphs & Schema State](#adr-001-use-postgresql-with-jsonb-for-flow-graphs--schema-state) | Accepted | 2026-07-10 |
| **ADR-002** | [Multi-Provider AI Fallback Router Architecture](#adr-002-multi-provider-ai-fallback-router-architecture) | Accepted | 2026-07-25 |
| **ADR-003** | [Adoption of Java 21 Virtual Threads](#adr-003-adoption-of-java-21-virtual-threads) | Accepted | 2026-08-01 |
| **ADR-004** | [Testcontainers for Hermetic Integration Testing](#adr-004-testcontainers-for-hermetic-integration-testing) | Accepted | 2026-08-15 |
| **ADR-005** | [WebSocket STOMP Protocol for Live CRM Inbox](#adr-005-websocket-stomp-protocol-for-live-crm-inbox) | Accepted | 2026-08-18 |
| **ADR-006** | [Transactional Outbox Pattern & Dead Letter Queue for Domain Events](#adr-006-transactional-outbox-pattern--dead-letter-queue-for-domain-events) | Accepted | 2026-08-20 |
| **ADR-007** | [Distributed Redis Idempotency on High-Value Mutations](#adr-007-distributed-redis-idempotency-on-high-value-mutations) | Accepted | 2026-08-22 |
| **ADR-008** | [Multi-Tenant Tier-Based Token-Bucket Rate Limiting](#adr-008-multi-tenant-tier-based-token-bucket-rate-limiting) | Accepted | 2026-08-24 |
| **ADR-009** | [Logback GDPR & SOC2 Zero-Leakage PII Data Masking](#adr-009-logback-gdpr--soc2-zero-leakage-pii-data-masking) | Accepted | 2026-08-25 |
| **ADR-010** | [Deep Entity Graphs & Automatic JDBC Batching for Bulk Operations](#adr-010-deep-entity-graphs--automatic-jdbc-batching-for-bulk-operations) | Accepted | 2026-08-26 |

---

### ADR-001: Use PostgreSQL with JSONB for Flow Graphs & Schema State
- **Context**: Bot conversational diagrams consist of arbitrary nodes, edge connections, and custom field values that evolve frequently. Storing each node as an individual relational row would introduce heavy JOIN overhead.
- **Decision**: Store `FlowSchema.nodes` and `FlowSchema.edges` as native PostgreSQL `JSONB` columns, while maintaining relational foreign keys on `bots`, `bot_users`, and `conversations`.
- **Consequences**: Fast graph serialization and deserialization; ability to index nested attributes using PostgreSQL GIN indexes.

### ADR-002: Multi-Provider AI Fallback Router Architecture
- **Context**: LLM inference providers experience occasional rate limit throttling (HTTP 429) or transient downtime.
- **Decision**: Implement `AiProviderRouter` with a priority array (`Groq` -> `Gemini` -> `OpenRouter` -> `Cerebras`). If the primary provider fails or exceeds latency thresholds, the router automatically attempts the next provider before returning an error.
- **Consequences**: Maximum uptime for AI features and bot generation without user disruption.

### ADR-003: Adoption of Java 21 Virtual Threads
- **Context**: Telegram bot long polling, AI inference, and media uploads involve I/O-bound blocking calls.
- **Decision**: Enable Java 21 Project Loom virtual threads (`spring.threads.virtual.enabled=true`).
- **Consequences**: Thousands of concurrent user bot requests can execute without pool starvation or complex reactive programming paradigms (`WebFlux`).

### ADR-004: Testcontainers for Hermetic Integration Testing
- **Context**: In-memory H2 databases fail to replicate PostgreSQL-specific JSONB operators and Liquibase dialect nuances, leading to false-positive CI passes.
- **Decision**: Use `org.testcontainers:postgresql` combined with Spring Boot `@ServiceConnection` for all integration test classes extending `BaseIntegrationTest`.
- **Consequences**: 100% confidence that test results accurately reflect production PostgreSQL execution.

### ADR-005: WebSocket STOMP Protocol for Live CRM Inbox
- **Context**: Customer support agents require real-time chat updates without continuous HTTP polling.
- **Decision**: Adopt Spring WebSockets with STOMP over SockJS fallback.
- **Consequences**: Standardized topic subscriptions (`/topic/conversations/{botId}`), low bandwidth consumption, and instant two-way synchronization.

### ADR-006: Transactional Outbox Pattern & Dead Letter Queue for Domain Events
- **Context**: E-commerce webhooks (Hotmart) and CRM lead events require guaranteed delivery to external systems and event streaming topics without dual-write inconsistency risks.
- **Decision**: Persist events atomically inside the business transaction within an `outbox_events` table. An asynchronous worker dispatches events with exponential backoff, automatically routing exhausted records to a Dead Letter Queue (DLQ) after maximum retry attempts.
- **Consequences**: Zero message loss, at-least-once delivery semantics, and centralized administrative management of failed integration events via `AdminOutboxController`.

### ADR-007: Distributed Redis Idempotency on High-Value Mutations
- **Context**: Network retries and parallel client submissions can trigger duplicate bot dispatches, billing operations, or duplicate AI flow generations.
- **Decision**: Introduce `@Idempotent` annotation and filter utilizing Redis atomic distributed locking and cached response storage (`idempotency:lock:` / `idempotency:response:`).
- **Consequences**: Concurrent duplicate requests are rejected or served cached results seamlessly without duplicate state side effects.

### ADR-008: Multi-Tenant Tier-Based Token-Bucket Rate Limiting
- **Context**: Fair resource allocation across different subscription plans (`FREE`, `PRO`, `ENTERPRISE`, `ADMIN`) and protection against DDoS or abuse.
- **Decision**: Deploy `TierRateLimitFilter` backed by Bucket4j and Redis distributed token-bucket counters, setting tier-specific capacities and attaching RFC rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`).
- **Consequences**: Guaranteed SLA stability for paying tiers while preventing abusive traffic from degrading overall system performance.

### ADR-009: Logback GDPR & SOC2 Zero-Leakage PII Data Masking
- **Context**: Compliance requirements (GDPR, SOC2) require that personally identifiable information (PII) such as email addresses, credit cards, and telephone numbers never appear in plaintext log aggregations.
- **Decision**: Create `PiiMaskingConverter` integrated as a custom Logback `%piiMask` conversion rule in `logback-spring.xml` alongside `MaskingUtil` regex transformers.
- **Consequences**: Zero plaintext sensitive data leakage in application logs across all environments while maintaining traceable masked identifiers (`u***r@domain.com`).

### ADR-010: Deep Entity Graphs & Automatic JDBC Batching for Bulk Operations
- **Context**: High-concurrency read queries across nested bot configurations (schemas, folders, actions, teams) and mass write ingestions (broadcast tagging, CRM lead sync) caused N+1 SELECT overhead and HikariCP connection pool contention.
- **Decision**: Implement JPA `@EntityGraph` and `JOIN FETCH` queries for composite entity retrieval, combined with Hibernate automatic JDBC statement batching (`hibernate.jdbc.batch_size=50`, `order_inserts=true`, `order_updates=true`).
- **Consequences**: Drastic reduction in database roundtrips, sub-5ms p95 latencies under 200+ RPS read/write load, and optimal connection pool utilization.
