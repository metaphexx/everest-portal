# DESIGN-FIDELITY.md - The UI Contract

**This document is a contract, not a suggestion.** The production app must be
visually indistinguishable from this prototype. Fonts, colours, sizes, spacing,
radii, shadows, animation timing - all of it is final and signed off. Past handoffs
have drifted on exactly these details, so this file exists to make drift impossible
to justify.

> **The one rule:** if the prototype renders it one way, the production app renders
> it the same way. When in doubt, run this prototype next to your build and diff the
> screens. The prototype wins every disagreement.

If you are an AI coding assistant working in this repo or a derivative of it: treat
every value below as immutable. Never "modernise", "clean up", swap a font, adjust a
colour for a component library, or apply your own design taste. Flag conflicts to a
human instead of resolving them yourself.

---

## 1. Where the design system lives

Everything visual composes from **CSS custom properties defined in
`app/globals.css` `:root`**, plus a small set of global classes in the same file.
Components use inline styles referencing those tokens. That file is the design
system. Copy it verbatim into the production app.

**Forbidden:**
- Swapping tokens for a component library theme (MUI, Ant, Mantine, shadcn default
  themes, Bootstrap...). If you use a library, you restyle IT to these tokens.
- Re-expressing the design in Tailwind theme colours "close to" these values.
- Introducing any hex colour that is not in the token set (data-visual assignments
  in `lib/tutor-data.ts` / `lib/course-visuals.ts` are the only exception - copy
  those too).
- Changing any font family, weight, size, letter-spacing, radius, blur, shadow,
  easing curve or duration.
- Dark mode, unless explicitly commissioned later. There is none.

## 2. Typography (exact)

Loaded in `index.html` from Google Fonts:

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap
```

| Token | Value | Used for |
|---|---|---|
| `--font-display` | `"Montserrat", system-ui, sans-serif` (weights **700, 800**) | Page titles, section titles, stat numbers, card headings |
| `--font-body` | `"Inter", system-ui, sans-serif` (weights **400, 500, 600, 700**) | Everything else |

Reference sizes (do not round these):
- Page title `.portal-title`: Montserrat 800, `clamp(22px, 3vw, 25px)`, letter-spacing -0.5px
- Section title `.portal-section-title`: Montserrat, ~15px in cards
- Body copy: 12.5-13.5px Inter · metadata/captions: 11-11.5px · chips/pills: 10.5-11px, weight 700
- Stat numbers: Montserrat 800, 22px

Yes, the type scale is small and dense. That is the design. Do not bump sizes "for
readability" - contrast and hierarchy were audited (WCAG AA on informational text).

## 3. Colour tokens (exact, complete)

```css
/* Brand */
--brand-50:#EAF6FF; --brand-100:#D3ECFF; --brand-500:#009DFF;
--brand-600:#007ECC; --brand-700:#0067A8; --navy-500:#00203F;

/* Ink */
--fg1:#182030; --fg2:#4A5563; --fg2-alt:#37414F; --fg3:#66707F;
--fg4:#6E7887;              /* informational captions - 4.5:1 on white. NEVER lighten */
--fg5-decorative:#C7CDD6;   /* decoration only - never informational text */
--fg6-faint:#B6BEC9;        /* faintest meta - decorative only */

/* Surfaces */
--bg-page:#FFF8F2;          /* warm ivory - the page is NOT white */
--bg-surface:#FFFFFF;
--glass-bg:rgba(255,255,255,.6); --glass-bg-strong:rgba(255,255,255,.72);
--glass-border:rgba(255,255,255,.78);
--border-subtle:rgba(0,32,63,.08); --border-default:rgba(0,32,63,.12);
--hairline:rgba(0,32,63,.06);

/* Semantic - status ONLY, never decoration */
--success-500:#22A05B; --success-700:#1B8049;
--warn-500:#F5A623;  --warn-700:#B27908; --danger-500:#E04141;

/* Accents (card icons, category chips) */
--accent-blue:#009DFF; --accent-blue-light:#A5D8FF; --accent-violet:#7A5AF8;
--accent-violet-light:#C4B5FD; --accent-purple:#6B4EE6; --accent-navy-blue:#00558C;
--accent-teal:#0E9C8E; --accent-coral:#E04141; --accent-amber:#D68910;
```

Domain colour rules baked into the app (keep them):
- In-person delivery pill: teal `#0E8C86` on `rgba(18,181,165,.14)`.
- Booklet status: requested violet `#6B4EE6` · approved amber `#B27908` (BLUE on the
  History page to match the live print portal) · printed green `#1B8049` · rejected /
  print failed red `#E04141` · not requested grey `#66707F`.
- Booklet tracker series: requested `--accent-violet`, approved `--brand-500`,
  rejected `--danger-500`, printed `--success-500`.

## 4. Surfaces, radii, shadows, glass

- Cards: `.glass-card` - `rgba(255,255,255,.6)` + `backdrop-filter: blur(12px)
  saturate(1.15)` + 1px `--glass-border` + **border-radius 20px** + inset top
  highlight + `0 14px 32px -16px rgba(0,32,63,.24)` shadow.
- Controls (inputs, dropdown triggers): `.glass-control`, radius 10-12px, height
  38-44px.
- Buttons: radius 8-12px by size. Pills/chips: `border-radius: 980px`, padding
  ~`4-5px 10-13px`, font 10.5-11px weight 700, centred text.
- Buttons:
  - `.btn-primary`: `--brand-500` bg, white text, weight 600, glow shadow
    `0 10px 24px -10px rgba(0,157,255,.6)`; hover = brightness(1.07) + lift -1px;
    active = scale(.97).
  - `.btn-ghost`: white/translucent bg, subtle border; `.btn-soft`: brand-tinted bg.
- Course/class heroes: photo (`public/courses/*.jpg`) + per-course gradient overlay
  (`grad` in the data files) + white text; slow Ken Burns pan (`.ev-kenburns`).
- Z-index: only the six tokens (`--z-nav:40, --z-dropdown:60, --z-drawer:80,
  --z-fab:85, --z-modal:95, --z-toast:100`). The page header sits at
  `--z-dropdown` because it owns dropdowns. Never invent a z-index.

## 5. Layout and responsiveness

- Page grid: 12-column CSS grid, `gap: 16` (`.ev-page-grid`).
- Breakpoints: desktop > **1024px** > tablet > **720px** > phone (there is also a
  420px micro-tweak). At ≤1024 the sidebar becomes a drawer and header controls move
  above the title; at ≤720 dropdown menus become full-width sheets
  (`.ev-notif-drop`), multi-column grids collapse (`.ev-two-col`, `.ev-grid-3`).
- Every route must render with **zero horizontal overflow at 375px wide**. This was
  verified page by page; keep it true.

## 6. Motion

- Entry: `evrise` 0.5-0.55s `cubic-bezier(0.16,1,0.3,1)` with per-card stagger
  (~0.04-0.06s steps, `animation-fill-mode: backwards`).
- Micro: `.press` scale on tap; toggle/hover transitions 0.18-0.25s.
- Ambient (hero glow spin, pulses, Ken Burns): slow, subtle; under
  `prefers-reduced-motion` they SLOW to 6s+, they do not jump-cut off.
- Easing tokens: `--ease-out: cubic-bezier(0.16,1,0.3,1)`, `--ease-standard:
  cubic-bezier(0.4,0,0.2,1)`. No other curves.

## 7. Interaction patterns (all shared - never fork them)

| Pattern | Implementation |
|---|---|
| Modals | `components/ui/Modal.tsx` ONLY (role=dialog, aria-modal, focus trap, Escape, backdrop). Panel styling per-modal via props |
| Dropdowns/popovers | `lib/use-dismissable.ts` (outside click + Escape) |
| Document/video/link preview | `components/portal/PdfPreviewModal.tsx` - view-only, optional annotate toolbar, NEVER a download button |
| Toasts | Portal/Tutor provider `showToast` - bottom toast, auto-dismiss |
| Search inputs | Debounced 200ms; Enter navigates to the full results page |
| Focus | Global `:focus-visible` rings (brand). Never `outline: none` without a replacement |

## 8. Voice and copy

- Australian English (colour, centre, organise...).
- **No em dashes. Ever. Use hyphens.** This is a hard project rule.
- Sentence case for headings and buttons ("Request booklets", not "Request Booklets"
  - except proper nouns).
- Friendly, brief, concrete microcopy ("Nothing assigned yet. Search or browse above
  and hit Assign.").

## 9. How to prove fidelity (definition of done for any UI ticket)

1. Run this prototype (`npm run dev`) and the production build side by side.
2. Same viewport, same page, screenshot both. Overlay or eyeball at 100% zoom.
3. Check specifically: font family/weight/size, colours (use the eyedropper - the
   page background must be `#FFF8F2`, not white), border radii, paddings, pill
   shapes, shadows, hover/active states, animation feel, mobile at 375px.
4. Any visible difference = the ticket is not done.

A reviewer (or an AI assistant asked to review) should be able to open both and find
no differences. That is the bar.
