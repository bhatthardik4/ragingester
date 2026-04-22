# Ragingester Bootstrap Plan (Repo + Stage-Based Build)

## Summary
Initialize a new **public GitHub monorepo** named `ragingester` and deliver in stages: first ship usable card UI/workflow (with per-card cron scheduling and placeholder execution), then add real source collectors incrementally.

## Implementation Stages

### Stage 0: Repo Bootstrap
- Initialize git in `C:\Users\onya3\Kaiqi-Website\ragingester` and create first commit.
- Create GitHub repo `ragingester` (public), set `origin`, push `main`.
- Monorepo layout:
  - `apps/web` (React)
  - `apps/api` (Node/Express)
  - `packages/shared` (shared constants/types as JSDoc-defined contracts for JS)
- Root setup with npm workspaces, `.editorconfig`, `.gitignore`, basic README, and env templates.

### Stage 1: Basic Product UX First
- Implement auth-aware card CRUD UI and API.
- Card fields (v1):
  - `source_type`
  - `source_input`
  - `params`
  - `schedule_enabled`
  - `cron_expression`
  - `timezone`
  - `next_run_at`
  - `last_run_at`
  - `active`
- Add manual run endpoint and placeholder executor (no real source collection yet).
- Add run history/status views so users can create cards, schedule them, and see run lifecycle.

### Stage 2: Scheduler + Run Engine
- Add scheduler worker that picks due cards by `next_run_at`, triggers runs, updates `next_run_at`.
- Enforce one active run per card.
- Add retry and timeout policy at the run framework level.
- Store run metadata with trigger mode (`manual` vs `scheduled`) and error/log payloads.

### Stage 3+: Source Types Incremental Rollout
- Add collector plugin contract in API runtime:
  - `collect({ source_input, params, context }) -> { raw, normalized, metrics, error? }`
- Implement source types one by one:
  1. `http_api` (first production reference)
  2. `website_url`
  3. `rss_feed`
  4. `identifier_based` (non-URL identifiers)
- For each source type: validation schema, UI form config, collector module, integration tests, release.

## Public Interfaces and Data Contracts
- APIs:
  - `POST /cards`
  - `GET /cards`
  - `PATCH /cards/:id`
  - `DELETE /cards/:id`
  - `POST /cards/:id/run`
  - `GET /cards/:id/runs`
  - `GET /runs/:id`
  - `GET /cards/:id/schedule/preview` (returns next 5 runs from cron + timezone)
- Supabase tables:
  - `cards`
  - `collection_runs`
  - `collected_data`
- Security:
  - RLS: users can access only their own cards/runs/data.

## Test Plan
- **Stage 0**: workspace scripts run, repo pushed, CI smoke check.
- **Stage 1**: CRUD API tests, cron/timezone validation, UI form and run-history tests.
- **Stage 2**: scheduler integration, overlap lock, retry/timeout, `next_run_at` recomputation tests.
- **Stage 3+**: per-source collector contract tests and end-to-end run persistence tests.

## Assumptions and Defaults
- Repo name: `ragingester`.
- GitHub remote: public.
- Stack: JavaScript + npm workspaces.
- Cron format: standard 5-field cron.
- One schedule per card in v1.
- Default timezone fallback: `America/Chicago`.