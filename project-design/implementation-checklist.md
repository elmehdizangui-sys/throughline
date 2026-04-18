# Throughline Implementation Checklist (Proposal-Aligned)

This checklist maps the design direction from `project-design/Throughline - design proposals.html` onto the current codebase surface (`src/app`, `src/lib`, `supabase/schema.sql`).

## Phase 0 - Baseline and Guardrails

- [ ] Preserve current editorial token system as the visual base in `src/app/globals.css` (`--paper`, `--ink`, `--accent`, `--star`, serif + mono pairing).
- [ ] Keep interaction language consistent with proposal: "composer", "threads", "timeline", "signals", "pivots", "line/year".
- [ ] Add a migration notes section in `README.md` for new tables/columns and endpoint changes.

**Done when**
- Existing feed UI still renders unchanged after refactor scaffolding.
- New work does not regress theme/layout/density tweak behavior.

## Phase 1 - Data Model and Schema (Supabase)

Update `supabase/schema.sql` to support proposal semantics.

### Goals and Projects

- [ ] Add `goal_id text null` to `throughline_projects` (single parent goal, nullable for standalone projects).
- [ ] Add `target_date date null`, `active_from date null`, `active_to date null` to `throughline_goals`.
- [ ] Add `color text null`, `target_date date null`, `active_from date null`, `active_to date null` to `throughline_projects`.
- [ ] Add foreign key constraint from `throughline_projects.goal_id` to `throughline_goals.id` with `on delete set null`.

### Entries

- [ ] Keep existing `is_pivot`, `from_text`, `to_text`, `slot_kind`.
- [ ] Add `signal boolean not null default false` (separate from `starred` if you want signal-specific timeline rendering).
- [ ] Add `pivot_label text null` (short timeline label, e.g. "Pricing", "Positioning").

### Indexes

- [ ] Add indexes for timeline and thread reads:
  - `throughline_entries (created_at desc)`
  - `throughline_entries (signal)`
  - `throughline_entries (is_pivot)`
  - `throughline_projects (goal_id, order_index)`

**Done when**
- Migration runs cleanly on a fresh Supabase project.
- Bootstrap still returns data after schema update.

## Phase 2 - Types and Service Layer

### Update shared types in `src/lib/types.ts`

- [ ] Extend `ThroughlineGoal` with `target_date`, `active_from`, `active_to`.
- [ ] Extend `ThroughlineProject` with `goal_id`, `color`, `target_date`, `active_from`, `active_to`.
- [ ] Extend `ThroughlineEntry` with `signal` and `pivotLabel`.
- [ ] Add view models:
  - `ThroughlineThreadRow`
  - `ThroughlineThreadDetail`
  - `ThroughlineTimelineYear`
  - `ThroughlineWeekDetail`

### Extend service API in `src/lib/throughline-service.ts`

- [ ] Add goal/project create + update helpers:
  - `createGoal`, `updateGoal`
  - `createProject`, `updateProject`
- [ ] Add thread read helper:
  - `getThreadsView(rangeMonths?: number)`
- [ ] Add timeline read helper:
  - `getTimelineView(year: number)`
- [ ] Expand `patchEntry` to accept `signal`, `pivotLabel`, and promote actions.
- [ ] Keep `getBootstrapData` lightweight; avoid returning all heavy aggregates if not needed for initial paint.

**Done when**
- TypeScript passes with no `any` fallbacks for new data contracts.
- Service functions return deterministic shapes for UI components.

## Phase 3 - API Routes

Add/expand routes in `src/app/api`.

### Composer endpoints

- [ ] `POST /api/goals`
- [ ] `PATCH /api/goals/:id`
- [ ] `POST /api/projects`
- [ ] `PATCH /api/projects/:id`

### View endpoints

- [ ] `GET /api/threads?months=6`
- [ ] `GET /api/timeline?year=2026`
- [ ] Optional: `GET /api/threads/:id` for thread detail payload.

### Entry actions

- [ ] Expand `PATCH /api/entries/:id` to support:
  - `starred`
  - `archived`
  - `signal`
  - `isPivot`, `from`, `to`, `pivotLabel`

**Done when**
- Routes validate payloads and return typed JSON.
- All routes fail gracefully with 4xx on bad input and 5xx on service errors.

## Phase 4 - Frontend Refactor (Current `src/app/page.tsx` Split)

Current page is monolithic; split by feature before implementing proposal screens.

### Create feature folders

- [ ] Add `src/features/throughline/feed/*` (current feed components).
- [ ] Add `src/features/throughline/composer/*`.
- [ ] Add `src/features/throughline/threads/*`.
- [ ] Add `src/features/throughline/timeline/*`.
- [ ] Keep `src/app/page.tsx` as orchestrator/container.

### Wire existing nav state

- [ ] Use `view` (`feed | threads | map`) to actually switch rendered main content.
- [ ] Preserve current feed as fallback while new views are built.

**Done when**
- `page.tsx` mostly coordinates state/fetching, not large JSX blocks.
- Switching tabs updates visible view, not only nav highlight.

## Phase 5 - Proposal Screen 1 (Composer: Goal/Project Create + Edit)

### UI behavior

- [ ] Build a reusable composer modal component with mode tabs: `Life goal` / `Project`.
- [ ] Use the same composer for create and edit (prefill on edit).
- [ ] For project mode, default parent goal selection; allow standalone as explicit secondary option.
- [ ] Add target date and color controls with inherited default from goal.

### Entry points

- [ ] In `Sidebar`, add dashed tiles:
  - `+ New life goal`
  - `+ New project`
- [ ] In `BigLineBar`, add dashed empty slot behavior for quick add (when fewer than slot count).
- [ ] Ensure entry points open composer pre-selected to context where applicable.

**Done when**
- User can create/edit goals/projects without leaving current page.
- New goal/project appears immediately in sidebar and big line slots.

## Phase 6 - Proposal Screen 2 (Threads View / Spine)

### Threads overview

- [ ] Build horizontal spine rows for each goal.
- [ ] Nest project rows under parent goal (indented).
- [ ] Render captures as beads by date position.
- [ ] Render signals larger (gold) and pivots as vertical marks.
- [ ] Render `NOW` marker on each spine.

### Interactions

- [ ] Click bead -> open capture detail panel (or reuse existing entry detail surface).
- [ ] Click thread label -> open thread detail view.
- [ ] Thread detail includes:
  - thread headline
  - stats (captures/signals/start/last/pivots)
  - signal list narrative

### Data

- [ ] Use `GET /api/threads` payload optimized for percentage/date positioning and counts.

**Done when**
- Threads tab gives at-a-glance rhythm and gaps across goals/projects.
- Drill-down interactions function without page reload.

## Phase 7 - Proposal Screen 3 (Timeline / Year Line)

### Year visualization

- [ ] Build one horizontal year axis with month markers.
- [ ] Render weekly density bars above line (base + signal segment).
- [ ] Render pivot ticks crossing the line with short labels.
- [ ] Render active period ribbons for goals/projects above the axis.
- [ ] Show faint stubs for future weeks to keep the year visually whole.

### Week detail

- [ ] Clicking a week opens/updates week detail panel below.
- [ ] Panel shows week title, stats, and signal narrative list.

### Data

- [ ] Use `GET /api/timeline?year=` for:
  - 52 week buckets
  - signal counts
  - pivot events
  - ribbon intervals

**Done when**
- Timeline tab answers "what changed and when" in seconds.
- Week detail is readable and editorial, not raw log output.

## Phase 8 - Styling Consistency Pass

Apply proposal styling patterns without breaking existing token system.

- [ ] Introduce reusable classes for mono-eyebrow labels, dashed action tiles, spine beads, pivot ticks, ribbons.
- [ ] Keep typography semantics:
  - display serif for authored meaning
  - body for supporting text
  - mono for metadata labels
- [ ] Ensure hover/focus states remain subtle, paper-like, and accessible.

**Done when**
- Feed, Threads, Timeline, Composer feel like one coherent product language.

## Phase 9 - QA and Verification

- [ ] Manual QA matrix:
  - create/edit goal
  - create/edit project (linked + standalone)
  - capture with tags/goal/project
  - star/signal/pivot flows
  - thread drill-in/out
  - timeline year switch + week selection
- [ ] Mobile/responsive checks for sidebar/top layout modes.
- [ ] Empty-state checks (no goals, no projects, no entries).
- [ ] Error-state checks (API failures, malformed payloads).
- [ ] Update `README.md` with final route list and feature behavior.

**Done when**
- All major flows function in light/dark themes and both layouts.
- No console errors in standard navigation paths.

## Suggested PR Sequence

1. **PR 1 - Data + Types + API contracts**
2. **PR 2 - Refactor `page.tsx` into feature modules**
3. **PR 3 - Composer + create/edit goal/project flows**
4. **PR 4 - Threads view + thread detail**
5. **PR 5 - Timeline view + week detail + polish**

---

## Current File Touch Map

- `supabase/schema.sql`: schema extensions for goal/project relationships and timeline semantics.
- `src/lib/types.ts`: new entities and API payload/result contracts.
- `src/lib/throughline-service.ts`: aggregation + mutation service methods.
- `src/app/api/bootstrap/route.ts`: keep minimal startup payload.
- `src/app/api/entries/route.ts`: entry create contract update.
- `src/app/api/entries/[id]/route.ts`: patch action expansion.
- `src/app/api/goals/*`, `src/app/api/projects/*`, `src/app/api/threads/*`, `src/app/api/timeline/*`: new routes.
- `src/app/page.tsx`: orchestration only after feature split.
- `src/app/globals.css`: shared visual primitives for composer/threads/timeline.
