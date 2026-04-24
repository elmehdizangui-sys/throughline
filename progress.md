# Throughline — Design Proposals Implementation

## Proposal Revamp (Apr 24 2026) — COMPLETE

### Deliverables implemented
| # | Deliverable | Status | Files |
|---|---|---|---|
| A | Composer modal (goal/project) | ✅ Done | components.jsx + app.jsx + Throughline.html CSS |
| B | Threads view ("The Spine") | ✅ Done | components.jsx + app.jsx |
| C | Timeline view ("The Year Line") | ✅ Done | components.jsx + app.jsx |
| D | Inline "+ new" dashed tiles | ✅ Done | components.jsx (Sidebar) + Throughline.html CSS |

### What changed
- `project-design/Throughline.html` — Added ~200 lines of CSS: `--pivot`/`--pivot-soft`/`--f-italic` tokens, `.side-create` dashed buttons, `.composer-*` modal, `.threads-*`/`.spine*` threads view, `.tl`/`.year-*` timeline view
- `project-design/throughline/components.jsx` — Added `ComposerModal`, `ThreadsView`, `TimelineView` components; updated `Sidebar` with dashed "New life goal"/"New project" buttons wired to composer
- `project-design/throughline/app.jsx` — Added `composerOpen`/`composerKind` state, `openComposer`/`handleComposerSave` handlers, conditional screen rendering for feed/threads/map views, `ComposerModal` render

### To pick up
- Open `project-design/Throughline.html` in browser — all three nav tabs should switch screens
- Composer: click "New life goal" or "New project" in sidebar, or extend to wire from other entry points
- Accent colors use terracotta family (via `var(--accent)`) — not hardcoded indigo

---

# Throughline — DESIGN.md Revamp Progress (previous session)

## Goal
Restyle the entire UI to match the Claude/Anthropic DESIGN.md design system while keeping all core features intact.

## Design System Summary
- **Background**: Parchment `#f5f4ed`, Ivory `#faf9f5`
- **Accent**: Terracotta `#c96442` (replacing indigo/oklch accent)
- **Text**: Anthropic Near Black `#141413`, Olive Gray `#5e5d59`, Stone Gray `#87867f`
- **Borders**: Border Cream `#f0eee6`, Border Warm `#e8e6dc`
- **Shadows**: Ring-based `0px 0px 0px 1px` (no heavy drop shadows)
- **Radii**: 8px standard, 12px large, 16px featured, 32px hero/media
- **Typography**: Serif weight 500 always, body line-height 1.60, body 15-16px
- **Buttons**: Rectangular (8-12px radius), NOT pill-shaped (except tags/chips = 24px)

## Steps

- [x] Step 0: Read all current CSS and components
- [x] Step 1: Create progress.md
- [x] Step 2: Update `base.css` — color tokens, typography, layout base, masthead, nav, bigline, buttons
- [x] Step 3: Update `surface.css` — entry/feed, capture, modal, commitments, heart states, audit panel
- [x] Step 4: Update `views.css` — tweaks panel, sidebar, threads, timeline, muhasabah
- [x] Step 5: Update `surface-meta.css` — filter context, priority tags
- [x] Step 6: Update `login/page.tsx` — restyle with DESIGN.md aesthetic
- [x] Step 7: Verify build passes — TypeScript clean, Next.js build green
