# JobWise

A job application tracking system with a Spring Boot backend, React frontend, and browser extension for saving listings from job boards.

## Project Structure

| Directory | Description |
|-----------|-------------|
| `server/` | Spring Boot 3 backend (API, auth, persistence) — [README](server/README.md) |
| `client/` | React 18 + Vite frontend (SPA with Table/Kanban views) — [README](client/README.md) |
| `extension/` | Browser extension (Manifest V3) for saving jobs from LinkedIn, Indeed, Greenhouse, Lever — [README](extension/README.md) |

## Dev Environment Setup

### Prerequisites

- Java 17 (Eclipse Temurin recommended)
- Maven 3.9+
- Node.js 20+
- npm
- Docker (optional, for image usage)

### Option A — Separate Dev Servers

Run the backend and frontend independently for hot-reload during development.

```bash
# 1. Start the API server
cd server
mvn spring-boot:run          # http://localhost:8080

# 2. In another terminal, start the frontend dev server
cd client
npm install
npm run dev                  # http://localhost:5173
```

Set the backend URL in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Option B — Server Serves Frontend

Build the frontend into the server's static assets directory, then run the server as a single unit.

```bash
# 1. Build frontend into server/src/main/resources/static/
cd client
npm install
npm run build

# 2. Start the server (serves API + SPA on the same origin)
cd ../server
mvn spring-boot:run           # http://localhost:8080
```

### Extension

```bash
cd extension
npm install
npm run build
```

Load the unpacked extension from `extension/` via `about:debugging` (Firefox) or `chrome://extensions` (Chrome, developer mode).

### Running Tests

```bash
cd server && mvn test         # 40 tests (JUnit 5 + Mockito)
cd client && npm test         # 40 tests (Vitest + testing-library)
```

### Environment Variables

Key variables for the server — see `server/.env.example` for the full list.

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `JWT_SECRET` | `test` | Yes | JWT signing secret |
| `DB_URL` | `jdbc:sqlite:jobwise.db?...` | No | JDBC URL for SQLite |
| `GOOGLE_CLIENT_ID` | `123` | For OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `123` | For OAuth | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | `123` | For OAuth | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `123` | For OAuth | GitHub OAuth client secret |

## Docker Usage

Pre-built images are published to GHCR. The image uses a multi-stage build — the JAR is compiled inside the container, so no local Maven installation is needed.

### Pull

```bash
docker pull ghcr.io/rowentey/jobwise:latest
```

### Run

```bash
docker run -p 8080:8080 \
  -e JWT_SECRET=your-secret \
  ghcr.io/rowentey/jobwise:latest
```

### Docker Compose

Create a `docker-compose.yml` for persistent data and easier configuration:

```yaml
services:
  jobwise:
    image: ghcr.io/rowentey/jobwise:latest
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DB_URL=jdbc:sqlite:/data/jobwise.db?journal_mode=WAL&temp_store=MEMORY&cache_size=-10000
    volumes:
      - ./data:/data
```

Then run:

```bash
JWT_SECRET=your-secret docker compose up -d
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Java 17, Spring Boot 3, Maven, SQLite, Flyway, JWT, OAuth2 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| Extension | TypeScript, Manifest V3, esbuild |
| CI/CD | GitHub Actions, GHCR |
