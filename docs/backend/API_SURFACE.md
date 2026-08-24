# Launchly — REST & WebSocket API Specification

All REST endpoints are versioned and prefixed with `/api/v1` (unless explicitly noted). Authentication is handled via Bearer JWT tokens in the `Authorization: Bearer <token>` header.

---

## 1. Authentication & Session Management (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user account with email and password | Public |
| `POST` | `/api/v1/auth/login` | Authenticate with email/password and receive JWT tokens | Public |
| `POST` | `/api/v1/auth/refresh-token` | Exchange refresh token for a new access token | Public |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh token and invalidate session | Bearer JWT |
| `POST` | `/api/v1/auth/google` | Authenticate / sign up using Google OAuth2 ID Token | Public |
| `POST` | `/api/v1/auth/telegram/session` | Initiate a secure Telegram widget auth session | Public |
| `GET` | `/api/v1/auth/telegram/check` | Poll Telegram session status for one-click login | Public |
| `POST` | `/api/v1/auth/telegram/callback` | Process verified Telegram OAuth callback payload | Public |
| `POST` | `/api/v1/auth/forgot-password` | Request a password reset link to user email | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset account password using token from email | Public |

---

## 2. Bot Lifecycle & Visual Flow Engine (`/api/v1/bots`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bots` | List all bots owned by or accessible to current user | Bearer JWT |
| `POST` | `/api/v1/bots` | Create a new Telegram bot instance (enforces plan quota) | Bearer JWT |
| `GET` | `/api/v1/bots/{botId}` | Retrieve bot details, settings, and runtime state | Bearer JWT |
| `PUT` | `/api/v1/bots/{botId}` | Update bot metadata (name, description, settings) | Bearer JWT |
| `DELETE` | `/api/v1/bots/{botId}` | Delete bot and cascade all associated data | Bearer JWT |
| `POST` | `/api/v1/bots/{botId}/start` | Start bot execution and register Telegram webhook/polling | Bearer JWT |
| `POST` | `/api/v1/bots/{botId}/stop` | Stop bot execution and pause event listener | Bearer JWT |
| `POST` | `/api/v1/bots/{botId}/avatar` | Upload bot avatar image to Cloudinary | Bearer JWT |
| `PATCH` | `/api/v1/bots/{botId}/runs` | Increment / update bot runs counter | Bearer JWT |
| `PATCH` | `/api/v1/bots/{botId}/custom-fields` | Update bot custom fields schema metadata | Bearer JWT |
| `GET` | `/api/v1/bots/{botId}/schema` | Fetch React Flow graph schema (nodes and edges) | Bearer JWT |
| `PUT` | `/api/v1/bots/{botId}/schema` | Save and validate React Flow graph schema | Bearer JWT |

---

## 3. Team Collaboration & RBAC (`/api/v1`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/bots/{botId}/members` | List all team members assigned to a bot | Bearer JWT |
| `POST` | `/api/v1/bots/{botId}/invitations` | Send an email invite to a new team member with custom role | Bearer JWT |
| `GET` | `/api/v1/invitations/{token}` | Verify invitation token validity | Public |
| `POST` | `/api/v1/invitations/{token}/accept` | Accept team invitation and join workspace | Bearer JWT |
| `DELETE` | `/api/v1/bots/{botId}/members/{memberId}` | Remove a team member from bot | Bearer JWT |
| `PATCH` | `/api/v1/bots/{botId}/members/{memberId}/role` | Update team member role / permissions | Bearer JWT |

---

## 4. CRM: Live Chat, Leads & Orders (`/api/v1/crm`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/crm/bots/{botId}/conversations` | Get conversations list for a specific bot | Bearer JWT |
| `GET` | `/api/v1/crm/conversations` | Get unified inbox conversations across all user bots | Bearer JWT |
| `GET` | `/api/v1/crm/conversations/{convId}/messages` | Fetch chat message history for a conversation | Bearer JWT |
| `POST` | `/api/v1/crm/conversations/{convId}/messages` | Send human agent message to Telegram customer | Bearer JWT |
| `PATCH` | `/api/v1/crm/conversations/{convId}` | Update conversation status (`OPEN`, `PENDING`, `CLOSED`), tags, favorite | Bearer JWT |
| `POST` | `/api/v1/crm/conversations/{convId}/notes` | Add internal agent note to conversation | Bearer JWT |
| `GET` | `/api/v1/crm/labels` | Get all custom conversation filter labels | Bearer JWT |
| `POST` | `/api/v1/crm/labels` | Create a new custom conversation filter label | Bearer JWT |
| `DELETE` | `/api/v1/crm/labels/{name}` | Delete a custom conversation label | Bearer JWT |
| `GET` | `/api/v1/crm/bots/{botId}/leads` | List captured leads for bot | Bearer JWT |
| `PATCH` | `/api/v1/crm/leads/{leadId}` | Update lead pipeline status (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`) | Bearer JWT |
| `GET` | `/api/v1/crm/bots/{botId}/orders` | List e-commerce orders for bot | Bearer JWT |
| `PATCH` | `/api/v1/crm/orders/{orderId}` | Update order fulfillment status (`NEW`, `PROCESSING`, `PAID`, `SHIPPED`, `CANCELLED`) | Bearer JWT |

---

## 5. AI Assistant & Flow Generator (`/api/v1/ai`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chat` | Send conversational prompt to AI assistant with plan limit check | Bearer JWT |
| `POST` | `/api/v1/ai/generate-schema` | Generate complete React Flow JSON graph schema from text prompt | Bearer JWT |
| `GET` | `/api/v1/ai/usage` | Get daily token usage, request counts, and plan tier limits | Bearer JWT |

---

## 6. Broadcast Campaigns (`/api/v1/broadcast/bots/{botId}`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/broadcast/bots/{botId}` | List all broadcast campaigns for bot | Bearer JWT |
| `POST` | `/api/v1/broadcast/bots/{botId}` | Create a new broadcast campaign (draft or scheduled) | Bearer JWT |
| `GET` | `/api/v1/broadcast/bots/{botId}/{campaignId}` | Get broadcast campaign details and delivery statistics | Bearer JWT |
| `PUT` | `/api/v1/broadcast/bots/{botId}/{campaignId}` | Update broadcast campaign content or targeting | Bearer JWT |
| `DELETE` | `/api/v1/broadcast/bots/{botId}/{campaignId}` | Delete broadcast campaign | Bearer JWT |
| `POST` | `/api/v1/broadcast/bots/{botId}/{campaignId}/send` | Trigger immediate dispatch of broadcast campaign | Bearer JWT |

---

## 7. Billing & Stripe Subscriptions (`/api/v1/billing`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/billing/plans` | List available subscription tiers (Free, Starter, Pro, Unlimited) | Public |
| `GET` | `/api/v1/billing/active-plan` | Get current active subscription details and feature limits | Bearer JWT |
| `POST` | `/api/v1/billing/create-checkout-session` | Create Stripe Checkout Session URL for plan upgrade | Bearer JWT |
| `POST` | `/api/v1/billing/customer-portal` | Generate Stripe Customer Portal session URL | Bearer JWT |
| `POST` | `/api/v1/billing/webhook` | Process Stripe subscription and invoice webhook events | Stripe Signature |

---

## 8. Templates Marketplace (`/api/v1/templates`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/templates` | Browse community public templates | Public / Bearer JWT |
| `GET` | `/api/v1/templates/{shareCode}` | Inspect template details and preview flow schema | Public / Bearer JWT |
| `POST` | `/api/v1/templates/bots/{botId}/publish` | Publish bot flow as a community template | Bearer JWT |
| `POST` | `/api/v1/templates/{shareCode}/install` | Clone template nodes/edges into a new or existing bot | Bearer JWT |

---

## 9. Analytics & Funnels (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/bots/{botId}/overview` | Overview metrics (total subscribers, active conversations, orders) | Bearer JWT |
| `GET` | `/api/v1/analytics/bots/{botId}/funnel` | Step-by-step conversion funnel analytics | Bearer JWT |
| `GET` | `/api/v1/analytics/bots/{botId}/activity` | Timeseries activity graph data (daily messages, new users) | Bearer JWT |

---

## 10. External Integrations & Webhooks (`/api/v1/integrations`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/integrations/bots/{botId}` | List active third-party integrations for bot | Bearer JWT |
| `POST` | `/api/v1/integrations/bots/{botId}/google-sheets` | Connect Google Sheets spreadsheet for lead export | Bearer JWT |
| `POST` | `/api/v1/integrations/bots/{botId}/webhook` | Register custom outgoing webhook URL | Bearer JWT |
| `POST` | `/api/v1/integrations/hotmart/webhook` | Ingest Hotmart purchase notifications | Hotmart Token |

---

## 11. Media Management (`/api/v1/media`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/media/upload` | Upload media attachment to Cloudinary (image, audio, video, doc) | Bearer JWT |
| `DELETE` | `/api/v1/media/{publicId}` | Delete uploaded media asset from Cloudinary | Bearer JWT |

---

## 12. In-App Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | List user notification history | Bearer JWT |
| `GET` | `/api/v1/notifications/unread-count` | Get count of unread notifications | Bearer JWT |
| `PATCH` | `/api/v1/notifications/{id}/read` | Mark single notification as read | Bearer JWT |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all user notifications as read | Bearer JWT |

---

## 13. Support & Account Appeals (`/api/v1/support`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/support/tickets` | List user support tickets | Bearer JWT |
| `POST` | `/api/v1/support/tickets` | Create a new support ticket | Bearer JWT |
| `GET` | `/api/v1/support/tickets/{ticketId}/messages` | Get support chat messages | Bearer JWT |
| `POST` | `/api/v1/support/tickets/{ticketId}/messages` | Send message in support ticket | Bearer JWT |
| `POST` | `/api/v1/support/appeal` | Submit appeal for blocked bot or account | Bearer JWT |

---

## 14. Super Administration (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/stats` | Global platform KPIs (users, bots, messages, revenue) | ROLE_SUPER_ADMIN |
| `GET` | `/api/v1/admin/users` | List and search all platform user accounts | ROLE_SUPER_ADMIN |
| `PATCH` | `/api/v1/admin/users/{userId}/ban` | Ban or unban user account | ROLE_SUPER_ADMIN |
| `PATCH` | `/api/v1/admin/users/{userId}/role` | Assign role to user (`ROLE_ADMIN`, `ROLE_OWNER`) | ROLE_SUPER_ADMIN |
| `GET` | `/api/v1/admin/logs` | Query global audit trail logs with filtering | ROLE_SUPER_ADMIN |
| `POST` | `/api/v1/admin/broadcasts` | Send system-wide broadcast message to all users | ROLE_SUPER_ADMIN |
| `GET` | `/api/v1/admin/support-chats` | Oversee all active customer support dialogues | ROLE_SUPER_ADMIN |
| `GET` | `/api/v1/admin/automations` | Global bot automation performance and runs | ROLE_SUPER_ADMIN |

---

## 15. Real-Time WebSockets & STOMP Channels (`/ws`)

| Protocol | Destination Topic | Description |
| :--- | :--- | :--- |
| **STOMP** | `/topic/conversations/{botId}` | Real-time CRM live chat updates for all conversations in a bot |
| **STOMP** | `/topic/presence/{botId}/{flowType}` | Live canvas presence, active user avatars, and cursor coordinates |
| **STOMP** | `/topic/collaboration/{botId}/{flowType}/update` | Live visual builder node drag, property changes, and schema updates |
