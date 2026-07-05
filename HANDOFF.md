# Everest Portal - Developer Handoff

This document is the single source of truth for taking this prototype to production.
Read it fully before writing code. It is written for both human developers and AI
coding assistants (Claude, Copilot, etc.) - if you are an AI assistant, treat every
rule in here and in [DESIGN-FIDELITY.md](DESIGN-FIDELITY.md) as a hard constraint.

**Two documents govern this codebase:**

| Document | Purpose |
|---|---|
| `HANDOFF.md` (this file) | What the app is, how it works, how to integrate it |
| [`DESIGN-FIDELITY.md`](DESIGN-FIDELITY.md) | The UI contract. The shipped app must look IDENTICAL to this prototype. Non-negotiable. |

There is also a [`CLAUDE.md`](CLAUDE.md) at the repo root that encodes the working
rules for AI assistants. Keep it in the repo.

---

## 1. What this app is

A complete, working front-end for the **Everest Tutoring** platform, covering two of
the three user roles end to end:

- **Student portal** - `app/(student)/` - what a student (persona: Maya Kapoor, Year 11)
  sees: dashboard, courses, timetable, assessment tracker, library, drive, worksheets,
  messaging, AI assistant, classroom, grades, support.
- **Tutor portal** - `app/tutor/` - what a tutor (persona: Priya Rao) sees: dashboard,
  courses, schedule, marking, student outlines, the full booklet request pipeline
  (catalogue, cart, requests, history), My Booklets (Drive assignment), classroom,
  messaging.
- **Admin/office** - not built as a UI. Admin behaviour exists as *data states* the
  other two portals react to (request approval/rejection, printing, Drive folder
  linking, support replies). Section 6 describes exactly what the admin side must do.

Everything runs on **mock, in-browser data** - there is no backend, no database, no
network call, and no API key anywhere. Every "AI" feature is a deterministic local
function that mimics the intended model behaviour (Section 7). This is intentional:
the prototype is the **specification**. Your job is to swap the data layer and the
AI stand-ins for real services *without changing what the user sees*.

## 2. Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build - must stay green
npx tsc --noEmit   # typecheck - must stay clean
```

Node 18.18+. No env vars. First load seeds all demo data into localStorage
automatically. To reset the demo state at any time: DevTools console →
`localStorage.clear()` → reload.

**Demo tips**
- Open `/` (student) and `/tutor` (tutor) in two tabs of the same browser: they share
  localStorage, so actions sync between portals live (storage events).
- The tutor header has a working-mode switcher (Both / In person / Online). It gates
  which nav sections and pages are available - the real system derives this from the
  tutor's assigned duties.
- The demo "today" is **Saturday 4 July 2026**; seed data is built around that date.

## 3. Tech stack and architecture

| Layer | Choice | Notes |
|---|---|---|
| Framework | Vite + React 18 + TypeScript, routed with React Router v6 | Plain client-side SPA. (Originally prototyped in Next.js App Router and converted; `app/` folder structure kept for familiarity but routes are declared in `src/App.tsx`) |
| Styling | CSS custom properties (design tokens) + inline styles + a small set of global utility classes in `app/globals.css` | Tailwind is installed but only used for its reset; the visual system is the token set. **Do not re-theme.** See DESIGN-FIDELITY.md |
| State | React context providers backed by localStorage | One provider per domain, listed below |
| Data | Seeded mock data in `lib/*.ts` | These files ARE the data model spec |
| Fonts | Montserrat (display) + Inter (body) via Google Fonts | Exact weights in DESIGN-FIDELITY.md |

### State providers (the heart of the app)

| Provider | File | localStorage key | Owns |
|---|---|---|---|
| `PortalProvider` | `lib/store.tsx` | `evr-portal` | Student state: outlines, worksheets, library, drive, Elliot budget/threads, notifications |
| `TutorProvider` | `lib/tutor-store.tsx` | `evr-tutor` | Tutor state: working mode, cart, booklet requests, material assignments, attendance, submissions/marking |
| `MessagingProvider` | `lib/messaging.tsx` | `evr-messaging` | All threads/messages/receipts for both portals + Everest Support channel |
| `ClassroomProvider` | `lib/classroom.tsx` | `evr-classroom` | Classroom posts, questions, replies, attachments for both portals |

Both layouts (`app/(student)/layout.tsx`, `app/tutor/layout.tsx`) mount the shared
providers, which is how the two portals stay in sync in the demo. In production each
provider becomes an API-backed data service; the provider *interfaces* (the values and
actions they expose) are the contract your endpoints must satisfy.

### Entry points and routing

- `index.html` → `src/main.tsx` (mounts `<BrowserRouter>` + imports `app/globals.css`)
  → `src/App.tsx` (the full route table).
- Pages still live under `app/**/page.tsx` and layouts under `app/**/layout.tsx`
  (each layout renders its providers/shell around a React Router `<Outlet />`).
- Two tiny shims let the page code stay framework-neutral:
  `lib/router.tsx` (a `useRouter()/usePathname()/useSearchParams()/useParams()/notFound()`
  facade over React Router) and `components/ui/Link.tsx` (`href` → `to`). If you drop
  these pages into an app that already uses React Router, you can delete the shims and
  point imports at the router directly.
- It is a **client-side SPA**: any static host must rewrite unknown paths to
  `index.html` (SPA history fallback) so deep links like `/tutor/booklets` resolve.
  Vite `dev` and `preview` already do this.

### Key lib files (read these first)

| File | What it is → what it becomes in production |
|---|---|
| `lib/data.ts` | Student courses, sessions, library items, icons, Elliot canned replies → student-facing read APIs |
| `lib/tutor-data.ts` | Tutor courses/classes, the booklet catalogue, Drive folders/files (with in-booklet `content` for search), print formats/printers, request seeds, outline roster logic → tutor-facing read APIs + reference data tables |
| `lib/features.ts` | `scanOutline` (outline → assessments + weekly topics), `classifyMessage` (moderation), outline types → real AI endpoints |
| `lib/search.ts` | `aiSearch` - ranked, intent-aware portal search → real search/embedding service |
| `lib/elliot-agent.ts` | Elliot's agentic action planner (open page, check due work, create support request) → real tool-using assistant |
| `lib/booklet-stats.ts` | Booklet tracker time series (weekly/cumulative, counted in printed COPIES) → analytics query |
| `lib/live-sync.ts` | Cross-tab storage sync helpers → websockets/polling in production |
| `lib/calendar.ts`, `lib/course-visuals.ts` | Calendar maths; course photo/gradient assignment |
| `lib/use-debounce.ts`, `lib/use-dismissable.ts` | Shared hooks (debounced search input; outside-click + Escape dismissal) |

## 4. The three roles and every interaction between them

### Student ↔ Tutor
| Interaction | Student side | Tutor side |
|---|---|---|
| School outline | Uploads outline on `/outline` (Assessment Tracker); AI scan extracts assessments + weekly topics; student self-records marks as results come in | `/tutor/outlines` shows every student grouped BY CLASS with status (Submitted / Scanning / Not submitted), expandable to the scanned schedule; the raw uploaded file is openable as a read-only pop-up preview (`PdfPreviewModal`, `annotate={false}`) from the source-file card in the detail, or straight from a Scanning row before extraction finishes; self-entered marks appear live there and on the course page ("Student marks & outlines") |
| Outline reminders | Students in Years 7-10 who have not uploaded see a reminder banner on `/outline`; system auto-reminds them | Tutor sees the outstanding Year 7-10 cohort, can "Send nudge" per student or "Nudge all outstanding" |
| Worksheets | Assigned worksheets appear with due dates; student submits from dashboard/drive | Submission lands in `/tutor/grade` marking queue; tutor marks + gives feedback |
| Grades | `/grades` shows marked work + feedback | Marking updates flow back instantly |
| Materials | Assigned booklets/notes/videos appear in `/library` - **preview only, never downloadable** (in-portal viewer, watch-only recordings) | Tutor assigns from `/tutor/booklets` (see below) |
| Messaging | `/messages` - direct thread per tutor; every message is AI-moderated before display | `/tutor/messages` - same threads from the other side; receipts (sent/delivered/read), typing indicator, media |
| Classroom | `/classroom/[id]` - stream, questions, resources; students post/reply with attachments and links (in-portal previews, Google Classroom style) | `/tutor/classroom/[id]` - tutor posts announcements/resources, answers questions |
| Notifications | Bell menu: mark-as-read per item or all; every notification deep-links to its page | Same pattern in the tutor header |

### Tutor ↔ Admin (the booklet print pipeline)
This is the core in-person workflow. States live on `BookletRequest`
(`approval: pending|approved|rejected`, `printing: not_started|in_progress|completed|failed`).

1. Tutor picks a class (or Custom Request) on `/tutor/materials` - choosing a class
   **autofills and locks** centre/year/subject filters to that class (Custom Request
   unlocks them).
2. Adds booklets to the cart with per-item copy counts (default = class size).
3. `/tutor/cart` - selects printer (required), adjusts print format. **Default format:
   A4, double sided, black and white, portrait, 100%, top-left staple, 2 per page.**
4. Sends request → status "Requested" (pending approval).
5. **Admin approves or rejects** (with a reason note on rejection) → tutor sees status
   change everywhere: dashboard hero pill, upcoming classes, pipeline, My Requests.
6. **Admin prints** → "Printed"; print failures surface with the admin's note.
7. `/tutor/history` - one row per booklet (never grouped), with print details modal and
   "Print again" re-order flow. "View preview" opens the booklet in the in-portal
   viewer (tutors never get raw Drive links).

The class status pill is **derived from the live request record**
(`bookletStatusFromRequest` in `lib/tutor-data.ts`) - approval/printing changes made by
the admin must flow through to it.

Booklet analytics: the **Booklet tracker** (dashboard = whole practice, each in-person
course page = that class) counts **individual printed copies** across
requested/approved/rejected/printed, with a Per week / Cumulative toggle.

### Tutor ↔ Admin (online materials)
- Admin links Google Drive folders to the tutor ("My Booklets" source). Files carry
  page counts, sizes, topics, and body-text excerpts (`content`) that power search.
- Tutor assigns files to a whole class or an individual student, typed as
  Booklet / Worksheet / Study notes. **Any class the tutor teaches is a valid target**
  (a Year 8 booklet can go to a Year 11 student).
- Digital packs for online classes deliver instantly (no approval - approval only
  exists where money is spent on printing).

### Student/Tutor ↔ Admin (support)
- Student `/support` + the Elliot FAB can raise support requests (tracked, with replies).
- The "Everest Support" messaging channel is the admin's direct line in `/messages`.

### Privacy rules (must survive the rebuild)
- Students NEVER see class sizes or classmate lists. The tutor does.
- In-person classes show no student counts anywhere in the tutor UI either (drop-in
  model; no fixed roster display).
- Students never see AI usage numbers (allowance, message counts, dollar amounts).
- Materials and recordings are never downloadable by students - view in portal only.

## 5. Route map

Student (`app/(student)/`): `/` dashboard · `/courses` + `/courses/[id]` (ids: `chem`,
`verbal`, `gate`) · `/timetable` · `/outline` (Assessment Tracker) · `/library` ·
`/drive` · `/grades` · `/messages` · `/chat` (Elliot) · `/classroom/[id]` · `/support` ·
`/settings` · `/search`.

Tutor (`app/tutor/`): `/tutor` dashboard · `/tutor/courses` + `/tutor/courses/[id]`
(ids: `chem11`, `block8`, `sci9`, `found10`) · `/tutor/schedule` · `/tutor/grade` ·
`/tutor/outlines` · `/tutor/materials` · `/tutor/cart` · `/tutor/requests` ·
`/tutor/history` · `/tutor/booklets` · `/tutor/drive` · `/tutor/classroom/[id]` ·
`/tutor/messages` · `/tutor/search`.

Pages gate themselves by working mode (e.g. `/tutor/cart` is in-person only,
`/tutor/booklets` online only) and render a friendly fallback card when out of mode.

## 6. What the admin system must implement

The prototype encodes admin behaviour as seed states. The real admin portal/office
system needs, at minimum:

1. **Print queue**: list pending `BookletRequest`s; approve / reject (+ reason);
   mark printing complete / failed (+ note). Status changes push to tutors.
2. **Drive linking**: attach Drive folders/files to tutors, with metadata (pages, size,
   topics) and extracted text for content search.
3. **Catalogue management**: the study-materials catalogue (centre / year / subject /
   topic taxonomy) that tutors request from.
4. **Support desk**: receive support requests (from the form and from Elliot), reply;
   replies appear in the student's tracked request and the Support message channel.
5. **Roster/class management**: courses, sessions, delivery mode (in person / online),
   centres, printers-per-centre (`centreOfPrinter`), tutor duty assignment (drives the
   working-mode gate).
6. **Moderation review**: messages flagged by the classifier (see below) go to a review
   queue; the prototype blocks/flags locally.

## 7. AI features - what is fake now, what to build

Every AI feature is a deterministic local function with the exact UX the production
model must reproduce. **Cost posture is already designed in - keep it.**

| Feature | Stand-in (file) | Production replacement | UX contract |
|---|---|---|---|
| Portal search (student + tutor headers, `/search` pages) | `aiSearch` in `lib/search.ts`; `searchDrive` in `lib/tutor-data.ts` | Embedding/keyword hybrid search over pages, files, people, and **booklet body text** | Debounced 200ms (`use-debounce.ts`) so you pay per pause, not per keystroke. Results explain WHY they matched ("found in the booklet: ..."). Enter opens full results page |
| Elliot chat + FAB | `elliotReply` (`lib/data.ts`), `fabAgent`/planner (`lib/elliot-agent.ts`, `lib/store.tsx`) | LLM assistant with tools: open page, check due work, summarise, create support request | Daily budget `ELLIOT_DAILY_BUDGET_AUD = 1.0` per student. Budget is INVISIBLE to students - when spent, Elliot just says try again later. Support-request actions BYPASS the cap and cost nothing. Proactive nudge bubble appears once, ~7s after load, dismissible |
| Message moderation | `classifyMessage` (`lib/features.ts`) | Cheap classifier pass on every student↔tutor message | Blocks unsafe content with an explanatory notice; flags borderline for review; never silently drops |
| Outline scanning | `scanOutline` (`lib/features.ts`) | Document extraction (PDF → assessment schedule + week-by-week topics) | Runs ONCE per upload. Produces: assessments (name, type, week, due, weight) + weekly topics. Failure state = "Scan failed" chip with re-try |
| Booklet content search | `DRIVE_CONTENT` map + content matching in `searchDrive` | Index extracted booklet text at upload time | Search reads file names, topics AND inside the document; shows a snippet as evidence |

**Cost levers that must survive:** debounce on search; per-student daily budget with
silent cap; one-shot document scans; classifier (not generator) for moderation;
support path always free. Wire real models behind the same function signatures and
the UI will not change.

## 8. Integrating into your existing system

Recommended order:

1. **Bring the code across as-is** and get `npm run build` green in your monorepo.
   Keep the route structure and the `(student)`/`tutor` split.
2. **Auth**: wrap the two layouts in your auth. Map your roles to portal access +
   tutor working mode. The prototype has no auth by design.
3. **Replace providers one domain at a time.** Each provider's exposed value object is
   the API contract. Start with read-only data (courses, catalogue), then the write
   flows (cart → request → approval), then messaging/classroom (needs realtime), then
   AI features.
4. **Keep the seed data as fixtures** for tests and Storybook-style review - it
   encodes every state the UI must handle (pending/approved/rejected/failed, scanning/
   done/missing outlines, read/unread, etc.).
5. **Do not rebuild the UI.** Reuse the components. If your stack forces a rewrite
   (e.g. different framework), DESIGN-FIDELITY.md is the specification and the
   prototype is the reference implementation to diff against, pixel by pixel.

### Suggested data model (from the mock types)
The TypeScript interfaces in `lib/*.ts` are the schema. The main entities:
`Course`/`TutorCourseDef`, `TutorClass` (a dated session), `BookletRequest` +
`RequestItem` + `PrintFormat`, `CatalogueItem`, `DriveFolder`/`DriveFile`,
`MaterialAssignment`, `Outline` + `Assessment` + `WeekTopic`, `SharedOutline`,
`Submission`, `Thread`/`Message`, classroom `Post`/`Reply`, `NotifItem`,
support `Request`. Copy the field names - the UI reads them.

## 9. Quality bars already met (do not regress)

- `npx tsc --noEmit` clean and `npm run build` (tsc + `vite build`) green at handoff.
- Zero browser console errors on a fresh seed.
- Every page is responsive: desktop, tablet (≤1024px), phone (≤720px, 375px tested,
  0px horizontal overflow on every route).
- Accessibility: visible `:focus-visible` rings everywhere; all modals use the shared
  `components/ui/Modal.tsx` (role=dialog, aria-modal, focus trap, Escape); real
  `<button>`s (no clickable divs); roving tabindex on radio groups; ~40px touch
  targets; `prefers-reduced-motion` slows all ambient animation; informational text
  meets 4.5:1 contrast (`--fg4` = #6E7887).
- Z-index discipline: six tokens only (`--z-nav` 40, `--z-dropdown` 60, `--z-drawer`
  80, `--z-fab` 85, `--z-modal` 95, `--z-toast` 100). Never hardcode a z-index.
- Language: Australian English. **No em dashes anywhere - use hyphens.**

## 10. Known intentional limitations

- No auth, no backend, no persistence beyond localStorage (by design - see Section 1).
- Admin portal is not built (Section 6 is its spec).
- PDF/video previews render a mock page/player - production wires a real viewer into
  `components/portal/PdfPreviewModal.tsx` (keep its chrome, toolbar rules, and the
  no-download stance exactly).
- The booklet tracker mixes a deterministic term baseline with live request data so
  the chart reads like a real term; production replaces the baseline with real
  historical aggregates (`lib/booklet-stats.ts` documents the maths).
- `docs/`, `design-audit-report.md` are working artefacts of the design process -
  useful context, not runtime code.
