# Launchly — Load & Performance Testing Suite

Automated performance, stress, and resilience test suite built with **Grafana k6**, **TypeScript**, and **Webpack**.

---

## Architecture & Test Harness

- **Virtual User Pool Pattern**: Test contexts (tokens, bot entities, CRM tags) are pre-allocated sequentially during `setup()`, eliminating authentication contention and runtime rate-limiting anomalies during measurement stages.
- **Dynamic Scenario Generation**: Multi-stage arrival rate and virtual user ramping up to 1,000+ RPS.
- **Automated HTML Reporting**: Test results are summarized and exported to HTML dashboards under `reports/`.

---

## Scenarios Index

| File | Scenario Name | Target Domain | Key SLA & Thresholds |
| :--- | :--- | :--- | :--- |
| `01-auth-burst.test.ts` | `auth_burst` | Registration, Login, Token Refresh | `p(95) < 200ms`, `rate == 1.0` |
| `02-telegram-surge.test.ts` | `telegram_surge` | Telegram Webhook Ingestion & Flow Dispatch | `p(95) < 150ms`, `p(99) < 300ms` |
| `03-crm-leads.test.ts` | `crm_leads` | CRM Lead & Deal Ingestion Pipeline | `p(95) < 200ms` |
| `04-plan-limits.test.ts` | `plan_limits` | Billing & Quota Enforcement | `p(95) < 150ms` |
| `05-massive-100node.test.ts` | `massive_100node` | 100-Node Flow Execution Engine | `p(95) < 250ms` |
| `06-broadcast-campaigns.test.ts` | `broadcast_campaigns` | Broadcast Scheduling & Dispatch | `p(95) < 200ms` |
| `07-analytics-dashboards.test.ts` | `analytics_dashboards` | Analytics Aggregation & Telemetry | `p(95) < 150ms` |
| `08-ai-generation-stream.test.ts` | `ai_generation_stream` | AI Router & Flow Generation | `p(95) < 800ms` |
| `09-support-chat-concurrency.test.ts` | `support_chat` | Real-Time Live Support Inbox | `p(95) < 150ms` |
| `10-integration-webhooks.test.ts` | `integrations` | Webhook & Google Sheets Dispatch | `p(95) < 200ms` |
| `11-rate-limiting.test.ts` | `rate_limiting` | Bucket4j Rate Limiter Verification | `p(95) < 100ms`, `429 validation` |
| `12-idempotency-concurrency.test.ts` | `idempotency` | Redis Distributed Lock Replay Safety | `p(95) < 150ms`, `409 conflict checks` |
| `13-security-headers.test.ts` | `security_headers` | Enterprise Security Header Audit | `100% header presence` |
| `14-transactional-outbox.test.ts` | `outbox_burst` | Outbox Ingress & Event Streaming | `p(95) < 200ms` |
| `15-jdbc-batching-pool.test.ts` | `batch_writes` | Hibernate Batching & HikariCP Pool | `p(95) < 250ms`, `p(99) < 500ms` |
| `16-tier-rate-limits.test.ts` | `free_tier_load` | Tier-Based Multi-Tenant Throttling | `p(95) < 150ms`, `429 quota checks` |
| `17-deep-entity-graph.test.ts` | `entity_graph_read_load` | JPA Entity Graph & N+1 Prevention | `p(95) < 150ms`, `p(99) < 300ms` |

---

## Execution Guide

### Prerequisites

- Node.js 20+
- Grafana k6 (`k6 version >= 0.50`)
- Running Launchly backend API (`http://localhost:8080`)

### Build & Bundle

```bash
cd load-tests
npm install
npm run build
```

### Running Individual Tests

```bash
# Transactional Outbox
npm run test:outbox

# JDBC Batching & Connection Pool
npm run test:batching

# Tier Rate Limits
npm run test:tierlimits

# Deep Entity Graph
npm run test:entitygraph
```

### Running All Scenarios

```bash
npm run test:all
```
