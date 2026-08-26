# Launchly — Frontend Application

Modern, reactive Single Page Application (SPA) for Telegram bot visual construction, live omnichannel CRM chat, broadcast campaigns, and account analytics.

---

## Technical Stack

- **React 19** + **TypeScript 5.x** + **Vite 8**
- **@xyflow/react (React Flow)** for conversational graph construction
- **Tailwind CSS v4** for modern utility styling
- **TanStack Query v5** for server-state caching and optimistic updates
- **Zustand v5** for synchronous client state (auth, theme, active bot selection)
- **React Hook Form** + **Zod v4** for type-safe validation
- **React Router v7** for nested layouts and role-based route guards
- **STOMP & SockJS** for real-time WebSocket live chat streaming
- **Vitest & Testing Library** for component unit testing
- **Playwright** for end-to-end browser automation

---

## Application Structure

```
frontend/src/
├── api/            # Axios HTTP client, silent refresh interceptor, REST endpoints
├── components/     # Reusable UI primitives, modal dialogs, layout wrappers
│   ├── auth/       # Auth modals, OAuth2 handlers
│   ├── bot/        # Bot cards, folder filters, creation wizards
│   ├── builder/    # React Flow canvas, custom node components, inspector panels
│   ├── crm/        # Live chat inbox, message bubbles, lead status drawers
│   └── ui/         # Buttons, inputs, dropdowns, badges, tooltips
├── hooks/          # Custom reusable React hooks (WebSocket, auth, media)
├── pages/          # Top-level route views (Dashboard, Bots, CRM, Billing, Admin)
├── store/          # Zustand client-state stores
└── types/          # TypeScript interfaces, DTOs, and schema types
```

---

## Local Development & Testing

### Installation

```bash
cd frontend
npm install
```

### Starting Dev Server

```bash
npm run dev
```

### Running Tests

```bash
# Run unit & component tests with coverage
npm run test:coverage

# Run Playwright E2E tests
npm run test:e2e
```

### Production Build

```bash
npm run build
```
