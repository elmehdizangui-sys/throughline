# Throughline

Throughline is a design-accurate implementation of the provided `project-design/Throughline.html` UI, rebuilt as a dynamic Next.js app with Supabase persistence.

## What was implemented from the design

- Editorial journal layout with both top-bar and sidebar modes
- Big Lines (Life Goals + Projects) command center
- Capture composer with:
  - multiline input
  - goal/project linking picker
  - hashtag extraction
  - code entry mode
- Feed grouping by day with:
  - starred entries
  - pivot markers
  - link previews
  - code blocks
- Full filtering behavior:
  - global filters (`All`, `Starred`, `Links`, `Code`)
  - context filters (click goal/project/tag)
- Weekly Review modal with keyboard shortcuts and apply actions
- Theme tweaks panel (theme, accent, layout, density, entry style, typography)
- Minimap rail

## Tech stack

- Next.js (App Router) + TypeScript
- Supabase Auth + Postgres
- CSS ported from the source design with near 1:1 visual fidelity

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_OWNER_EMAIL` (optional)

4. Create database schema in Supabase SQL Editor:

- Run: `supabase/schema.sql`
- If you already ran an older version, re-run the file to apply the `alter table ... add column if not exists` additions.

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Dynamic behavior

- Goals, projects, and entries are loaded only from Supabase.
- User profile settings (name and bio) are stored in `throughline_profiles`.
- No in-memory seed goals/projects/entries are used.
- If your tables are empty, the UI starts empty until you add data.

## Features added (claude-features branch)

### Weekly Commitments
Up to 5 short commitments per week, shown above the feed. Check off, delete, track progress. Persisted in `throughline_commitments`. API: `GET/POST /api/commitments`, `PATCH/DELETE /api/commitments/:id`.

### Akhirah Lens
Crescent moon button in the masthead nav. When enabled, dunya-priority entries dim and akhirah-priority entries glow. State persists to `throughline_profiles.tweaks` and syncs across sessions. API: `POST /api/profile/tweaks`.

### Goal & Project Status
Goals and projects now have a `status` field: `active | paused | someday | archived`.
- Composer shows a pill selector (active=green dot, paused=amber dot, someday=gray dot)
- Sidebar items get a left color-flag border using the goal/project color
- BigLineBar dots use the goal/project color
- Archived items are visually muted

### Color-coded Goals & Projects
Each goal or project stores a `color` (oklch string). The color is shown as:
- A colored dot in the BigLineBar
- A left border stripe in the sidebar
- Inherited by child projects when linked to a goal

### Time-aware Entry Placeholder
The entry input shows context-sensitive placeholder text based on time of day (morning, midday, afternoon, evening, night, late night).

### Tweaks Persist to DB
UI preferences (theme, accent, layout, density, entry style, font, akhirah lens) now sync to `throughline_profiles.tweaks` via `POST /api/profile/tweaks`. On load, DB tweaks override localStorage.

### Mobile Responsive Layout
CSS breakpoints at ≤640px: masthead collapses, sidebar hides, composer fields stack, feed/timeline/threads adapt to single-column.

### Error Boundary
A React error boundary (`ErrorBoundary`) wraps the app surface. Catches render crashes and shows a "Try again" reset button.

### Multi-User Infrastructure (DB-ready, single user today)
Migration `20260420_multi_user_infra.sql` adds `user_id` FK + RLS policies to all tables. All API routes enforce `getAuthUser()` defense-in-depth (including read routes: bootstrap, threads, timeline). Ready for multi-user without further DB changes.

### Bootstrap Performance
Initial entry load capped at 60 entries. `hasMoreEntries` flag returned for future infinite scroll.

### Security Hardening
- `getAuthUser()` on every API route including read-only ones
- Tweaks endpoint validates allowlist of known keys before writing to DB
- Entry content capped at 100,000 characters
- `week_key` format validated with regex on commitments routes

---

## API routes

- `GET /api/bootstrap` - goals, projects, entries (max 60), profile, commitments, minimap
- `POST /api/entries` - create entry (`priority`: `dunya` or `akhirah`)
- `PATCH /api/entries/:id` - update entry flags (`starred`, `archived`, `signal`, pivot metadata, `priority`)
- `POST /api/goals` - create a goal (with `color`, `status`)
- `PATCH /api/goals/:id` - update a goal
- `POST /api/projects` - create a project (with `color`, `status`, `goal_id`)
- `PATCH /api/projects/:id` - update a project
- `GET /api/commitments?week=YYYY-WNN` - commitments for a given week
- `POST /api/commitments` - create a commitment
- `PATCH /api/commitments/:id` - toggle done / reorder
- `DELETE /api/commitments/:id` - delete a commitment
- `POST /api/profile/tweaks` - sync UI preferences to DB
- `GET /api/threads?months=6` - aggregated spine data for Threads view
- `GET /api/timeline?year=2026` - aggregated year-line data for Timeline view

## Production security baseline

- All routes are protected with Supabase Auth session checks in middleware.
- API requests are rate-limited in middleware to reduce brute-force and abuse attempts.
- Security headers are set globally (CSP, frame protection, MIME sniffing protection, referrer policy, permissions policy, HSTS in production).
- Server-side Supabase data access uses `SUPABASE_SERVICE_ROLE_KEY`.
- Optional single-owner lock is available through `APP_OWNER_EMAIL`.

For production deployment:

1. Configure Supabase Auth (Email/Password provider) in your project settings.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in hosting secrets.
3. Optionally set `APP_OWNER_EMAIL` to restrict access to one account.
4. Keep `.env.local` out of git (already covered by `.gitignore`).
5. Deploy only over HTTPS.
