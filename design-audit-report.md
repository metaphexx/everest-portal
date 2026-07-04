# Everest Portal - Frontend Design Audit

Date: 4 July 2026. Scope: Next.js 14 prototype, student portal (`app/(student)/`) and tutor portal (`app/tutor/`), inline-style + `app/globals.css` glassmorphism design language. Judged against modern frontend design principles (token discipline, accessibility, states, motion, spacing, semantics), not against any library migration.

## 1. Executive summary

- **Strong visual identity, consistently applied.** The frosted-glass register (glass-card, glass-control, aurora hero) is coherent across both portals, with a real token base in `globals.css` and a thoughtful responsive layer with good comments.
- **Good UX fundamentals in places.** Empty states, error states with `role="alert"`, disabled states when the AI cap is hit, debounced search, en-AU date formatting, and a genuinely considered `prefers-reduced-motion` note for Ken Burns.
- **Tokens exist but are bypassed.** 918 hex literals in TSX vs only 70 `var(--...)` usages. `#97A1AE` alone appears 256 times. Any palette change now requires a codebase-wide find-and-replace.
- **Keyboard and screen-reader access is the biggest gap.** 17+ clickable `<div>`s, a global `outline: none` on inputs, no focus-visible styling, and modals without `role="dialog"`, focus trapping or Escape handling.
- **Contrast failures on the workhorse muted colour.** `#97A1AE` on white is roughly 2.5:1 (AA needs 4.5:1), and it is used at 9 to 11px, compounding the problem. `#B0B8C4` disclaimers are worse (~2:1).
- **No type or spacing scale.** 24 distinct font sizes (8.5 to 24, including half-pixels) across 945 usages; padding/gap values of 7, 9, 11, 13 pepper the code with no 4px rhythm.
- **Motion is charming but only partially gated.** 36 infinite animations (pulse, breathe, drift, spin, blink) run regardless of `prefers-reduced-motion`; only `.ev-kenburns` is handled. 35 backdrop-filter surfaces per page is a real GPU cost.
- **Heavy duplication between portals.** `Notif`, `pageMeta`, search dropdowns, modal scaffolding, `Head`/`Cell` table primitives and `selStyle` are copy-pasted rather than shared.

## 2. Findings

### 2.1 Design tokens and consistency

**T1. Token system defined but not consumed (High).**
`globals.css:11-61` defines a complete palette (`--fg4: #97A1AE`, `--brand-500`, etc.), yet components hardcode the same values: `Header.tsx:91` (`color: "#97A1AE"`), `Sidebar.tsx:47` (`color: active ? "#007ECC" : "#66707F"`), `ClassroomStream.tsx:238` (`rgba(0,157,255,.12)`). 31 distinct hex colours in TSX, several (`#37414F`, `#B0B8C4`, `#C7CDD6`, `#8A5B08`) not in the token set at all.
Recommendation: sweep TSX to `var(--fg4)` etc., and promote the orphan colours into `:root` (e.g. `--fg-body-2`, `--fg-disabled`) or delete them.

**T2. No typographic scale (Med).**
24 distinct `fontSize` values including 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 16.5 (e.g. `ClassroomStream.tsx:286` at 8.5px, `ElliotFab.tsx:152` at 9.5px). Half-pixel sizes render inconsistently across DPRs and defeat any hierarchy audit.
Recommendation: collapse to a 6-7 step scale as tokens (`--text-xs: 11px` ... `--text-2xl: 24px`) with 11px as the floor.

**T3. No spacing scale (Med).**
Paddings like `"13px 15px"` (`ElliotFab.tsx:104`), `"9px 10px"` (`Header.tsx:282`), gaps of 7, 9, 11, 13, 14. Visually fine, but unmaintainable and drift-prone between portals.
Recommendation: 4px base scale (4/8/12/16/20/24) via spacing tokens; allow one-off exceptions only in the hero.

**T4. Ad hoc z-index values (Low).**
Fourteen distinct values (1, 2, 5, 40, 50, 60, 79, 80, 85, 88, 90, 95, 110, 120): FAB at 85 (`ElliotFab.tsx:86`), PDF modal at 95 (`PdfPreviewModal.tsx:129`), scrim at 79 (`globals.css:348`).
Recommendation: a five-layer token scale (`--z-nav`, `--z-dropdown`, `--z-fab`, `--z-modal`, `--z-toast`).

**T5. Fragile CSS coupled to inline-style strings (Low).**
`globals.css:429-432` targets `div[style*="repeat(7,1fr)"]`, which silently breaks if the inline string gains a space. The responsive layer also leans hard on `!important` (20+ uses).
Recommendation: give calendar grids a real class (`.ev-cal-grid`) like the other responsive hooks.

### 2.2 Accessibility

**A1. Global focus suppression on form fields (High).**
`globals.css:77-81` sets `input, textarea, select { outline: none; }`. Only `.field:focus` gets a replacement (a border-colour change at `globals.css:179`, ~1px, sub-perceptible), and bare inputs like the header search (`Header.tsx:104-116`) and chat composer (`chat/page.tsx:93`) get nothing at all. Keyboard users cannot see where they are.
Recommendation: delete the global reset; add `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }` for all interactive elements, plus a box-shadow ring on `.field:focus-visible`.

**A2. Clickable divs are invisible to keyboards and screen readers (High).**
17 `<div onClick>` instances: the profile/notification trigger (`Header.tsx:189-192`), search result rows (`Header.tsx:153-161`, mirrored in `TutorHeader.tsx:179-193`), calendar day cells (`app/(student)/page.tsx:276`), the course card open area (`app/(student)/page.tsx:435`), chat thread list items (`chat/page.tsx:40`). None are tab-reachable (zero `tabIndex` in the codebase) or announced as buttons.
Recommendation: convert to `<button>` (block-level, `width: 100%`, styles preserved); the profile trigger also needs `aria-expanded` and `aria-haspopup="menu"`.

**A3. Modals lack dialog semantics, focus trapping and Escape (High).**
`PdfPreviewModal.tsx:121-153` and `PrintDetailsModal` (`history/page.tsx:264-272`) are plain fixed divs: no `role="dialog"`, no `aria-modal`, no focus trap, no Escape-to-close (only `messaging/parts.tsx:162` handles Escape). Focus stays behind the overlay; screen readers keep reading the page underneath.
Recommendation: shared `<Modal>` wrapper with `role="dialog" aria-modal="true" aria-labelledby`, Escape handler, initial focus and a focus trap. Same wrapper fixes both portals' four modals at once.

**A4. Contrast failures on muted text (High).**
`#97A1AE` on white is ~2.5:1 and is the default for captions, metas and placeholders at 9 to 11.5px (e.g. `Header.tsx:91`, `history/page.tsx:207`). `#B0B8C4` (`ElliotFab.tsx:152`, 9.5px disclaimer) is ~2:1; `#C7CDD6` empty-state dashes (`history/page.tsx:212`) ~1.5:1.
Recommendation: darken `--fg4` to around `#6E7887` (4.5:1) for any text that conveys information; reserve the lighter greys for true decoration.

**A5. ARIA patterns started but incomplete (Med).**
The mode switcher (`TutorHeader.tsx:116-141`) and cart `RadioRow` (`cart/page.tsx:44-68`) use `role="radio"` but every radio is individually tabbable with no arrow-key movement (the pattern expects roving tabindex). `RequestTargetSelector.tsx:127` declares `role="listbox"` but children are plain buttons, not `role="option"`, and there is no keyboard navigation or Escape. The tutor search input (`TutorHeader.tsx:147-157`) is missing the `aria-label` its student twin has.
Recommendation: either finish the patterns (arrow keys + roving tabindex) or drop the roles and let them be plain buttons, which is honest and accessible.

**A6. Touch targets below 44px (Med).**
Mark-as-read is 22x22 (`Header.tsx:298`), calendar prev/next 28x28 (`page.tsx:261`), qty steppers 26x26 (`cart/page.tsx:178-180`), history eye 30x30 (`history/page.tsx:232`). On the phones this responsive layer explicitly supports, these are miss-prone.
Recommendation: keep visuals but grow the hit area to >= 40px via padding or a pseudo-element.

### 2.3 Interaction states and feedback

**S1. Dropdowns and popovers do not dismiss consistently (Med).**
`RequestTargetSelector.tsx:67-74` correctly closes on outside mousedown; the header notification and search dropdowns (`Header.tsx:219`, `TutorHeader.tsx:243`) close only on re-toggle or route change, and none close on Escape.
Recommendation: one `useDismissable(ref, onClose)` hook (outside-click + Escape) used by every popover.

**S2. Hover is the only signalled state for most controls (Med).**
`globals.css` defines rich `:hover`/`:active` helpers (`.list-hover`, `.press`, `.btn-*`) but no `:focus-visible` variants, and no loading/pending states exist on async-feeling actions ("Send request for approval", `cart/page.tsx:288`, navigates instantly).
Recommendation: pair each hover helper with an identical `:focus-visible` rule; add a brief pending state on primary submits so the prototype demos production behaviour.

**S3. Good practice worth keeping (positive).**
Inline validation with `role="alert"` (`cart/page.tsx:283`), disabled composer with explanatory placeholder when Elliot is capped (`chat/page.tsx:93`), empty states everywhere (`ClassroomStream.tsx:387`, `history/page.tsx:241`), and unread badges with `aria-label` (`Sidebar.tsx:57`).

### 2.4 Layout and responsiveness

**L1. Responsive layer is well designed (positive, Low residual risk).**
The class-based collapse system (`globals.css:316-432`) with `minmax(0,1fr)` notes, off-canvas drawer and scrim is genuinely good. Residual issues: `.ev-scroll-x > * { min-width: 600px }` (`globals.css:411`) forces 600px even for tables that would fit, and the chat split view hardcodes `height: calc(100vh - 210px)` (`chat/page.tsx:34`), which breaks if header height changes or the mobile URL bar collapses.
Recommendation: per-table min-widths; use `100dvh` and a flex column instead of the magic 210px.

**L2. Annotation canvas is mouse-only (Med).**
`PdfPreviewModal.tsx:280-287` binds `onMouseDown/Move/Up` only; zero `onPointer*`/`onTouch*` in the codebase. The flagship annotate feature is dead on tablets, the most likely device for a tutoring portal.
Recommendation: switch to pointer events (`onPointerDown` etc. with `setPointerCapture`), which covers mouse, touch and stylus in one path. The canvas also loses drawings on resize since it is sized once per open (`PdfPreviewModal.tsx:47-57`).

**L3. Heading hierarchy is mostly sound (Low).**
One `h1` per portal header, `h2` for card titles. But some section titles are styled divs (e.g. `history/page.tsx:274` "Print Details", `ElliotFab.tsx:107` "Elliot"), and the dashboard skips levels inside modals.
Recommendation: make modal titles `h2` and card sub-sections `h3`; costs nothing, helps rotor navigation.

### 2.5 Component architecture

**C1. Copy-paste divergence between portals (Med).**
`Notif` (`Header.tsx:277-305` vs `TutorHeader.tsx:301-329`), the search dropdown, notification panel, sign-out button and `pageMeta` are near-identical twins; `Head`/`Cell` table primitives exist in both `cart/page.tsx:305-311` and `history/page.tsx:371-377`; `selStyle` is duplicated (`cart/page.tsx:19`, `history/page.tsx:27`). The two headers have already drifted (student search has `aria-label`, tutor's does not).
Recommendation: extract `components/shared/` (Notif, SearchDropdown, PortalHeader shell, DataTable primitives, Modal). This is the highest-leverage refactor for the prototype's future.

**C2. Inline-style volume hides the design system (Med).**
Components carry 30+ property style objects per element (`Sidebar.tsx:85-101`, `ElliotFab.tsx:88-102`). The register is disciplined, but nothing enforces it; every new card re-derives shadows and radii by hand.
Recommendation: grow the "ready-made portal classes" layer in `globals.css` (badge, chip, dropdown-panel, avatar, table-head) so components compose classes and reserve inline styles for genuinely dynamic values (accents, conic progress).

**C3. Icon plumbing duplicated (Low).**
SVG path constants are re-declared per file (`DOC_ICON` in both `page.tsx:30` and `ClassroomStream.tsx:18`; search glass path inline in both headers).
Recommendation: centralise in the existing `nav-icons.tsx` / a single `icons.ts`.

### 2.6 Motion and performance

**M1. Reduced motion only covers Ken Burns (Med).**
`globals.css:263-268` thoughtfully slows `.ev-kenburns`, but the other 36 infinite animations (evpulse on the live dot `page.tsx:154`, evbreathe unread dot `Header.tsx:210`, evdrift hero blobs `page.tsx:149-150`, evspin conic glow `page.tsx:142`) run regardless.
Recommendation: a blanket rule in the same media query pausing decorative loops (`animation-play-state: paused` or duration bump) for `evpulse|evbreathe|evdrift|evspin|evblink`; keep entrance fades, which are brief and non-vestibular.

**M2. Backdrop-filter density (Med).**
35 `backdropFilter` usages in TSX plus the CSS classes; a dashboard renders 10+ simultaneous blur surfaces (sidebar 26px, cards 20px, controls 18px), several nested. This is the single biggest paint cost on mid-range hardware, and blur layers stack multiplicatively during the animated hero.
Recommendation: audit which surfaces actually sit over varying content (sidebar, header controls, modals: yes; cards over the static ivory page: no). Cards can fake the frost with a semi-opaque background at near-zero cost.

**M3. Entrance choreography is repeated as string literals (Low).**
`animation: "evrise .55s cubic-bezier(.16,1,.3,1) .16s backwards"` appears with hand-tuned delays throughout `page.tsx:121,181,206,257,314,343,367`.
Recommendation: `.animate-rise` exists (`globals.css:214`); add delay utility classes (`.d-1` ... `.d-6`) or a CSS var (`animation-delay: var(--rise-delay)`).

## 3. Top 10 recommendations (prioritised)

1. **Remove the global `outline: none` and add `:focus-visible` rings** across buttons, fields, nav links (A1, S2). Effort: S.
2. **Convert clickable divs to buttons** (profile trigger, search results, calendar cells, chat threads, course cards) (A2). Effort: M.
3. **Build one shared `<Modal>`** with dialog semantics, Escape, focus trap; adopt in all four modals (A3, C1). Effort: M.
4. **Darken `--fg4` and route all muted text through it** to pass 4.5:1; retire `#B0B8C4`/`#C7CDD6` for informational text (A4, T1). Effort: S.
5. **Sweep hex literals to CSS variables** and promote the orphan colours into `:root` (T1). Effort: M (mechanical, high payoff).
6. **Extract `components/shared/`** for Notif, search dropdown, header shell, table `Head`/`Cell`, `selStyle` (C1). Effort: L.
7. **Gate all decorative infinite animations behind `prefers-reduced-motion`** with one media-query block (M1). Effort: S.
8. **Move the annotation canvas to pointer events** and preserve strokes on resize (L2). Effort: M.
9. **Adopt type and spacing token scales** (6-7 font steps, 4px spacing rhythm) and normalise the half-pixel sizes (T2, T3). Effort: L.
10. **Reduce backdrop-filter surfaces** to overlays and chrome only; flatten static cards to semi-opaque fills (M2). Effort: S.

Also worth doing when convenient: z-index token scale (T4), `useDismissable` hook for popovers (S1), >= 40px touch targets (A6), finish or drop the radio/listbox ARIA patterns (A5).
