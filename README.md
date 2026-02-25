# Krud
[![Krud CI](https://github.com/fl0wee-qa/Krud/actions/workflows/ci.yml/badge.svg)](https://github.com/fl0wee-qa/Krud/actions/workflows/ci.yml)

Krud is a modern QA test and bug management platform inspired by Jira, TestRail, and Linear.

## Feature Set

- Project management with methodology switching (Scrum/Kanban)
- Test case management and test runs
- Bug tracking with severity/priority/status workflows
- Specifications with versioning and coverage aggregation
- JQL-like query engine for bug filtering
- Optional Slack/Git integration adapters with mock mode
- Role-based access control baseline (Admin/QA/Developer/Viewer)
- Outbound event stream for integration observability

## Tech Stack

- Frontend: Next.js App Router, TypeScript, TailwindCSS, React Query, Zustand, Zod
- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT auth, RBAC guards
- Infra: Docker Compose, PostgreSQL container, API/Web containers
- Testing: Playwright (TypeScript) with phased scenario matrix
- CI/CD: GitHub Actions workflows (`.github/workflows/ci.yml`, `.github/workflows/cd.yml`)

## Repository Layout

```text
Krud/
  apps/
    api/      # NestJS + Prisma
    web/      # Next.js App Router
  packages/
    shared/   # shared types/constants
  tests/e2e/  # Playwright config + scenarios
```

## Architecture Diagram

```text
Next.js (apps/web) -> NestJS API (apps/api) -> PostgreSQL
                                   |
                                   +-> Integration adapters (Slack/Git)
```

## Backend Modules

- `AuthModule`
- `ProjectsModule`
- `TestsModule`
- `BugsModule`
- `AgileModule`
- `SpecsModule`
- `IntegrationsModule`
- `QueryEngineModule`

## Integration Modes

Krud works locally without external tokens.

- `SLACK_MODE=mock|webhook`
  - `mock`: writes outbound events to log and internal store
  - `webhook`: posts to `SLACK_WEBHOOK_URL`
- `GIT_MODE=links|github_api|webhook`
  - `links`: manual commit/PR links only
  - `github_api`: enrich links via `GITHUB_TOKEN`
  - `webhook`: receive and process webhook payloads

## Local Setup

1. Copy env file:
   - `cp .env.example .env` (Linux/macOS)
   - `Copy-Item .env.example .env` (PowerShell)
2. Install dependencies:
   - `npm install`
3. Start PostgreSQL:
   - `docker compose up -d postgres`
4. Generate Prisma client and run migrations:
   - `npm run db:generate`
   - `npm run db:migrate`
   - `npm run db:seed`
5. Run services:
   - API: `npm run dev:api`
   - Web: `npm run dev:web`

## Environment Variables

Required:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_URL`
- `NEXT_PUBLIC_API_URL`

Seed user:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `VIEWER_EMAIL`
- `VIEWER_PASSWORD`

Optional integrations:
- `SLACK_MODE`
- `SLACK_WEBHOOK_URL`
- `GIT_MODE`
- `GITHUB_TOKEN`
- `GITHUB_WEBHOOK_SECRET`

## Development Phases

1. Auth + Projects + Basic Bugs
2. Test Cases + Test Runs
3. Agile Board + Sprint logic
4. Query language engine
5. Slack/Git integrations
6. CI, quality hardening, test coverage expansion

## Testing

- Unit/integration tests: workspace package scripts
- E2E: `npm run e2e`
- Playwright config: `tests/e2e/playwright.config.ts`
- Phase 1 live E2E: `tests/e2e/specs/phase1-auth-projects-bugs.spec.ts`
- Phase 1 guardrails E2E: `tests/e2e/specs/phase1-guardrails.spec.ts`
- Phase 2 tests/runs E2E: `tests/e2e/specs/phase2-tests-runs.spec.ts`
- Phase 3 bugs/query E2E: `tests/e2e/specs/phase3-bugs-query.spec.ts`
- Phase 3 agile E2E: `tests/e2e/specs/phase3-agile.spec.ts`
- Phase 4 query parser E2E: `tests/e2e/specs/phase4-query.spec.ts`
- Phase 6 core closures E2E: `tests/e2e/specs/phase6-core-closures.spec.ts`

## CI/CD

- CI (`.github/workflows/ci.yml`)
  - Job `lint_build`: install, Prisma generate, lint, build
  - Job `e2e`: PostgreSQL service, `db:deploy`, seed, Playwright run
  - Uploads artifacts: `playwright-report`, `test-results`
- CD (`.github/workflows/cd.yml`)
  - Runs on `main` push or manual dispatch
  - Builds and pushes Docker images to GHCR:
    - `ghcr.io/<owner>/krud-api:latest` (+ `sha-<commit>`)
    - `ghcr.io/<owner>/krud-web:latest` (+ `sha-<commit>`)
  - Optional deploy hooks:
    - `DEPLOY_HOOK_API`
    - `DEPLOY_HOOK_WEB`

## Public Deployment

- GitHub Pages is not suitable for this project (it is not static-only).
- Recommended: GitHub repo + Vercel (`apps/web`) + Render/Railway (`apps/api` + PostgreSQL).
- Full step-by-step guide: [docs/deployment.md](docs/deployment.md)

## API Endpoints (Initial)

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

Projects:
- `POST /api/projects`
- `GET /api/projects`
- `PATCH /api/projects/:projectId/settings`
- `PATCH /api/projects/:projectId/methodology/:methodology`

Tests:
- `POST /api/tests/cases`
- `GET /api/tests/cases?projectId=...`
- `PATCH /api/tests/cases/:id`
- `POST /api/tests/runs`
- `POST /api/tests/runs/:testRunId/results`

Bugs:
- `POST /api/bugs`
- `GET /api/bugs?projectId=...`
- `PATCH /api/bugs/:id`

Agile:
- `POST /api/agile/sprints`
- `GET /api/agile/sprints?projectId=...`
- `POST /api/agile/columns`
- `PATCH /api/agile/move-bug`

Specs:
- `POST /api/specs`
- `GET /api/specs?projectId=...`
- `PATCH /api/specs/:specId`
- `GET /api/specs/coverage/:projectId`

Query Engine:
- `POST /api/query/bugs`
- `POST /api/query/saved`
- `GET /api/query/saved?projectId=...`

Integrations:
- `POST /api/integrations/slack/test`
- `POST /api/integrations/git/resolve`
- `POST /api/integrations/git/webhook`
- `GET /api/integrations/events`

Users:
- `GET /api/users?role=DEVELOPER`

## Manual Steps (Optional Integrations)

1. Create Slack Incoming Webhook and set `SLACK_MODE=webhook`, `SLACK_WEBHOOK_URL=...`
2. Create GitHub PAT for metadata mode and set `GIT_MODE=github_api`, `GITHUB_TOKEN=...`
3. Configure GitHub webhook and set `GIT_MODE=webhook`, `GITHUB_WEBHOOK_SECRET=...`

## Screenshots

Use `docs/screenshots/` for portfolio captures:
- dashboard-overview.png
- test-runs.png
- bug-board.png
