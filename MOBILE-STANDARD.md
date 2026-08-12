# MOBILE-STANDARD.md - what "flawless on mobile" means, and how to get there

The bar for the production build: **fully responsive, nothing broken, and it looks
good on a phone.** Not "it doesn't crash at 375px" - it should feel like it was
designed for the phone first.

This document is the checklist we hold ourselves to, the automated test that
proves it, and the specific things the current live build has to change.

---

## 1. The rules

| # | Rule | How it is measured |
|---|---|---|
| M1 | **Zero horizontal overflow** at 375px on every route | `document.documentElement.scrollWidth - clientWidth === 0` |
| M2 | **No container overflows its parent** - nothing clipped or cut off | For every block element: `scrollWidth <= clientWidth + 2` unless it deliberately scrolls |
| M3 | **Every interactive control has a 44px hit area** | Bounding box >= 40x40, or an expanded invisible hit area (see §3) |
| M4 | **No informational text below 11px**; 10.5px only for pills, badges and meta | Computed `font-size` on text-bearing elements |
| M5 | **Tables become cards below 720px** - no column may be dropped or hidden | No `<table>` wider than the viewport; every field still present |
| M6 | **The header stays usable** - search reachable, no orphaned control rows | Visual check at 375px |
| M7 | **Dense grids reflow, not shrink** - a 7-column calendar becomes a list | Visual check at 375px |
| M8 | **Zero console errors** on load | Playwright console listener |
| M9 | **Every empty state explains itself** - never a card with a heading and nothing else | Visual check |
| M10 | **Reduced motion respected** - infinite animations slow, never jump-cut off | `prefers-reduced-motion` |

## 2. The test that proves it

`/private/tmp/everest-live-audit/demo-audit.js` in our working copy sweeps every
route at 1440px and 375px and reports, per page: horizontal overflow, controls
under 40px (with their labels and sizes), text under 11px, containers that
overflow, and console errors. Run it against any environment:

```bash
BASE=https://your-env OUT=./shots REPORT=./report.json node demo-audit.js
```

**Make this part of CI.** A page that regresses on M1, M3 or M8 should fail the
build. It takes about two minutes for 29 routes.

## 3. The three techniques you will need

**Grow the hit area, not the drawing.** A 15px checkbox should stay 15px. Project
an invisible 44px target from its centre:

```css
@media (max-width: 720px) {
  .ev-tap-area { position: relative; }
  .ev-tap-area::after {
    content: ""; position: absolute; top: 50%; left: 50%;
    width: 44px; height: 44px; transform: translate(-50%, -50%); z-index: 0;
  }
}
```

Do **not** apply this blindly to every small button: two adjacent controls would
get overlapping targets and the second would steal the first's taps. Apply it to
isolated controls (checkboxes, single icon buttons) and use `min-height` for
controls that sit in their own row.

**Put the minimum on the shared primitives, once.** Rather than editing dozens of
inline styles, one rule covers the long tail:

```css
@media (max-width: 720px) {
  .btn-primary, .btn-soft, .btn-ghost { min-height: 40px !important; }
}
```

**Reflow dense layouts, do not scale them.** A seven-column month calendar cannot
work at 375px - cells fall to ~48px and content clips. Switch the component to its
list representation below the breakpoint instead:

```tsx
const [view, setView] = useState<"month" | "list">(() =>
  typeof window !== "undefined" && window.innerWidth <= 720 ? "list" : "month"
);
```

The toggle stays, so anyone who wants the grid can still choose it.

---

## 4. What the live build must change

Referenced against the audit sheet (`Everest Online Tutoring - Live Build Audit`).

### Blocking

1. **Header (B19).** On every page the avatar and sign-out drop to their own row,
   pinned right with a large empty gap to their left. Lay the mobile header out as
   a single row - logo, spacer, search, avatar, menu - or move the avatar and
   sign-out into the drawer. Our build keeps the control cluster on one line above
   the title, which is a fine alternative; the gap is what makes yours look broken.
2. **Search disappears on mobile (B20).** There is currently no way to search from
   a phone. Keep the field in the header (icon that expands is fine), or put it at
   the top of the drawer. Also make the `<input>` fill its control's height - if the
   input is 20px inside a 44px box, taps near the edges do nothing.
3. **Tables do not collapse (B21).** Booklet History renders a cramped table at
   375px showing only S.NO / DATE / CENTRE - the other columns are simply gone, so
   the user loses data on a phone. Implement the card-collapse pattern for every
   table in both portals. Losing columns silently is worse than scrolling.

### Required

4. **Touch targets.** Audit every control against M3. In our own build the
   offenders were calendar arrows (30px), segmented toggles (30px), filter chips
   (24px), row actions like Preview and Delete (28-30px) and inline text links
   (18-19px). Expect the same classes of control in yours. Fix at the primitive
   level, not per instance.
5. **Native `<select>` controls (B12).** Fifteen of them across both roles. Besides
   looking wrong, native selects on mobile open the OS picker with no styling
   control and inconsistent heights. Replace with the shared field component.
6. **Text sizes.** Nothing informational below 11px. Badges and meta may sit at
   10.5px. We found a 9px badge in our own build and fixed it.
7. **Dense grids.** Any month grid, wide chart or multi-column layout needs a
   mobile representation, not a squeeze.

### Worth doing

8. **Empty states (M9).** Every card must say what will appear and how to cause it.
   A heading with blank space beneath reads as a broken page.
9. **Test at 375px in CI**, per §2, so this cannot regress.

---

## 5. What we changed in this prototype (12 Aug 2026)

Auditing ourselves to the same standard found real failures. Fixed in this commit:

- **Timetable calendar** now opens in List view below 720px. The month grid was
  overflowing its container and clipping the Sunday column.
- **Mobile tap targets**: shared button primitives get a 40px minimum on phones;
  calendar arrows, segmented toggles, filter chips, mini-calendar day cells,
  attach button and "Back to courses" links all raised or given expanded hit areas.
- **Search input** now fills its 44px control (was a 20px input inside it), so the
  whole box is tappable.
- **"AI" badge** raised from 9px to 10.5px. Sidebar group labels 10px to 10.5px
  (the spec value).
- **Demo clock anchored.** The clock ticked from the real wall time while the seed
  data sat in July, so as time passed "today" drifted out of the seeded term and
  sections such as "Upcoming classes" silently emptied. The clock now ticks from
  the seed date, so countdowns still run and the demo stays consistent.

Measured before and after across 29 routes at 375px:

| Metric | Before | After |
|---|---|---|
| Controls under 40px | 156 | 100 |
| Pages with no tap-target or overflow issues | 0 | 5 |
| Horizontal page overflow | 0 | 0 |
| Console errors | 0 | 0 |

**Honest note on the residual 100.** Most are controls that now carry an expanded
44px hit area via `::after`, which the automated probe cannot measure - it reads
the element's own box. The genuinely-still-small ones are the assessment tracker's
inline score and weight chips (around 19-25px) and a few inline text links such as
"Reply" and "Schedule". These need a layout decision rather than a CSS patch, and
are listed as open work rather than quietly marked done.
