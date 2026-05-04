# JobWise Server

Spring Boot 3 backend for the JobWise job application tracker.

## Tech Stack

- Java 17, Spring Boot 3
- Maven build
- SQLite via Hibernate community dialect + Flyway migrations
- JWT + OAuth2 (Google, GitHub) + API Key authentication
- MapStruct + Lombok
- Swagger UI at `/swagger-ui/index.html`
- 40 tests (JUnit 5 + Mockito)
- MapStruct + Lombok annotation processors (generated mappers in `target/generated-sources/annotations`)
- CORS: allows all origins

## Setup

```bash
# Run
cd server && mvn spring-boot:run

# Tests
mvn test

# Build JAR
mvn package
```

The server runs on port 8080 by default.

## Services

- AuthService, RefreshTokenService, OAuthService, UserService, ApiKeyService
- ApplicationService, CompanyService, JobService

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:sqlite:jobwise.db?journal_mode=WAL&temp_store=MEMORY&cache_size=-10000` | JDBC URL (see PRAGMAs section) |
| `DB_USERNAME` | `""` | DB username |
| `DB_PASSWORD` | `""` | DB password |
| `JWT_SECRET` | `test` | JWT signing secret (insecure default) |
| `GOOGLE_CLIENT_ID` | `123` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `123` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | `123` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `123` | GitHub OAuth client secret |
| `GEMINI_API_KEY` | — | Gemini API key (used in CI) |

See `.env.example`.

## API (base path: `/api/v1`)

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | No | Login, returns `{ accessToken, refreshToken }` |
| `POST` | `/auth/signup` | No | Register (returns 201, no body) |
| `POST` | `/auth/refresh` | No | Refresh access token |
| `POST` | `/auth/logout` | Bearer | Logout, revokes refresh token |
| `POST` | `/auth/oauth/{provider}` | No | OAuth login (google, github) |

### Applications
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/applications` | Bearer/API Key | Paginated list (filters: status, jobId, companyId, fromDate, toDate, page, size, sort, direction) |
| `GET` | `/applications/{id}` | Bearer/API Key | Get single application by ID |
| `POST` | `/applications` | Bearer/API Key | Create application (returns ID) |
| `PATCH` | `/applications/{id}/status` | Bearer/API Key | Update status only |

### Companies
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/companies` | Bearer/API Key | Paginated list (no CRUD endpoints exposed) |

### Jobs
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/jobs` | Bearer/API Key | Paginated list (no CRUD endpoints exposed) |

### API Keys
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/apiKeys` | Bearer | List API keys |
| `POST` | `/apiKeys` | Bearer | Create API key |
| `DELETE` | `/apiKeys/{id}` | Bearer | Revoke API key |
| `POST` | `/apiKeys/validate` | None | Validate API key (for extension) |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/actuator/health` | No | Health check |

## Database

SQLite file (`jobwise.db` at repo root by default). Flyway migrations in `src/main/resources/db/migration`. V1 creates 7 tables: `users`, `companies`, `jobs`, `applications`, `refresh_tokens`, `user_oauth_accounts`, `api_keys`.

### PRAGMAs

The JDBC URL defaults to the following PRAGMAs for performance:

| PRAGMA | Value | Effect |
|---|---|---|
| `journal_mode` | `WAL` | Write-Ahead Logging — concurrent reads during writes |
| `temp_store` | `MEMORY` | Temp tables/indices stored in memory (faster, no I/O) |
| `cache_size` | `-10000` | Page cache of ~10 MB (10,000 pages at 1 KB each) |

To override, include your own PRAGMAs in the `DB_URL` env var, e.g. `jdbc:sqlite:jobwise.db?journal_mode=DELETE&temp_store=FILE`.

## Auth

Three auth modes:
1. **JWT Bearer** — access/refresh token pair via `Authorization: Bearer` header. `JwtFilter` catches invalid/malformed JWTs and returns 401 JSON.
2. **API Key** — via `X-API-Key` header (filtered before JWT via `ApiKeyFilter`). Used by the browser extension.
3. **OAuth2** — Google and GitHub providers.

## Response DTOs

Use MapStruct mappers for entity-to-DTO mapping (e.g. `ApplicationMapper`). Prefer constructor-based DTOs (`@Getter` + `@AllArgsConstructor`) over `@Data` with setters where possible.

## Known Issues

- Signup hardcodes default role "ADMIN" (`AuthService.java:49`)
- `ApplicationStatus.fromString()` returns null for invalid values instead of throwing
- `GEMINI_API_KEY` missing from `.env.example`
- `application.yml` JWT secret defaults to `"test"`
- Dockerfile JAR name mismatch: `server/Dockerfile` references `application-tracker-server-0.0.1-SNAPSHOT.jar` but Maven builds `jobwise-0.0.1-SNAPSHOT.jar`. Update `ARG JAR_FILE` before building.
