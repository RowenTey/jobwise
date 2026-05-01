# AGENTS.md — JobWise

## Repo layout
- `server/` — Spring Boot 3 backend (Java 17, Maven).
- `client/` — React 18 + Vite frontend.
- `extension/` — Chrome Extension (Manifest V3), static HTML/JS, no build step.

## Server (`server/`)
- **Build tool**: Maven (`mvn` directly).
- **Run**: `cd server && mvn spring-boot:run` (or `java -jar target/jobwise-0.0.1-SNAPSHOT.jar`).
- **Tests**: 37 tests (JUnit 5 + Mockito). Run `mvn test` to verify.
- **Database**: SQLite via Hibernate community dialect. Flyway migrations enabled (`src/main/resources/db/migration`). DB file defaults to `jobwise.db` at repo root.
- **Schema**: V1 migration creates tables for `users`, `companies`, `jobs`, `applications`, `refresh_tokens`, `user_oauth_accounts`, `api_keys`.
- **Env vars** (see `.env.example`):
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `GEMINI_API_KEY`, `JWT_SECRET`.
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
  - `JWT_SECRET` defaults to `test` in `application.yml`.
- **API**: Base path `/api/v1`. Swagger UI at `/swagger-ui/index.html`.
- **Auth**: JWT access/refresh token pair. `/api/v1/auth/**` and `/actuator/health/**` are unsecured.
  - Login: `POST /api/v1/auth/login`, Signup: `POST /api/v1/auth/signup`.
  - OAuth: `POST /api/v1/auth/oauth/{provider}` (supports `google` and `github`).
  - API Keys: `POST/GET /api/v1/auth/api-keys`, `DELETE /api/v1/auth/api-keys/{id}`.
- **Extension auth**: API keys via `X-API-Key` header (filtered before JWT). JWT Bearer also works.
- **Application status**: `PATCH /api/v1/applications/{id}/status` — returns 403 if not the resource owner (`ForbiddenException`).
- **CORS**: Hardcoded to `http://localhost:8080` only (`WebSecurityConfig`).
- **Codegen**: MapStruct + Lombok annotation processors configured; generated mappers land in `target/generated-sources/annotations`.
- **Response DTOs**: Use MapStruct mappers (e.g. `ApiKeyMapper`) for entity→dto mapping. Prefer constructor-based DTOs (`@Getter` + `@AllArgsConstructor`) over `@Data` with setters.
- **Dockerfile mismatch**: `server/Dockerfile` references `target/application-tracker-server-0.0.1-SNAPSHOT.jar`, but Maven builds `target/jobwise-0.0.1-SNAPSHOT.jar`. Update `ARG JAR_FILE` before building.

## Client (`client/`)
- **Package manager**: npm (`package-lock.json` present).
- **Scripts**: `npm run dev` (port 80, host 0.0.0.0), `npm run build`, `npm run lint`.
- **Backend URL**: Hardcoded to production IP in `client/src/App.jsx`:
  ```js
  export const serverUrl = "http://172.171.242.107:80/api/v1";
  ```
  Change to `http://localhost:8080/api/v1` for local development.
- **State**: Redux + Redux Persist. Toasts via `react-hot-toast`.
- **Dockerfile quirk**: Builds the app during image build, then runs `npm run dev` as CMD.

## Extension (`extension/`)
- Chrome Extension Manifest V3. No build step.
- **Content script**: injected on `https://www.linkedin.com/jobs/*`.
- **Flow**: Detects "Apply" clicks → extracts job details → background script POSTs to `/api/v1/applications` with Bearer token from `chrome.storage.local` (key `jwtToken`).
- **Auth**: Currently uses JWT Bearer. Can be migrated to use `X-API-Key` header with a user-generated API key.
- **CORS note**: Current CORS config (`localhost:8080` only) blocks extension requests. Add the extension origin to `WebSecurityConfig.corsConfigurationSource()`.

## CI / Deploy
- `.github/workflows/server.deploy.yml` — push to `master` with `server/**` changes. Runs `mvn test` then builds Docker image `neozenith1501/jobwise:server-latest`.
- `.github/workflows/client.deploy.yml` — push to `master` with `client/**` changes. Runs `npm run build` then builds image `neozenith1501/jobwise:client-latest`.
- No root-level orchestration.

## Known gaps
- The client has resume upload/score/list pages that call `/resumes` and `/gemini/resume` endpoints. These endpoints do not exist in the server. The server `.gitignore` already ignores a `resumes/` directory.
