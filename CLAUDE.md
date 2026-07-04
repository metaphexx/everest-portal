# CLAUDE.md - working rules for AI assistants in this repo

You are working on the Everest Tutoring portal. Read `HANDOFF.md` (what this app is
and how it works) and `DESIGN-FIDELITY.md` (the UI contract) before changing
anything. This file is the short version of the rules; those two documents win on
detail.

## Hard rules (never break these)

1. **UI fidelity is non-negotiable.** The shipped UI must be pixel-identical to this
   prototype. Never change fonts (Montserrat display / Inter body), token colours,
   sizes, radii, spacing, shadows, or motion. Never introduce a component library
   theme or "refresh" the design. If a requirement seems to conflict with the design,
   stop and ask a human - do not resolve it with your own taste.
   All visual values come from `app/globals.css` `:root` tokens. Never hardcode a
   new hex colour or z-index (six z tokens only).
2. **Australian English. No em dashes - use hyphens.** Applies to UI copy, comments,
   and docs.
3. **Privacy rules:** students never see class sizes, classmate lists, or AI usage
   numbers. In-person classes never display student counts. Materials/recordings are
   preview-only for students - never add a download path.
4. **AI cost posture:** search stays debounced (200ms); Elliot stays budget-capped
   (AUD 1.00/day, invisible to students, support requests bypass the cap); document
   scans run once per upload; moderation is a classifier pass. Keep these when wiring
   real models - same function signatures, same UX.
5. **Shared primitives only:** modals via `components/ui/Modal.tsx`; dismissal via
   `lib/use-dismissable.ts`; previews via `components/portal/PdfPreviewModal.tsx`;
   toasts via provider `showToast`. Do not fork new variants.

## Verify before you claim done

```bash
npx tsc --noEmit     # must be clean
npm run build        # tsc + vite build, must compile
npm run dev          # vite dev server on http://localhost:3000
```

Then check the change in a real browser (both portals share localStorage - open `/`
and `/tutor` in two tabs to see cross-portal sync). Check the console is clean and
the page still has zero horizontal overflow at 375px. If you changed anything
visual, do the side-by-side comparison in DESIGN-FIDELITY.md section 9.

## Orientation

- Vite + React 18 + TypeScript SPA, routed with React Router v6. Entry:
  `index.html` → `src/main.tsx` (`<BrowserRouter>`) → `src/App.tsx` (route table).
  Pages live under `app/**/page.tsx`; layouts under `app/**/layout.tsx` render
  providers + shell around an `<Outlet />`.
- `lib/router.tsx` + `components/ui/Link.tsx` are thin shims giving the page code a
  Next-style `useRouter/usePathname/useSearchParams/useParams/notFound` and an
  `href`-based `<Link>` on top of React Router. Keep imports pointing at them.
- `app/(student)/` student portal, `app/tutor/` tutor portal.
- State: `lib/store.tsx` (student), `lib/tutor-store.tsx` (tutor),
  `lib/messaging.tsx`, `lib/classroom.tsx` - localStorage-backed providers
  (`evr-portal`, `evr-tutor`, `evr-messaging`, `evr-classroom`).
  `localStorage.clear()` + reload resets the demo.
- Data/spec: `lib/data.ts` (student), `lib/tutor-data.ts` (tutor + catalogue + Drive
  + booklet pipeline), `lib/features.ts` (outline scan, moderation), `lib/search.ts`
  (aiSearch), `lib/elliot-agent.ts` (Elliot actions), `lib/booklet-stats.ts`
  (tracker maths).
- Demo "today" is Sat 4 July 2026. Personas: Maya Kapoor (student), Priya Rao
  (tutor). Course ids: student `chem|verbal|gate`, tutor
  `chem11|block8|sci9|found10`.
- Business defaults: print format A4, double sided, B&W, portrait, 100%, top-left
  staple, **2 pages per sheet**; booklet tracker counts individual printed copies.
