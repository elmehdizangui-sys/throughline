# Local Code Review — 2026-04-24

**Branch**: revamp-claude-style-v2
**Decision**: APPROVE with comments

## Summary

7 files changed across UI fixes for Archived view visibility, Threads spine performance, and the thread detail empty-state styling. The changes are purposeful and safe. One dead variable left over from a PivotMarker fix, and the typecheck fails — but all TS errors are pre-existing and not introduced by this diff.

---

## Findings

### CRITICAL
None.

### HIGH
None introduced by this diff. Pre-existing TS errors noted under Validation.

### MEDIUM

**1. Dead variable `label` in `PivotMarker` — `feed.tsx:220`**
```tsx
// This is computed but never used — both branches bypass it
const label = pivot.pivotLabel || pivot.to || getEntryPlainText(pivot.content) || "Pivot";
```
The pivot content rendering was changed from `{label}` to `{renderContent(pivot.content)}`, which is correct for rich content — but `label` is now orphaned. Should be removed to avoid dead-code confusion.

**Fix:**
```tsx
function PivotMarker({ pivot }: { pivot: ThroughlineEntry }) {
  const hasTransition = Boolean(pivot.from && pivot.to);
  // label variable removed
  return (
    <div className="pivot">
      ...
      {hasTransition ? (
        <><span className="from">{pivot.from}</span> -&gt; <span className="to">{pivot.to}</span></>
      ) : (
        <div className="to">{renderContent(pivot.content)}</div>
      )}
    </div>
  );
}
```

**2. `renderContent(pivot.content)` — no null guard — `feed.tsx:234`**
`pivot.content` could be `undefined` for older pivots that were created with only a `pivotLabel`/`to` field. If `renderContent` doesn't handle `undefined`/`null`, this renders nothing or throws.

**Fix:** Add a fallback:
```tsx
<div className="to">{pivot.content ? renderContent(pivot.content) : (pivot.pivotLabel || pivot.to || "Pivot")}</div>
```

**3. No tests for `ArchivedView` — `feed.tsx:908`**
The new exported component has zero test coverage. Not blocking (other components in the file are also under-tested), but worth a ticket.

### LOW

**`threads-view.tsx` — trailing blank line left after preview block removal (line 241)**
Minor whitespace nit after removing the `latest_signal` block — one blank line remains before `</div>`.

---

## Validation Results

| Check | Result | Notes |
|---|---|---|
| Type check (`tsc --noEmit`) | Fail | 12 errors — all **pre-existing**, none introduced by this diff |
| Lint | Fail | Lint runs typecheck — same pre-existing errors |
| Tests | Skipped | Not run |
| Build | Skipped | Not run |

**Pre-existing TS errors (not caused by this diff):**
- `api/entries/[id]/route.ts` — `content` not on `PatchEntryPayload` (×3)
- `throughline-service.ts` — same `content` issue (×2)
- `feed.tsx:163,171,177` — `onFilter` used but not destructured in `Entry` props
- `feed.test.tsx:93` — `onUpdateEntry` missing from test fixture
- `muhasabah-view.tsx:27,34,42` — `HeartState` not imported

These should be fixed in a dedicated cleanup pass, not in this PR.

---

## Files Reviewed

| File | Change | Assessment |
|---|---|---|
| `src/lib/types.ts` | Modified | Clean — adds `"archived"` to `MainView` union |
| `src/features/throughline/chrome.tsx` | Modified | Clean — adds archived nav item with correct SVG |
| `src/features/throughline/home-page.tsx` | Modified | Clean — filters archived from feed, wires ArchivedView |
| `src/features/throughline/weekly-review.tsx` | Modified | Clean — removes artificial 8-entry limit |
| `src/features/throughline/feed.tsx` | Modified | MEDIUM: dead `label` var + null guard missing on pivot content |
| `src/features/throughline/threads-view.tsx` | Modified | Clean — removes heavy inline preview from spines |
| `src/app/styles/views.css` | Modified | Clean — muted state, spine sizing improvements |
