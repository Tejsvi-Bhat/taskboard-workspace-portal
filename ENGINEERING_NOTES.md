# Engineering Notes

This document explains how the app is structured and **why** — the decisions, the
trade-offs, and the assumptions. Short demo GIFs are embedded per feature.

---

## 1. Goals that shaped the architecture

The brief is judged on architecture, state-management decisions, reusable components,
robust data handling, and **shareability/discoverability of public content** — not
feature count. Two requirements did most of the steering:

- **Public, shareable, indexable views.** "Link previews", "discovered or indexed",
  "communicate structure to automated systems" all point to **server-side rendering**
  with real `<meta>`/structured data — not a client-only SPA shell.
- **Consistent workspace context + simulated real-time.** A clean split between
  *server state* (boards/tasks) and *client UI state* (which workspace, toasts), plus
  a caching layer that supports optimistic updates and polling.

That led to an **integrated Next.js (App Router) app**: React for UI, Node route
handlers for the mock API, all in one repo. SSR is free where it matters (public
pages), and the public board endpoint is a real server route the page can render from.

---

## 2. Application structure & scalability

Routing is split into three concerns using route groups:

| Segment | Auth | Rendering |
| --- | --- | --- |
| `(auth)/login` | public | mostly static + client form |
| `(app)/*` | protected | client (interactive board), server-gated layout |
| `public/board/[id]` | public | **server-rendered** for crawlers/unfurls |

Code is organized by **responsibility, not by type-dump**:

- `lib/api` — the only place that knows HTTP. `apiClient` (transport + error
  normalization), `endpoints.ts` (typed route wrappers), `schemas.ts` (zod), `http.ts`
  (server response helpers).
- `lib/mock` — the swappable backend: `db.ts` (store + operations), `seed.ts`,
  `simulator.ts`. Replacing this with a real backend means changing `endpoints.ts`
  base paths and deleting `lib/mock` — nothing in components changes.
- `lib/query` — query keys and **pure** optimistic cache transforms.
- `hooks` — feature data hooks composed from the above.
- `components/{ui,layout,board,activity,public,providers}` — presentational and
  feature components.

This scales because the dependency direction is one-way: components → hooks →
endpoints → apiClient. UI never reaches past its hook.

---

## 3. State management — server vs client

> ![Workspace switching](docs/media/workspace-switch.gif)

The single most important decision: **don't put server data in a global client store.**

- **Server state → TanStack Query.** Workspaces, boards, tasks, and activity are
  remote data with caching, staleness, and refetch concerns. Query keys are
  hierarchical (`["board", id]`, `["activity", id]`) so invalidation is precise.
- **Client state → Zustand.** Only genuinely client-side concerns: the
  `currentWorkspaceId` (persisted to localStorage so context survives refresh) and a
  tiny toast store. Everything board-related *derives* from the selected workspace, so
  workspace context stays consistent across the whole app by construction.

Why not Redux? For this surface area it would be more boilerplate for the same result;
Query already solves the hard part (server cache). Why not Context for server data?
You'd be re-implementing caching, dedup, and background refetch by hand.

---

## 4. Data fetching & synchronization

> ![Drag, drop and reorder with optimistic updates](docs/media/board-dnd.gif)

**One abstraction for all I/O.** Components never call `fetch`. They call hooks, which
call typed `endpoints`, which call a single `apiClient`. That choke-point gives us:

- Consistent error envelopes (`ApiError` with `status`/`code`).
- **Global session-expiry handling** — any `401` triggers one registered handler
  (clear caches → toast → redirect to login). No per-call error plumbing.

**Optimistic updates.** Drag/drop, edits, and deletes apply a **pure transform**
(`lib/query/boardCache.ts`) to the cached board immediately, snapshot the previous
state, and roll back on error. The same transform logic mirrors the server's
`updateTask`, so the optimistic result matches the eventual server result.

**Simulated real-time.** A server-side `simulator` periodically moves tasks / bumps
priorities and logs activity; the client polls the board (8s) and activity (5s) via
Query `refetchInterval`. New activity from *other* actors raises a toast; your own
actions don't. Board re-sync is skipped mid-drag so a poll never yanks a card you're
holding.

**Loading / error / empty.** Every async surface has all three states (`Loading`,
`ErrorState` with retry, `EmptyState`, plus skeletons), and the mock API injects
latency so they're real, not theoretical.

---

## 5. Component design & reuse

> ![Create and edit tasks](docs/media/task-crud.gif)

- A small **UI primitive kit** (`components/ui`) — Button, Input/Field, Modal, Badge,
  Avatar, States — built on a Tailwind **design-token** system (one neutral ramp, one
  brand color, semantic roles in `globals.css`). This is what keeps spacing,
  typography, and color consistent.
- **`TaskCard` is presentational and reused verbatim** in three contexts: the
  authenticated board (wrapped by `SortableTaskCard` for drag), the drag overlay, and
  the **read-only public board**. The drag concern lives in the wrapper, not the card,
  so reuse stays clean.
- The board's interactivity (`BoardView`) is isolated from layout (`BoardScreen`),
  which is isolated from the page — so each piece is independently testable/replaceable.

---

## 6. Data model

```
User · Workspace · Board · Column · Task · Activity
```

**Ordering is explicit**: a board owns an ordered `columnOrder`, each column owns an
ordered `taskIds[]`. Position is an array index, not a float rank — deterministic for
move/reorder and trivially serializable. Moving a task is "remove id from source
`taskIds`, insert into target at index", applied identically on client (optimistic)
and server.

---

## 7. Publicly accessible pages (a focus area)

> ![Share a board and view it publicly](docs/media/share-public.gif)

Design goals: works when opened directly, looks good when shared, and is legible to
automated systems.

- **Real SSR, not a JS shell.** `app/public/board/[id]/page.tsx` is a server component
  that reads the board on the server and returns complete HTML. View-source shows the
  actual tasks — so crawlers and link-unfurlers see content immediately.
- **Rich previews.** `generateMetadata` emits Open Graph + Twitter tags and a
  canonical URL; a sibling `opengraph-image.tsx` renders a **data-driven** preview card
  (board name + counts) for chat/social unfurls.
- **Structured data.** JSON-LD (`ItemList`) describes the board's contents to machines.
- **Discoverability.** `sitemap.ts` lists *only* public boards; `robots.ts` allows
  `/public` and disallows the app + API.
- **Safety.** Only boards explicitly toggled public are served; private/missing boards
  return `404` (no existence leak). The public route requires no session and is exempt
  from the auth proxy.

---

## 8. Authentication & session handling

> ![Sign in](docs/media/login.gif)

- Mock login sets an **httpOnly** session cookie (unreadable from JS; available to SSR
  and the proxy). TTL is intentionally short to make expiry demoable.
- **Layered protection.** The edge `proxy` cheaply gates page routes on cookie
  *presence*; the `(app)` server layout is authoritative and validates the session
  (catching expiry the edge can't see) before rendering. API routes enforce auth
  themselves and return `401` JSON (a redirect would corrupt client fetches).
- **Graceful expiry.** When a session lapses, the next request's `401` funnels through
  the single global handler → toast → redirect to `/login?next=…`.

---

## 9. Trade-offs & assumptions

- **In-memory store** resets on server restart. Fine for a mock; a real DB swaps in
  behind `lib/mock` without touching the UI.
- **Login accepts any seeded email + any password.** It demonstrates the *flow* and
  session handling, which is what the brief asks for.
- **"Real-time" is simulated** (server ticker + client polling), per the brief. The
  data layer is structured so swapping polling for WebSockets/SSE is a hook-level
  change.
- **Auth gate trade-off**: the in-memory store can't be read from the edge runtime, so
  the proxy checks cookie presence and the server layout does the authoritative check.
  This is a deliberate two-layer design, not an oversight.
- **Interactive-board virtualization trade-off.** The activity feed is virtualized
  (`@tanstack/react-virtual`), but the interactive board is not — composing windowing
  with accessible drag-and-drop reliably is fragile, so large boards use **memoized
  cards** instead (verified smooth at 240 tasks with DnD intact). The public board is
  fully rendered so all tasks remain in the crawlable SSR HTML.

## 10. Optional enhancements implemented

Beyond the core requirements: **optimistic updates**, **search/filter** (text +
priority + assignee), **undo/redo** (per-board command history with keyboard
shortcuts), **large-dataset handling** (virtualized activity feed + memoized cards +
a 240-task seed board), a **pause toggle** for simulated activity, and the rich
**public/shareable** views. See the README "Optional enhancements" table.

## 11. What I'd do next

- WebSocket/SSE channel to replace polling.
- Server-persisted ordering with fractional ranks for concurrent reordering.
- Combine windowing with drag-and-drop on the interactive board (the harder version of
  the virtualization trade-off above).
- Tests: unit tests for the pure cache transforms / command inverses and route
  handlers; Playwright e2e (the capture script in `scripts/` is a starting point).
