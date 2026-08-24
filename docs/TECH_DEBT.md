# Launchly — Technical Debt & Architectural Maintenance

This document tracks known technical debt, potential bottlenecks, and scheduled refactoring initiatives.

---

## 1. Backend

| Area | Description | Impact | Target Resolution |
| :--- | :--- | :--- | :--- |
| **Jackson 3.x Migration** | Some external libraries still expect `com.fasterxml.jackson` instead of `tools.jackson` | Potential serialization discrepancy in edge DTOs | Maintain custom wrappers until ecosystem converges |
| **Kafka Event Bus Activation** | Kafka producer/consumer infrastructure is prepared but currently disabled in test profiles | Decouple broadcast dispatch into background event stream | Enable dedicated Kafka broker for production mass broadcast queue |
| **Redis Cache Eviction Keys** | Eviction patterns in `CacheConfig` use manual tag clearing for bot schema mutations | Potential cache staleness on high-frequency bot edits | Implement Pub/Sub cache invalidation across cluster |

---

## 2. Frontend

| Area | Description | Impact | Target Resolution |
| :--- | :--- | :--- | :--- |
| **Peer Dependencies (`@emoji-mart/react`)** | `@emoji-mart/react` requires React 18 peer, requiring `--legacy-peer-deps` under React 19 | Build requires legacy peer flag | Upgrade to native React 19 emoji picker when upstream releases |
| **React Flow Graph Optimization** | Very large bot schemas (100+ nodes) may experience minor render lag on low-end machines | Canvas rendering performance | Implement node virtualization and canvas level-of-detail viewport scaling |
| **Bundle Size Budgeting** | Large chart and diagram dependencies contribute to vendor chunk size | First Contentful Paint (FCP) on mobile | Code-split CRM analytics and bot builder via `React.lazy` |

---

## 3. Database & Infrastructure

| Area | Description | Impact | Target Resolution |
| :--- | :--- | :--- | :--- |
| **Audit Log Table Partitioning** | `user_audit_logs` table will grow rapidly in high-traffic deployments | Query performance on date ranges | Partition `user_audit_logs` by month using PostgreSQL native range partitioning |
| **JSONB GIN Indexing** | Flow schema nodes and custom field data queries on JSONB fields | Fast JSON path search | Add targeted GIN indexes for frequently filtered JSONB attributes |
