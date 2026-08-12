# CODE-MAP.md - how this prototype is wired, and how to debug your build against it

**Who this is for:** the developers building the production Everest tutoring platform.
**What it is:** a map of how this repo actually works internally - the layers, the seams, the
behaviour contracts, and the traps that make a port *look* right while being subtly wrong.

It deliberately does **not** repeat:

| For | Read |
|---|---|
| What the product does, every student/tutor/admin interaction, the AI features, integration order | [`HANDOFF.md`](HANDOFF.md) |
| The visual contract - exact fonts, tokens, radii, shadows, motion + the fidelity protocol | [`DESIGN-FIDELITY.md`](DESIGN-FIDELITY.md) |
| Changes made after the original handover | [`CHANGELOG.md`](CHANGELOG.md) |
| Quick start | [`README.md`](README.md) |

---

## 1. What this repo is

A complete, interaction-perfect **front end** for the Everest platform: a student portal and a
tutor portal, running entirely in the browser against deterministic mock data. No backend, no
API keys, no network calls.

It serves two purposes at once:

1. **It is the specification.** Every screen, state, empty case and interaction is defined here.
   If a behaviour is ambiguous in your build, the answer is whatever this prototype does.
2. **It is now your stack.** It was originally Next.js 14; it was converted to **React 18 +
   TypeScript + Vite + React Router v6** so you can reuse the components directly rather than
   re-implementing them (which is where UI drift comes from).

78 TypeScript/TSX files. Pages still live under `app/**/page.tsx` (a naming convention kept from
the original, not a framework requirement).

## 2. The mental model - three layers, one seam

```
  app/**/page.tsx  +  components/**        <- presentation. Should barely change.
            |
            |  (this is the seam you replace)
            v
  lib/store.tsx · tutor-store.tsx          <- state providers, localStorage-backed
  lib/messaging.tsx · classroom.tsx
            |
            v
  lib/data.ts · tutor-data.ts              <- seed data + business logic + the
  lib/features.ts · search.ts                 deterministic "AI" stand-ins
  lib/elliot-agent.ts · booklet-stats.ts
```

**The entire job of productionising this is replacing the middle layer with real API calls.**
The pages consume providers through hooks (`usePortal()`, `useTutor()`, `useMessaging()`,
`useClassroom()`); if your provider returns the same shapes, every page works untouched.

If your build renders wrong, the bug is almost always in layer 2 or 3 - not in the components.

## 3. Run it side by side while you debug

```bash
npm install
npm run dev        # http://localhost:3000
```

- `/` - student portal (persona: Maya Kapoor, Year 11)
- `/tutor` - tutor portal (persona: Priya Rao). The header switches her working mode between
  **in person / online / both** - this changes the nav and the dashboard, so check the mode
  before reporting a "missing" section.

Open both in two tabs of the same browser: they share localStorage and sync live. Reset
everything with `localStorage.clear()` + reload.

**The demo "today" is Saturday 4 July 2026.** Dates, "due in 3 days" chips and the calendar are
all relative to that. If your build shows different relative labels, check the clock before
assuming a logic bug.

## 4. Code map

| Path | What it holds |
|---|---|
| `src/main.tsx`, `src/App.tsx` | Entry + the full route table (`[id]` → `:id`, route groups → layout routes) |
| `app/(student)/**` | 14 student pages |
| `app/tutor/**` | 15 tutor pages |
| `app/**/layout.tsx` | Mounts the providers + shell around an `<Outlet />` |
| `app/globals.css` | **All** design tokens in `:root` + the shared classes (`.glass-card`, `.btn-*`, `.field`, motion keyframes). Nothing visual is hardcoded elsewhere |
| `components/portal/**` | Student shell, sidebar, header, Elliot FAB, preview modal, toasts |
| `components/tutor/**` | Tutor shell, sidebar/header, booklet picker, stats panel, attendance |
| `components/ui/**` | Primitives: `Modal`, `Icon`, `LineChart`, `Link`, `ImageSlot` |
| `lib/router.tsx`, `components/ui/Link.tsx` | Thin shims giving pages a Next-style `useRouter/usePathname/useSearchParams/useParams` and an `href`-based `<Link>` over React Router. **Keep or unwind - your call**, but if you unwind them, do it in one pass |
| `lib/*.ts(x)` | State, data and logic - see below |

## 5. The four state providers = your API surface

Each is a React context persisted to one localStorage key. **This table is the porting brief.**

| Provider | Hook | LS key | Owns | Replace with |
|---|---|---|---|---|
| `lib/store.tsx` | `usePortal()` | `evr-portal` | Student state: worksheet completion, outlines + assessment marks, Elliot threads + daily budget, support requests, notifications, toasts | Student session + assessment, submission, support, AI endpoints |
| `lib/tutor-store.tsx` | `useTutor()` | `evr-tutor` | Tutor state: booklet cart + requests, working mode, attendance, digital-pack assignments, marking submissions, calendar cursor | Booklet pipeline, attendance, marking, assignment endpoints |
| `lib/messaging.tsx` | `useMessaging()` | `evr-messaging` | Threads, messages, delivery status, read receipts, attachments, moderation holds | Messaging service + moderation pipeline |
| `lib/classroom.tsx` | `useClassroom()` | `evr-classroom` | Class posts, replies, pins, attachments/links | Classroom feed endpoints |

Cross-portal "sync" is `lib/live-sync.ts`: each portal reads the other's blob and both listen for
the browser `storage` event. **That is the entire sync layer** - it is a demo device, not a
pattern to copy. In production this becomes real sessions plus (optionally) websockets.

### Version guards - a real trap

`lib/messaging.tsx` and `lib/classroom.tsx` persist a schema version (`DB_VERSION = 3`,
`CLASSROOM_DB_VERSION = 3`). On load, if the stored `v` does not match, **the stored data is
silently discarded and reseeded**. If you port this pattern and bump a shape without bumping the
version, you get corrupt state; if you bump the version, users lose data. In production, migrate
properly - do not carry this across.

## 6. Behaviour contracts - the deterministic stand-ins

None of these call a model. They are exact, readable definitions of the behaviour the real
service must reproduce. **Read the function, then match its output shape and UX - not its
implementation.**

| Function | File | Defines |
|---|---|---|
| `scanOutline(subject, term)` | `lib/features.ts` | Outline upload → extracted assessments + weekly topics. One scan per upload |
| `classifyMessage(text)` | `lib/features.ts` | Moderation: category (`poaching`/`abuse`/`safeguarding`/`principle`) + severity → hold/flag behaviour |
| `outlineAverage`, `scoreToPct` | `lib/features.ts` | How self-entered marks roll up to an average |
| `aiSearch(q, outlines, dueCount)` | `lib/search.ts` | Portal search: ranked hits **plus** a synthesised answer card |
| `elliotAgent(text, ctx)` | `lib/elliot-agent.ts` | Elliot's agentic plan: navigate / submit / raise support |
| `bookletSeries(requests, courseId?, mode)` | `lib/booklet-stats.ts` | Tracker maths. `mode` is `cumulative` or `weekly`; counts **individual printed copies** (sums `qty`), not requests |
| `bookletStatusFromRequest(req)` | `lib/tutor-data.ts` | The class booklet pill. **Derivation order matters:** printing completed/failed → approval rejected/approved → requested |
| `seed*()` in `lib/data.ts`, `lib/tutor-data.ts` | | The fixture data every screen renders against |

**Cost posture is part of the contract** (`lib/store.tsx`): search is debounced 200ms; Elliot is
capped at `ELLIOT_DAILY_BUDGET_AUD = 1.00`/day (~22 replies at $0.045), the cap is **invisible to
students**, and support requests bypass it. Keep the same signatures and UX when you wire real
models.

## 7. Deliberately not wired - do not chase these as bugs

There are **12** controls that call `notWired(label)` and intentionally show a toast instead of
acting. They are placeholders for things that need a backend:

- **Sign out** (both portals) · **Calling** (student support) · **Opening the live classroom**
- Student: file attachments + voice input in Elliot chat; grade exports; worksheet/file downloads
  from My Grades; download of the student's own submitted file in My Drive
- Tutor: uploading to My Drive; opening a submission file in Marking

Everything else is genuinely functional against the mock layer. `grep -rn "notWired(" app components`
gives you the current list at any time. **If a control does nothing in your build, check this list
before filing it.**

## 8. Load-bearing rules that fail silently

These look like details and are actually product requirements. A port that breaks them still
compiles, still looks right, and is still wrong.

**Privacy**
- Students never see class sizes, classmate lists, or AI usage/cost numbers.
- **In-person classes never display student counts** anywhere (online classes may).
- **Tutor-shared materials and recordings are preview-only - no download path, ever.** Note the
  distinction in My Drive: a student's *own submitted files* have a Download button; *files shared
  by the tutor* have Preview only. Do not collapse these into one list with one action.

**Booklet pipeline defaults** (`DEFAULT_FORMAT` in `lib/tutor-data.ts`)
- A4, double sided, B&W, portrait, 100%, top-left staple, and **2 pages per sheet** by default.
- Selecting a class autofills **and locks** centre / year level / subject. Only **Custom Request**
  leaves them free.
- The tracker counts **individual printed copies**, not requests.

**Copy**
- Australian English (colour, centre, organise).
- **No em dashes, anywhere.** Hyphens only. This is a hard rule and it is checked.
- Sentence case for headings and buttons ("Request booklets", not "Request Booklets").

## 9. Common porting traps

1. **Stale state after a shape change.** Symptom: blank sections or reset demo data. Cause: the
   `DB_VERSION` guard (§5). Fix: `localStorage.clear()` while developing.
2. **Working mode.** Symptom: tutor nav/dashboard "missing" sections. Cause: Priya's mode is
   in-person or online, not both. The switcher only appears when a tutor has both duties.
3. **Relative dates.** Everything is anchored to Sat 4 July 2026 (§3).
4. **Status pill wrong.** Almost always the derivation order in `bookletStatusFromRequest` - a
   live request record beats an override, which beats the seed.
5. **Tracker numbers "too high".** It sums copies (`qty`), not request rows.
6. **Fonts/colours drifted.** Everything visual comes from `app/globals.css` `:root`. If a value
   is hardcoded in a component in your build, that is the bug. Page background must be
   `#FFF8F2`, never white.
7. **Z-index fights.** Six tokens only (`--z-nav: 40` → `--z-toast: 100`). The header sits at
   `--z-dropdown` because it owns dropdowns - that was a real bug we fixed.
8. **Modals/popovers behaving inconsistently.** Use the shared primitives - `components/ui/Modal.tsx`,
   `lib/use-dismissable.ts`, `components/portal/PdfPreviewModal.tsx` - rather than forking variants.

## 10. Verifying your build against this one

```bash
npx tsc --noEmit    # clean here
npm run build       # green here
```

Then, per screen: run this prototype and your build at the same viewport and compare. The full
protocol is `DESIGN-FIDELITY.md` §9; the fast checks are page background `#FFF8F2`, Montserrat
(display) + Inter (body), flat `#009DFF` primary buttons that brighten on hover, 20px glass cards,
soft-blue active nav pill, and zero horizontal overflow at 375px.

Also true here and worth holding to: zero console errors on a fresh seed, keyboard-accessible
modals/menus, `prefers-reduced-motion` respected.

## 11. Questions

If something is ambiguous, the precedence is: **this prototype's behaviour** → `HANDOFF.md` →
`DESIGN-FIDELITY.md`. If those disagree, ask rather than picking one - and if a requirement seems
to conflict with the design, raise it rather than resolving it with a redesign.
