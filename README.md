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
- Supabase Postgres (server-side access via service role key)
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
- `SUPABASE_SERVICE_ROLE_KEY`

4. Create database schema in Supabase SQL Editor:

- Run: `supabase/schema.sql`

5. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Dynamic behavior and fallback

- If Supabase env vars are present, all data comes from Supabase.
- On first boot, seed data is inserted automatically if tables are empty.
- If env vars are missing, the app uses design seed data in memory so UI still works.

## API routes

- `GET /api/bootstrap` - goals, projects, entries, minimap
- `POST /api/entries` - create entry
- `PATCH /api/entries/:id` - update starred/archived status
