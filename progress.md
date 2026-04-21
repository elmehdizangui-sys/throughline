# Throughline — DESIGN.md Revamp Progress

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
