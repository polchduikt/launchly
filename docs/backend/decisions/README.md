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
