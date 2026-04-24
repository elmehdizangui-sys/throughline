# HANDOFF — Implement "Throughline design proposals"

You are implementing three new screens + one inline widget from `Throughline - design proposals.html` (the spec) into the live prototype at `Throughline.html`. Do not rewrite the whole app — **additive integration only**. Match the exact visual language already in the spec file; lift tokens and patterns verbatim.

---

## 0. Read these first (required, in this order)

1. `Throughline - design proposals.html` — the spec. Every selector, class name, layout rule, and SVG shape you need is in there. **Copy, don't reinvent.**
2. `Throughline.html` — the current live app. Note its existing tokens (`--paper`, `--ink`, `--accent`, `--f-display`, etc.), the 3-column shell, the left nav (Feed / Threads / Timeline / Review / Weekly review), and the right rail (Life goals / Projects with `+ New life goal` / `+ New project` buttons).
3. `DESIGN.md` if present — authoritative token definitions.

**Critical parity rules:**
- The spec uses **indigo accent** (`oklch(0.45 0.14 270)`). The live app uses **terracotta** (`#c96442`). When porting, use the **live app's** tokens (`var(--accent)`, `var(--accent-soft)`, `var(--accent-ink)`, `var(--accent-tint)`). Do NOT hardcode oklch indigo values — replace them with the terracotta vars.
- The spec uses font tokens `--f-display` (Fraunces), `--f-italic` (Instrument Serif), `--f-body` (Inter), `--f-mono` (JetBrains Mono). These already exist in `Throughline.html` — reuse them.
- The spec has warm paper tokens `--paper-2`, `--paper-3`, `--rule`, `--rule-strong`, `--ink-2..4`, `--star`, `--star-soft`. These match the live app. Reuse as-is.
- Add one new token the live app is missing: `--pivot: var(--accent)` and `--pivot-soft: var(--accent-tint)` — the spec uses a separate pivot hue but in our palette pivot already lives inside the terracotta family, so alias them.

---

## 1. Scope — four deliverables

| # | Name | Where it lives | Entry point |
|---|---|---|---|
| A | **Composer** (new goal / new project modal) | Overlay on any screen | Sidebar `+ New life goal` / `+ New project` buttons |
| B | **Threads view** ("The Spine") | New screen | Left nav → `Threads` |
| C | **Timeline view** ("The Year Line") | New screen | Left nav → `Timeline` |
| D | **Inline "+ new" tiles** | Right sidebar, bottom of each section | Already stubbed in `Throughline.html` — just restyle to dashed tile |

Do all four in one pass. Do not split across files — keep everything in `Throughline.html`.

---

## 2. Architecture — how to wire multiple screens

The current app has only the Feed screen. You need **view routing** without a framework.

**Approach:** wrap each screen in `<main data-screen="feed">`, `<main data-screen="threads">`, `<main data-screen="timeline">` inside `.center-column`. Show one at a time via a single `data-active-screen` attribute on `.center-column`:

```css
.center-column main[data-screen] { display: none; }
.center-column[data-active-screen="feed"] main[data-screen="feed"] { display: flex; flex-direction: column; gap: 24px; }
.center-column[data-active-screen="threads"] main[data-screen="threads"] { display: block; }
.center-column[data-active-screen="timeline"] main[data-screen="timeline"] { display: block; }
```

Wire the left-nav buttons:
```js
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const screen = btn.dataset.screen; // add data-screen="feed|threads|timeline|review|weekly" to each nav-item
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelector(".center-column").dataset.activeScreen = screen;
  });
});
```

Add `data-screen="feed"` etc. to every existing `.nav-item` button. Default state: `data-active-screen="feed"`.

Add `data-screen-label="01 Feed"`, `"02 Threads"`, `"03 Timeline"` to each `<main>` for screen-label traceability.

---

## 3. Deliverable A — Composer (goal / project modal)

### Markup
Lift **lines 212–295** of the spec (`<div class="composer">...</div>` inside `<div class="mock">`) into a modal shell. Drop the `mock-head` — that's for the spec document, not production. Wrap in:

```html
<div class="modal-backdrop" id="composerBackdrop" hidden>
  <div class="modal-shell" role="dialog" aria-modal="true" aria-labelledby="composerTitle">
    <button class="modal-close" aria-label="Close">×</button>
    <div class="composer">
      <!-- lift the composer-type tabs, big-input, why, field-rows, composer-foot from spec -->
    </div>
  </div>
</div>
```

### Styles to copy from spec (verbatim, then swap indigo → terracotta)
- `.composer` (padding, bg)
- `.composer-type`, `.composer-type button`, `.composer-type button.on`
- `.composer .q`, `.composer .big-input`, `.composer .underline`, `.composer .why`
- `.composer .field-row`, `.field-label`, `.field-body`
- `.goal-pick`, `.goal-chip`, `.goal-chip.sel` (← swap `var(--accent-soft)` and `--accent-ink` — already our tokens)
- `.hue-pick`, `.hue`, `.hue.on`
- `.target`, `.target .cal` (keep the tiny calendar SVG-via-CSS trick)
- `.composer-foot`, `.cancel`, `.save`

### New styles needed (not in spec)
```css
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: color-mix(in oklab, var(--ink) 40%, transparent);
  backdrop-filter: blur(4px);
  display: grid; place-items: center;
  padding: 40px 20px;
  animation: fadeIn .18s var(--e);
}
.modal-backdrop[hidden] { display: none; }
.modal-shell {
  position: relative;
  width: 100%; max-width: 760px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  background: var(--card-strong);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-xl);
  box-shadow: 0 0 0 1px var(--rule), 0 32px 80px -20px rgba(20,16,10,0.25);
  animation: slideUp .22s var(--e);
}
.modal-close {
  position: absolute; top: 14px; right: 14px; z-index: 2;
  width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center;
  font-size: 20px; color: var(--ink-3);
  transition: background .12s var(--e);
}
.modal-close:hover { background: var(--paper-2); color: var(--ink); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
```

### Behavior
- **Open** from: `.side-create` in right rail (both `+ New life goal` and `+ New project`), and anywhere else you want.
- Pre-select the correct tab based on which button opened it:
  ```js
  openComposer(kind) {  // kind = "goal" | "project"
    backdrop.hidden = false;
    composer.querySelectorAll(".composer-type button").forEach(b => b.classList.remove("on"));
    composer.querySelector(`.composer-type button[data-kind="${kind}"]`).classList.add("on");
    composer.querySelector(".big-input").focus();
  }
  ```
- **Close**: click backdrop (not shell), click `.modal-close`, or press Escape.
- **Tab toggle**: clicking `.composer-type button` switches between `Life goal` / `Project`. When `Life goal` is active, **hide** the "Feeds into" field-row (a life goal doesn't feed another goal). When `Project` is active, show it. Also change the primary button copy: `Add project` ↔ `Add goal`.
- **Goal chips** (`.goal-pick`): single-select. The spec shows one chip with `.sel`. Clicking another chip moves the `.sel` class. The `.none` chip is the "standalone" opt-out.
- **Color chips** (`.hue`): single-select (`.on`). For the Project tab, also show the "inherits from goal →" hint (spec line 279).
- **Save**: on `⌘↵` or click `Add project`/`Add goal`, validate `.big-input` has text, then close modal. Don't wire actual persistence — this is a mock.
- **Type cycling**: `⇥` (tab key) cycles the `.composer-type` tabs when focus is on them.

### Copywriting replacements (use these exactly)
- Goal tab headline (above the big-input): `q` text = "The life goal is called"
- Project tab: `q` text = "The project is called"
- Goal placeholder: `Name it the way you'd say it aloud…`
- Project placeholder: `Name it the way you'd say it aloud…`
- `.why` for goal: *"What would it look like to have lived this well? A sentence. Optional."*
- `.why` for project: *"What does a good week on this project feel like? A line or two. Optional."*
- Goal `.field-label` rows: **Target**, **Color**. (No "Feeds into" for goals.)
- Project `.field-label` rows: **Feeds into**, **Target**, **Color**.

---

## 4. Deliverable B — Threads view ("The Spine")

Lift **lines 115–175 (CSS)** and **lines ~564–681 (HTML)** of the spec wholesale into a new `<main data-screen="threads">`.

### What to lift verbatim
- `.threads-head`, `.threads-title`, `.threads-title em`, `.threads-sub`, `.threads-legend`, `.threads-legend .d`, `.threads-legend .piv`
- `.threads-spines`
- `.spine`, `.spine.project`, `.spine .meta`, `.spine .meta .kind`, `.spine .meta .name`, `.spine .meta .stats`
- `.spine-line`, `.spine-line::before`, `.bead`, `.bead.sig`, `.bead.pivot`, `.today-mark`, `.today-mark::after`
- `.spine .preview` (the italic hover-preview quote block)
- `.thread-detail` and all its children (`.back`, `.crumbs`, `.crumbs .g`, `.stats-row`, `.stat`, `.wk-signals`, `.wk-signal`)

### What to change
- Swap any `oklch(0.45 0.14 270)` → `var(--accent)` (terracotta).
- Swap the pivot indigo → `var(--accent)` using a slightly darker tint. Define:
  ```css
  --pivot: #a44a2c;       /* darker terracotta */
  --pivot-soft: #f0d8cd;  /* lighter wash */
  ```
  Add to `:root` in the live file.
- **Remove** the `.mock` / `.mock-head` wrapper — that's spec chrome. The threads view should bleed edge-to-edge inside `.center-column`.
- **Widen the center column** when on Threads: the spec uses ~1080px for document width; threads need room. Do:
  ```css
  .center-column[data-active-screen="threads"],
  .center-column[data-active-screen="timeline"] {
    max-width: none;
  }
  ```
- Thread detail (`.thread-detail`) should start **hidden**. Clicking any `.spine .meta .name` or any `.bead` opens it populated with that thread's data. The `.back` link hides it again. Use a flat data structure:
  ```js
  const threads = [
    { id: "biz", kind: "goal", name: "Build a business that compounds", captures: 58, signals: 9, preview: "…", beads: [...] },
    { id: "launch", kind: "project", parent: "biz", name: "Throughline launch", ... },
    // ...
  ];
  ```
  Render the spines from this array. Hardcode the bead positions for now (copy from spec).

### Interactions
- **Hover a bead**: show a tiny tooltip with the capture excerpt. Use a single shared tooltip div positioned with JS on mousemove.
- **Click a bead**: opens `.thread-detail` scrolled to that capture. For now, just expand thread-detail — no scroll.
- **Click `.spine .meta .name`**: opens `.thread-detail` for that thread.
- **Hovering the spine**: show `.preview` block below with a sample recent capture. (Spec shows this statically — keep it static on the first spine as a demo, hide on others.)

---

## 5. Deliverable C — Timeline view ("The Year Line")

Lift **lines 212–356 (CSS)** and **lines ~748–900 (HTML)** of the spec into `<main data-screen="timeline">`.

### What to lift verbatim
- `.tl`, `.tl-head`, `.tl-head h3`, `.tl-head .range`, `.tl-head .range .nav`
- `.tl-years`, `.tl-years .yr`, `.tl-years .yr.on`
- `.tl-ribbons`, `.tl-ribbon`, `.tl-ribbon.goal`, `.tl-ribbon.project`, `.tl-ribbon .label`, `.tl-ribbon .band`
- `.year-line`, `.year-line::before`, `.year-axis`, `.year-axis .month`
- `.year-bars`, `.year-bars .wk`, `.year-bars .wk .blk`, `.year-bars .wk .blk.sig`, `.year-bars .wk.on`
- `.year-pivots`, `.year-pivot`, `.year-pivot::before`, `.year-pivot .lbl`
- `.year-left-label`
- `.tl-week-detail`, `.wk-head`, `.wk-title`, `.wk-stats`, `.wk-signals`, `.wk-signal`, `.wk-signal .when / .txt / .ctx`

### What to change
- Same accent swap. Any indigo or pivot-specific oklch → terracotta vars.
- Remove `.mock` wrapping.
- Generate the 52 `.wk` bars from a JS array instead of hand-written markup — the spec has them inline for the static doc, but dynamic is cleaner:
  ```js
  const weeks = [
    { total: 8, sig: 2 }, { total: 12, sig: 0 }, { total: 18, sig: 4 }, /* ... 52 entries ... */
  ];
  const barsEl = document.querySelector(".year-bars");
  weeks.forEach((w, i) => {
    const wk = document.createElement("div");
    wk.className = "wk" + (i === 11 ? " on" : "");
    wk.innerHTML = `<div class="blk" style="height: ${w.total}px"></div>${w.sig ? `<div class="blk sig" style="height: ${w.sig}px"></div>` : ""}`;
    wk.addEventListener("click", () => selectWeek(i));
    barsEl.appendChild(wk);
  });
  ```
- Future weeks (index > current week) should get `opacity: 0.15` on the `.blk` (already in spec — keep).

### Interactions
- **Year tabs** (`.yr`): switch active year. Re-render bars + pivots for that year. Hardcode a stub for years other than 2026 (empty array or "No data yet" message).
- **Click a `.wk` bar**: sets `.on` class, scrolls the `.tl-week-detail` to populate with that week's signals.
- **Year range nav `‹ ›`**: cycles years (same as tabs).

---

## 6. Deliverable D — Inline "+ new" tiles

The live app already has `.side-create` buttons (`+ New life goal`, `+ New project`). Restyle them to match the spec's `.inline-add`:

```css
.side-create {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; margin-top: 8px;
  border: 1px dashed var(--rule-strong);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink-3);
  font-family: var(--f-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 500;
  transition: all .15s var(--e);
  width: 100%;
  text-align: left;
}
.side-create:hover {
  border-color: var(--ink-3);
  color: var(--ink);
  background: var(--paper-2);
}
.side-create::before {
  content: "+";
  display: inline-grid; place-items: center;
  width: 18px; height: 18px;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 12px; line-height: 1;
  font-family: var(--f-body);
}
```
Remove the plain `+ New life goal` text prefix — the `::before` supplies the plus now. Button text becomes just `New life goal` / `New project`.

Wire clicks to `openComposer("goal")` and `openComposer("project")`.

---

## 7. Token additions — put these at the top of `:root` in `Throughline.html`

```css
--pivot:      #a44a2c;
--pivot-soft: #f0d8cd;
```

Nothing else should change in `:root` — all other spec styles already have live-app equivalents.

---

## 8. Sanity checklist before you call `done`

- [ ] Left nav buttons switch screens. `Feed` still renders the old feed unchanged.
- [ ] `+ New life goal` opens composer pre-set to `Life goal` tab (Feeds-into row hidden).
- [ ] `+ New project` opens composer pre-set to `Project` tab (Feeds-into row visible).
- [ ] Tab toggle inside composer shows/hides Feeds-into row live.
- [ ] Escape closes composer. Backdrop click closes composer. × closes composer.
- [ ] Threads view renders 5 spines (3 goals + 2 projects) with beads/signals/pivots. Clicking a bead or thread name opens thread-detail.
- [ ] Timeline view shows ribbons, 52-week bar chart, pivot ticks, month axis, and week-detail panel below.
- [ ] Year tabs switch years (even if other years are stub/empty).
- [ ] All accent colors are terracotta (`#c96442` family), not indigo.
- [ ] No console errors.
- [ ] The three-column shell still works at 1200/768 breakpoints. Threads + Timeline bleed wider; Feed stays at 720px.
- [ ] Fonts: `Fraunces` on display, `Instrument Serif` on italic accent phrases, `Inter` body, `JetBrains Mono` for overlines and timestamps.

## 9. What NOT to do

- Don't rewrite Feed. Don't touch the capture composer's Niyyah/Ḥāl pills — they're settled.
- Don't hand-draw icons when the spec has them as CSS (the tiny `.cal` calendar, the `.bead` circles, the `.piv` tick). CSS-only is intentional.
- Don't change the left sidebar, the right rail structure, or the profile row.
- Don't add new colors. The four named families — paper / ink / accent / star+pivot — are the whole palette.
- Don't add placeholder data beyond what the spec shows. If a week is empty, let it be empty.
- Don't split into multiple files. One HTML.
- Don't use inline styles except where the spec does (bead positions, bar heights, band left/right % — those are data, not style).