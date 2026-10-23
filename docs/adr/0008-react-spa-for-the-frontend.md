# ADR-0008: React single-page app with Vite for the frontend

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

Tempah needs two frontends: a mobile-first public booking page for customers and a desktop dashboard for owners. The backend is already a separate Express API ([ADR-0005](0005-monorepo-npm-workspaces.md)). Your day job uses Vue 2, but React appears in more mid-level job postings in Malaysia, and this project is meant to help get hired.

## Decision

One React app in `web/`, covering both the public pages and the dashboard:

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **React 19 + TypeScript**, built with **Vite** | Fast dev server, simple static build that Caddy can serve |
| Routing | **React Router** | `/book/:slug/*` for customers, `/app/*` for owners, with a guard component around `/app` |
| Server data | **TanStack Query** | Caching, loading and error states, and refetching after mutations. It's also where the `409 SLOT_TAKEN` handling lives. |
| Forms | **react-hook-form** + zod | The same validation style as the API |
| Styling | **Tailwind CSS** | Quick to build with, and common in job postings |
| UI components | **shadcn/ui** | Accessible components (dialogs, selects, date pickers, toasts) built on Radix primitives. They're copied into `src/components/ui/` as your own code, so they can be restyled freely. |
| Client state | `useState` and React context only | Server data lives in TanStack Query, the logged-in user comes from a `useMe()` query, and nothing else is global, so no Redux or Zustand |
| Tests | **Vitest** + Testing Library | The same runner as the API. Only cover components with real logic (slot grid, booking form). |

The dev server proxies `/api` to `localhost:3009`, so cookies and the Origin check behave like production.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Next.js | Server-side rendering and API routes would duplicate the Express API. The booking page doesn't need SEO, so an SPA is simpler to build, deploy and explain. |
| Vue 3 | Familiar from work, but React is the stronger hiring signal for this project's goal |
| Redux Toolkit or Zustand | Nearly all state here is server data, which TanStack Query already handles. A global store would add code without solving a problem. |
| MUI, Chakra UI or Mantine | Installed as a dependency with their own theming system, so a custom look means fighting the library. shadcn/ui gives you the source to edit. |
| Two separate apps (public + dashboard) | Twice the setup and deploys for one developer. Route-based code splitting keeps the public page small anyway. |

## Consequences

- **Good:** a widely used, well-documented stack, and a clear split: TanStack Query owns server data, components own UI state.
- **Good:** shadcn/ui's components handle keyboard navigation and focus correctly, which is hard to build by hand (the booking date picker and dashboard dialogs especially).
- **Watch out:** shadcn/ui code lives in the repo, so it doesn't update itself. Add components one at a time with `npx shadcn@latest add <name>` only when a screen needs them.
- **Bad:** a learning curve coming from Vue. Rough mapping: `ref` → `useState`, `computed` → a plain derived value (or `useMemo`), `watch` → `useEffect` (use it rarely), Pinia → TanStack Query + context, `v-if` / `v-for` → `&&` / `.map()`.
- **Roadmap:** Days 15–18, 25–26, 28 and 52 use React instead of Vue. The scope of each day stays the same.
