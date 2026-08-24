# Launchly — Frontend Architecture Decision Records (ADRs)

This directory documents key architectural decisions regarding the Launchly client web application.

---

## Index of Decisions

| ADR ID | Title | Status | Date |
| :--- | :--- | :--- | :--- |
| **ADR-001** | [React 19, TypeScript, and Vite 8 Foundation](#adr-001-react-19-typescript-and-vite-8-foundation) | Accepted | 2026-07-12 |
| **ADR-002** | [Use @xyflow/react for Bot Flow Constructor](#adr-002-use-xyflowreact-for-bot-flow-constructor) | Accepted | 2026-07-20 |
| **ADR-003** | [TanStack Query & Zustand State Separation](#adr-003-tanstack-query--zustand-state-separation) | Accepted | 2026-07-28 |
| **ADR-004** | [Tailwind CSS v4 & Lucide Icons Design System](#adr-004-tailwind-css-v4--lucide-icons-design-system) | Accepted | 2026-08-05 |

---

### ADR-001: React 19, TypeScript, and Vite 8 Foundation
- **Context**: The web application requires fast build times, strict typing, and high performance for interactive canvas manipulation.
- **Decision**: Adopt React 19 with Vite 8 and TypeScript strict mode.
- **Consequences**: Instant HMR development experience and optimized bundle output.

### ADR-002: Use @xyflow/react for Bot Flow Constructor
- **Context**: The visual bot editor requires high-performance drag-and-drop nodes, customized edge routing, and minimap support.
- **Decision**: Adopt `@xyflow/react` (React Flow) as the foundational graph library.
- **Consequences**: Out-of-the-box canvas zoom, pan, snap-to-grid, and extensible custom node component wrappers.

### ADR-003: TanStack Query & Zustand State Separation
- **Context**: Mixing server API data with client UI state often leads to duplicate caching and synchronization bugs.
- **Decision**: Use `@tanstack/react-query` v5 for all backend REST/WebSocket data and `zustand` for local client state.
- **Consequences**: Clean mental model, predictable cache invalidation, and lightweight bundle footprint.

### ADR-004: Tailwind CSS v4 & Lucide Icons Design System
- **Context**: Modern, responsive UI with consistent dark/light mode theming and clean component styling.
- **Decision**: Use Tailwind CSS v4 alongside `lucide-react`.
- **Consequences**: Zero-runtime CSS extraction, fast compilation, and accessible iconography.
