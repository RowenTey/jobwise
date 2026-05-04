# JobWise Client

React frontend for the JobWise job application tracker.

## Tech Stack

- React 18 + TypeScript
- Vite (dev server on port 80)
- Tailwind CSS v4 + shadcn/ui (Base UI v4)
- react-router-dom v6 (BrowserRouter)
- DnD Kit (Kanban drag-and-drop)
- lucide-react icons
- Vitest + testing-library for tests
- State management: React Context (`AuthContext`) + `localStorage` (no Redux)

## Setup

```bash
npm install
npm run dev          # Dev server on http://localhost:80
npm run build        # tsc -b && vite build (outputs to client/dist/)
npm run build:server # tsc -b && vite build (outputs to ../server/src/main/resources/static/)
npm run lint         # ESLint
npm test             # Vitest (40 tests)
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Backend API base URL (relative when served same-origin) |

See `.env.example`.

## Pages & Routes

| Route | Page | Auth | Description |
|---|---|---|---|
| `/login` | `LoginPage` | Public (redirects if authed) | Username + password login |
| `/signup` | `SignupPage` | Public (redirects if authed) | Register form, auto-login on success |
| `/` | `ApplicationsPage` | Protected | Table/Kanban view of applications |
| `/applications/:id` | `ApplicationDetailPage` | Protected | Single application detail with status editing |
| `/api-keys` | `ApiKeysPage` | Protected | Create/revoke API keys |

## Types

Shared TypeScript types in `types/index.ts`: `ApplicationDto`, `JobDto`, `CompanyDto`, `ApiKeyResponse`, `ApplicationCreateRequest`, `PaginatedResponse<T>`, and enum types (`ApplicationStatus`, `JobType`).

## Key Components

### Layout
- **`AppLayout`** — Sidebar + `<Outlet />`
- **`Sidebar`** — Nav items (Applications, API Keys), logout button

### Applications
- **`ApplicationsPage`** — Toggleable Table/Kanban view with "New Application" button
- **`ApplicationsTable`** — Server-side paginated/sorted/filtered table, clickable rows navigate to detail page, external link column
- **`StatusBadge`** — Color-coded badge per status
- **`KanbanBoard`** / **`KanbanColumn`** / **`KanbanCard`** — Drag-and-drop board with DnD Kit, optimistic status updates
- **`CreateApplicationDialog`** — Multi-section form (job, company, application fields)

### Application Detail
- **`ApplicationDetailPage`** — Full detail view with status dropdown, job/company info, description, cover letter, notes, back navigation

### API Keys
- **`ApiKeysTable`** — API key list with revoke action
- **`CreateApiKeyDialog`** — Create form + one-time key reveal

### shadcn/ui Components
- `button`, `input`, `label`, `card`, `table`, `badge`, `select`, `dialog`, `textarea`, `dropdown-menu`, `tooltip`

## Auth

JWT-based auth managed via `AuthContext` + `localStorage`:
- Stores `accessToken` and `refreshToken`
- Auto-refreshes access token on 401 via fetch wrapper (one retry, then redirect to login)
- Logout: immediately clears local state, best-effort API call
- All routes except `/login` and `/signup` protected via `ProtectedRoute`

## API Layer

`lib/api.ts` wraps native `fetch`:
- Auto-attaches `Authorization: Bearer` header
- 401 interceptor: refresh token → retry once → redirect to login
- Handles non-JSON responses (raw numbers, empty bodies)

Available helpers: `fetchApplication(id)`, `fetchApplications(params)`, `createApplication(request)`, `updateApplicationStatus(id, status)`, `login`, `signup`, `logout`, `fetchApiKeys`, `createApiKey`, `revokeApiKey`.

## Tests

40 tests (Vitest + testing-library + jsdom). Run with `npm test`.

- `lib/api.test.ts` — fetch wrapper, response parsing, auth flows, all endpoint helpers
- `context/AuthContext.test.tsx` — login/signup/logout state transitions
- `components/applications/StatusBadge.test.tsx` — renders all 7 status values
- `pages/LoginPage.test.tsx` — form rendering, validation, auth redirect
- `pages/SignupPage.test.tsx` — form rendering, password mismatch, submission, auth redirect
