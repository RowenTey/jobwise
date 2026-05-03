# AGENTS.md — JobWise

## Repo layout
- `server/` — Spring Boot 3 backend (Java 17, Maven).
- `client/` — React 18 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui frontend.
- `extension/` — Browser Extension (Manifest V3), TypeScript source compiled to `dist/` via `tsc`.

---

## Server (`server/`)
- **Build tool**: Maven (`mvn` directly).
- **Run**: `cd server && mvn spring-boot:run` (or `java -jar target/jobwise-0.0.1-SNAPSHOT.jar`).
- **Tests**: 37 tests (JUnit 5 + Mockito). Run `mvn test` to verify.
- **Database**: SQLite via Hibernate community dialect. Flyway migrations enabled (`src/main/resources/db/migration`). DB file defaults to `jobwise.db` at repo root.
- **Schema**: V1 migration creates 7 tables: `users`, `companies`, `jobs`, `applications`, `refresh_tokens`, `user_oauth_accounts`, `api_keys`.
- **Entities**: User, RefreshToken, ApiKey, UserOAuthAccount, Application (→User, Job), Job (→Company), Company.
- **Services**: AuthService, RefreshTokenService, OAuthService, UserService, ApiKeyService, ApplicationService, CompanyService, JobService.
- **Env vars** (see `server/.env.example`):
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
  - `JWT_SECRET` defaults to `test` in `application.yml`.
  - **Missing from `.env.example`**: `GEMINI_API_KEY` (used in CI but not in template).
- **API**: Base path `/api/v1`. Swagger UI at `/swagger-ui/index.html`.
- **Auth**: JWT access/refresh token pair. `/api/v1/auth/**` and `/actuator/health/**` are unsecured.
  - Login: `POST /api/v1/auth/login` → `{ accessToken, refreshToken }`.
  - Signup: `POST /api/v1/auth/signup` → `201 Created` with **no body** (client calls login after signup).
  - Refresh: `POST /api/v1/auth/refresh`, Logout: `POST /api/v1/auth/logout`.
  - OAuth: `POST /api/v1/auth/oauth/{provider}` (supports `google` and `github`).
  - API Keys: `POST/GET /api/v1/apiKeys`, `DELETE /api/v1/apiKeys/{id}`, `POST /api/v1/apiKeys/validate`.
- **Extension auth**: API keys via `X-API-Key` header (filtered before JWT via `ApiKeyFilter`). JWT Bearer also works (`JwtFilter`).
- **Applications**:
  - `GET /api/v1/applications` — list user's apps (filterable: status, jobId, companyId, fromDate, toDate, page, size, sort, direction).
  - `POST /api/v1/applications` — create application (with nested company+job). Returns `Long` ID (raw number).
  - `PATCH /api/v1/applications/{id}/status` — update status only (403 if not owner).
- **Companies**: `GET /api/v1/companies` (paginated list only — no CRUD endpoints exposed).
- **Jobs**: `GET /api/v1/jobs` (paginated list only — no CRUD endpoints exposed).
- **CORS**: Allows all origins (`WebSecurityConfig`).
- **Codegen**: MapStruct + Lombok annotation processors configured; generated mappers land in `target/generated-sources/annotations`.
- **Response DTOs**: Use MapStruct mappers (e.g. `ApiKeyMapper`) for entity→dto mapping. Prefer constructor-based DTOs (`@Getter` + `@AllArgsConstructor`) over `@Data` with setters.
- **Dockerfile mismatch**: `server/Dockerfile` references `target/application-tracker-server-0.0.1-SNAPSHOT.jar`, but Maven builds `target/jobwise-0.0.1-SNAPSHOT.jar`. Update `ARG JAR_FILE` before building.
- **Server README** has unrelated Nginx deployment instructions (not Spring Boot docs).

---

## Client (`client/`)
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Base UI v4).
- **Package manager**: npm (`package-lock.json` present).
- **Scripts**: `npm run dev` (port 80, host 0.0.0.0), `npm run build` (`tsc -b && vite build`), `npm run lint` (`eslint .`).
- **Backend URL**: Configured via `VITE_API_BASE_URL` env var (default: `http://localhost:8080/api/v1`). See `.env.example`.
- **State**: React Context (`AuthContext`) + `localStorage` for tokens. No Redux.
  - Stores `accessToken` and `refreshToken`.
  - Auto-refreshes access token on 401 (via fetch wrapper) before redirecting to login.
  - Logout: immediately clears local state (triggering redirect), then best-effort API call.
- **Routing** (react-router-dom v6, BrowserRouter):
  - `/login` — LoginPage (redirects to `/` if authed)
  - `/signup` — SignupPage (redirects to `/` if authed)
  - `/` — ApplicationsPage (redirects to `/login` if not authed)
  - `/api-keys` — ApiKeysPage (redirects to `/login` if not authed)
- **Auth**: All routes except `/login` and `/signup` are protected. `ProtectedRoute` component checks `AuthContext.isAuthenticated`.
- **Pages** (4):
  - LoginPage — username + password form, calls `POST /auth/login`
  - SignupPage — username + email + password form, calls `POST /auth/signup` then auto-login
  - ApplicationsPage — toggleable Table/Kanban view with "New Application" button
  - ApiKeysPage — list, create (one-time key reveal), revoke API keys
- **Components**:
  - `layout/AppLayout.tsx` — sidebar + `<Outlet />`
  - `layout/Sidebar.tsx` — nav items (Applications, API Keys), logout button
  - `applications/ApplicationsTable.tsx` — server-side paginated/sorted/filtered table
  - `applications/StatusBadge.tsx` — color-coded badge per status
  - `applications/CreateApplicationDialog.tsx` — multi-section form (job, company, application fields)
  - `applications/KanbanBoard.tsx` — drag-and-drop board with DndKit, optimistic status updates
  - `applications/KanbanColumn.tsx` — droppable column with color-coded header
  - `applications/KanbanCard.tsx` — draggable card (job title + company name)
  - `api-keys/ApiKeysTable.tsx` — API key list with revoke action
  - `api-keys/CreateApiKeyDialog.tsx` — create form → one-time reveal dialog
  - `ui/*` — shadcn/ui components (button, input, label, card, table, badge, select, dialog, textarea, dropdown-menu, tooltip)
- **UI**: Tailwind CSS v4 + shadcn/ui + lucide-react icons.
- **API layer** (`lib/api.ts`): Native `fetch` wrapper with:
  - Auto-attached `Authorization: Bearer` header
  - 401 interceptor: refresh token → retry once → redirect to login
  - Non-JSON response handling (raw numbers, empty bodies)
- **Types** (`types/index.ts`): `ApplicationDto`, `JobDto`, `CompanyDto`, `ApiKeyResponse`, `ApplicationCreateRequest`, `PaginatedResponse<T>`, enum types.
- **Tests**: 39 tests (Vitest + testing-library + jsdom). Run `npm test` to verify.
  - `lib/api.test.ts` — fetch wrapper, response parsing, auth flows, all endpoint helpers
  - `context/AuthContext.test.tsx` — login/signup/logout state transitions
  - `components/applications/StatusBadge.test.tsx` — renders all 7 status values
  - `pages/LoginPage.test.tsx` — form rendering, validation, auth redirect
  - `pages/SignupPage.test.tsx` — form rendering, password mismatch, submission, auth redirect

---

## Extension (`extension/`)
- **Stack**: TypeScript, no bundler — `tsc` compiles `src/*.ts` → `dist/*.js`.
- **Build**: `npm run build` (runs `tsc`). `npm run watch` for watch mode.
- **Structure**: 8 TypeScript source files (`src/`), 4 HTML templates (`templates/`), 1 CSS file (`css/`).
- **Manifests**: Two variants — `manifest.json` (Firefox, uses `background.scripts`) and `manifest.chrome.json` (Chrome, uses `background.service_worker` + `host_permissions`).
- **Permissions**: `manifest.json` retains `activeTab` + `storage`. `manifest.chrome.json` uses only `storage`.
- **Auth**: API Key via `X-API-Key` header (no JWT). User configures key + URL in settings page.
- **Settings** (`templates/settings.html` + `src/settings.ts`):
  - API Base URL (required, user-configurable, no hardcoded default).
  - API Key (required, validated via `POST /apiKeys/validate` on save).
  - Profile: name, email, phone, LinkedIn URL (for auto-fill).
  - All stored in `chrome.storage.local`.
  - Back button navigates to `popup.html`.
- **Popup** (`templates/popup.html` + `src/popup.ts`): Dynamically creates buttons (Settings, Applications, Clear Key) based on whether an API key is stored. No static HTML buttons.
- **Content script** (`src/content.ts`): injected on `https://www.linkedin.com/jobs/*`.
  - Checks API key in storage on load.
  - Detects "Apply" button clicks via text content matching "apply", walking up DOM ancestors (`isApplyButton()`).
  - Scrapes job details: title (`a[href*="/jobs/view/"]`), company (`[aria-label*="Company,"]`), description (`[data-testid="expandable-text-box"]`), location, job type, external apply URL (unwraps LinkedIn `/safety/go/` redirect).
  - Builds server-compatible `ApplicationCreateRequest` payload (nested `company` + `job`).
  - Sends `chrome.runtime.sendMessage({ type: "SAVE_JOB", payload })` to background.
  - Shows toast on success/failure.
  - Auto-fills LinkedIn Easy Apply forms: detects modal via `MutationObserver`, matches form fields by label text (name, email, phone, LinkedIn URL), fills from stored profile.
- **Background** (`src/background.ts`): Single message listener for `"SAVE_JOB"` — reads API key + URL from `chrome.storage.local` (inline storage logic, no imports from `shared.ts`), POSTs to `/applications` with `X-API-Key` header.
- **Applications list** (`templates/applications.html` + `src/applications.ts`): `GET /applications?size=100` → renders centered cards (job title, company, status badge). Click passes base64-encoded app ID to detail page.
- **Application detail** (`templates/application.html` + `src/application.ts`): Decodes app ID from query param, fetches all apps and filters client-side (no `GET /applications/{id}` endpoint). Shows job details + status dropdown → `PATCH /applications/{id}/status`.
- **Shared utilities** (`src/shared.ts`): Single source for `getApiKey()`, `getApiUrl()`, `getProfile()`, `getSettings()`, `saveSettings()`, `apiRequest()`, `fetchApplications()`, `createApplication()`, `updateApplicationStatus()`, `validateApiKey()`, `displayToast()`, `getElementById()`.
- **DTOs** (`src/types.ts`): Matches server DTOs exactly (`ApplicationDto`, `JobDto`, `CompanyDto`, `ApplicationCreateRequest`, `UpdateStatusRequest`, `PaginatedResponse`, `ExtensionSettings`, `UserProfile`).
- **Security**: No `innerHTML` with scraped data. No JWT decoding client-side. No hardcoded IP addresses. No implicit globals.

---

## CI / Deploy
- `.github/workflows/server.deploy.yml` — push to `master` with `server/**` changes. Uses `actions/checkout@v2`, `actions/setup-java@v2`, `docker/setup-buildx-action@v1`. Runs `mvn test` then builds Docker image `neozenith1501/jobwise:server-latest`.
- `.github/workflows/client.deploy.yml` — push to `master` with `client/**` changes (no `workflow_dispatch`). Uses `actions/checkout@v3`. Runs `npm run build` then builds image `neozenith1501/jobwise:client-latest`.
- No root-level orchestration (`docker-compose.yml`), no CI for `extension/`, no root-level `package.json` or `pom.xml`.

---

## Known gaps & issues

### Critical (blocks functionality)
- **Resume endpoints missing**: Client previously called `POST /resumes`, `GET /resumes`, `GET /resumes/{id}`, `GET /resumes/file/{id}`, `POST /gemini/resume` — none exist on server. **Client was reinit'd without these pages**. Server `.gitignore` still ignores `resumes/` directory.
- **Application full-update missing**: Client sends `PUT /applications/{id}` with full body; server only has `PATCH /applications/{id}/status`. No full-update endpoint exists (`ApplicationMapper.updateEntity` is commented out). Extension reinit'd to only use PATCH status.
- **Dockerfile JAR name mismatch**: `server/Dockerfile` expects `application-tracker-server-0.0.1-SNAPSHOT.jar`, Maven builds `jobwise-0.0.1-SNAPSHOT.jar`.
- **Client Dockerfile**: Old `client/Dockerfile` was deleted during reinit. A new one needs to be created for production deployment.

### Auth & Security
- **Server signup hardcodes default role "ADMIN"** in `AuthService.java` (line 49: `// TODO: Think through this flow`).
- **`ApplicationStatus.fromString()` returns `null`** for invalid values instead of throwing — invalid status filter silently returns all records.
- **OAuth credentials default to `123`** in `application.yml` — must be set via env vars for OAuth to work.
- **JwtFilter** catches invalid/malformed JWTs and resolves them via `HandlerExceptionResolver` → `RestExceptionHandler` returning 401 JSON (not 403).

### Server issues
- **`GEMINI_API_KEY` missing from `.env.example`** — present in CI secrets but not in template.
- **`CompanyService.createCompany()` / `JobService.createJob()`** — catch-all `try/catch` with re-throw; duplicate names surface as raw 500 errors.
- **`ApplicationDto` missing `createdAt` field** — only `lastUpdated` is mapped.
- **`application.yml` JWT secret defaults to `"test"`** — insecure for production.
- **Server README** contains Nginx deployment instructions instead of project documentation.

### CI / Deploy
- **Client workflow lacks `workflow_dispatch`** — no manual trigger option.
- **Server workflow uses older action versions** (`checkout@v2`, `setup-java@v2`).
- **No `docker-compose.yml`** for unified local development.
- **No CI for `extension/`** directory.
- **No root-level `package.json` or orchestration**.
- **`.vscode/launch.json`** has a Java debug config for `jobwise-be`.
- **No client Dockerfile** — was removed during reinit.
- **Client workflow will fail** — references old `client/` structure; needs update for new build process.
