# design-sync notes - everest-portal

## What this repo is
An **application**, not a component library: no Storybook, no `dist/`, `private: true`
with no `exports`. The sync targets the subset of components that render without app
state - 18 exports across 15 files.

## Gotchas a future sync needs
- **Self-link required.** The converter resolves the package from
  `node_modules/<pkg>/package.json`, which an app repo never has. Fix:
  `ln -sfn ../ node_modules/everest-portal`. Recreate after any clean install.
- **Never let the entry be synthesised.** Globbing `src/` pulled in all 95 files
  including every app page, and `export *` across modules sharing a name (`Icon`,
  `ICON`) silently drops the ambiguous ones - ESM excludes duplicate star exports,
  so `window.EverestPortal` came up empty with no error. `.design-sync/ds-entry.ts`
  names the exports explicitly; always pass `--entry ./.design-sync/ds-entry.ts`.
  Bundle went 1577 KB -> 152 KB as a side effect.
- **Prop contracts are hand-written.** There are no shipped `.d.ts` files, so
  extraction yields `[key: string]: unknown` for every component - useless to the
  design agent. All 18 contracts live in `cfg.dtsPropsFor`. **When a component's
  props change in source, update `dtsPropsFor` too** - nothing checks this.
- **Keep `dtsPropsFor` free of unbound generics.** `MasterTable` is generic in
  source; the emitted `.d.ts` has no type parameter list, so `T` / `Column<T>`
  don't resolve. Its contract uses a concrete `Row` and an inlined column shape.
- **Fonts are self-hosted deliberately.** The app loads Inter + Montserrat from
  Google Fonts in `index.html`, so the stylesheet ships no `@font-face` and every
  design would fall back to system fonts. `.design-sync/fonts/` carries the latin
  woff2 (both families are SIL OFL). Google serves both as VARIABLE fonts - the
  per-weight URLs return byte-identical files - so one file per family covers the
  whole weight range.

## Components deliberately excluded
The other 22 components in `components/` read app state (`usePortal`, `useTutor`,
`useAdmin`, `useMessaging`, `useClassroom`) or router context. They throw outside
their providers. Syncing them would need a composed
`MemoryRouter + Portal/Tutor/Admin` provider via `cfg.provider`, and most are app
chrome (`PortalShell`, `AdminHeader`, `TutorSidebar`) of little use to an agent
building anything that isn't an Everest portal.

## Re-sync risks
- `dtsPropsFor` is a hand-maintained mirror of source props. It silently rots.
  Diff it against the component signatures on every re-sync.
- `.design-sync/ds-entry.ts` is a hand-maintained export list. A component added to
  `components/` will NOT appear until it is added there and to `componentSrcMap`.
- The self-link and the `--entry` flag are both required and neither is in
  `package.json`; a fresh clone that skips them fails in confusing ways.
- Fonts were fetched from Google Fonts at sync time. If the woff2 files go missing,
  re-fetch with a browser User-Agent (the default curl UA gets ttf, not woff2).

## Known render warns (triaged - a warn NOT on this list is new)
- `[GRID_OVERFLOW]` on MasterTable, MonthCalendar, LineChart, AssessmentTable,
  BookletStatsPanel, Loader: all genuinely wider than a multi-column grid cell.
  Resolved with `cfg.overrides.<Name> = {"cardMode": "column"}`. Expected.

## Preview coverage as of 20 Aug 2026
Authored + graded good (9): ElliotMark, Loader, Icon, OfficeVisibilityNotice,
MasterTable, MonthCalendar, LineChart, BookletStatsPanel, AssessmentTable.
Floor card (9): DayList, RequestDetail, ScheduleClassModal, Modal, ImageSlot,
Background, AverageChip, UpcomingAssessments, PdfPreviewModal. They import and
render fine - they just have no rich preview yet. Authoring them on a later
re-sync is incremental; grades and authored files carry forward.

Four of the nine are overlays (Modal, RequestDetail, ScheduleClassModal,
PdfPreviewModal) and will need `{"cardMode": "single", "viewport": "WxH"}` so the
open state renders inside the card instead of collapsing.

## Seed-data exports
`.design-sync/ds-entry.ts` also exports `seedRequests` and `allSessions` (camelCase,
so component discovery skips them). Previews compose from the repo's own data rather
than inlining copies that rot. If either is renamed in source, the previews break at
build time, not silently.
