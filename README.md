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
- Supabase Postgres (configured via publishable key)
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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

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
- No in-memory seed goals/projects/entries are used.
- If your tables are empty, the UI starts empty until you add data.

## API routes

- `GET /api/bootstrap` - goals, projects, entries, minimap
- `POST /api/entries` - create entry
- `PATCH /api/entries/:id` - update entry flags (`starred`, `archived`, `signal`, pivot metadata)
- `POST /api/goals` - create a goal
- `PATCH /api/goals/:id` - update a goal
- `POST /api/projects` - create a project
- `PATCH /api/projects/:id` - update a project
- `GET /api/threads?months=6` - aggregated spine data for Threads view
- `GET /api/timeline?year=2026` - aggregated year-line data for Timeline view
