# Changelog

Updates made to the prototype after the initial handoff. Each entry is part of the
specification: the production build must include it. See `HANDOFF.md` for the full
system description and `DESIGN-FIDELITY.md` for the UI contract.

## 2026-08-15 - Marking, assigning, tutor Elliot, and the phone header

Everything below is spec. Grouped by area rather than by commit; `git log` carries
the reasoning for each individual change.

### Marking work and returning it (new)

- A tutor opens a submission, annotates it, and sends the marked copy back with
  written feedback. A tutor who prefers their own tools can download the file,
  mark it up elsewhere, and re-upload it as the returned copy. The student sees
  **View marked copy** and **Download** on that submission in My Grades.
- **Grades are A, B, C, D or "Needs review". There are no plus or minus grades.**
  Do not add them, and do not accept a numeric mark in this field.
- `markSubmission(id, grade, feedback, returned?)` in `lib/tutor-store.tsx`.
  `submissions` is part of the persisted `evr-tutor` payload - it has to be, or the
  student portal never sees the marked copy.
- Downloads are real client-side files (`lib/download.ts`, a hand-assembled minimal
  PDF plus a Blob and `<a download>`), and they work on a phone. The function
  returns `false` when the browser blocks it so the caller can say so.

### Assigning and requesting: online and in-person are not the same

- **Requesting materials for printing is in-person only.** An online class has
  nothing to print.
- **Assigning digital materials is online only.** In-person students have no login
  yet, so assigning to them would silently go nowhere.
- **Assigning to a whole class reaches the whole class.** `assignedToMe()` now
  scopes a class-target assignment to the courses the student is actually enrolled
  in; before, any class target matched every student.
- The booklet picker takes multiple students, each individually unselectable, and
  previews a booklet while you search: the first four pages, with the true total
  page count shown. The four-page limit is a product decision, not a technical one.

### The office can see tutor files, and tutors are told so

Every file a tutor uploads, assigns or shares is visible to the Everest office,
along with who sent it and when. `components/tutor/OfficeVisibilityNotice.tsx`
states this on My Drive, in the classroom composer and in the message thread.
Keep the notice; the point is that it is visible, not buried in a policy page.

### Elliot for tutors

- Suggestions (`lib/tutor-elliot.ts`) are derived on the device from student
  outlines, recorded scores and the Drive index - free, unlimited, and always
  traceable to the assessment or score that raised them. Three at a time, then
  "Show N more". A one-tap **Yes, assign it** does the assignment.
- Alerts fire below a weighted average of `LOW_SCORE_PCT` (60%).
- Free-text questions are model calls, so they are rationed:
  `TUTOR_ELLIOT_DAILY_ASKS = 22`, same AUD 1.00/day posture as the student's
  Elliot. **The tutor is shown the remaining allowance; the student never is.** A
  tutor is staff, and a silent ceiling reads as a broken app.
- `/tutor/elliot` is the full chat surface with its own sidebar item. The floating
  button stays a glance at suggestions and hides itself on that page.

### Tutor settings, messaging, search

- `/tutor/settings`: profile photo, email, mobile, password, notification
  preferences. Name and role are read-only with an explanation of who sets them -
  a greyed field with no explanation just looks broken. Safeguarding alerts cannot
  be switched off.
- The role string is **"Everest Tutor"**, defined once in `lib/tutor-data.ts`.
- A tutor can start a conversation with any student, filtered by class.
- Search was a hardcoded eleven-item substring filter. `lib/search-core.ts` and
  `lib/tutor-search.ts` build a live index each call - every nav destination, class,
  classroom, student, Drive file, catalogue booklet, live request and submission -
  with synonym expansion and weighted ranking. A Drive file and its print-catalogue
  twin are labelled by what they do ("Assign digitally" / "Order for printing")
  rather than de-duped, because they are different actions.

### Shell, chrome and brand

- **The phone header** carries the account avatar top left beside the logo and the
  hamburger top right. Search, profile and sign out live in the drawer and the
  avatar menu; an unread badge has to be visible without opening anything, which is
  why the avatar is in the bar and not the drawer.
- `components/ui/Modal.tsx` portals to `document.body`. Inside `.ev-main` it was
  trapped in that stacking context and the mobile bar painted over it.
- `components/ui/Loader.tsx` is the brand loading mark; it replaces the ring
  spinners. Reduced motion stops it outright - a crawling self-drawing mark reads
  as a hung page.
- `components/ui/ElliotMark.tsx` is the AI mark, SVG so it is crisp from 20px to
  92px. It reuses the loader's peak path, so the brand shape is defined once.
  `tone="solid"` on coloured grounds; the gradient tone is for light surfaces.
  Gradient ids are per instance or several marks share the first one's stops.
- The student account chip no longer carries a completion ring or a "% complete"
  line. A running progress score in the chrome of every page is pressure, not
  information; the figure stays on My Grades where it is asked for.

### Two phone-only defects worth knowing about

- A `<button>` centres its label by default, but `display: inline-flex` does not
  inherit that. `.ev-tap-h` sets inline-flex at 720px and below, so every full-width button
  carrying it dropped its label to the left edge on phones only. It now sets
  `justify-content: center`.
- Seed data had wrong avatar initials (Priya Rao as "DR", Grace Lin as "ML", David
  Chen as "MC"). Fixed in `lib/messaging.tsx`. Worth deriving initials from the
  name in production rather than storing them.

Verified across 31 routes at 390px: zero horizontal page overflow, zero console
errors.

## 2026-08-13 - Mobile pass: the app is now built to work on a phone

The prototype was desktop-correct and phone-broken. An automated overflow probe
had been reporting zero problems, which was misleading twice over: the app scrolls
inside `.ev-main` rather than the document, so full-page screenshots only ever
captured the first 812px of pages up to 4000px tall; and `overflow-y: auto`
computes `overflow-x` to `auto`, so a container rendering 593px wide inside a
375px viewport still reported zero page overflow. Reviewing whole pages at 375px
found around 60 real defects across the 29 routes. **Every rule and fix below is
part of the spec - the production build must hold the same line.**

### The root cause behind most of it

The desktop list row `[icon] [flexible text] [pill] [pill] [button]`. The text is
the only `flex: 1` child, so at 375px it absorbs the whole shortfall: names
truncated to "Lucas...", metadata rendered one word per line down a 55px column,
status chips printed on top of titles, and trailing buttons sliced off at the card
edge. Wrapping the row alone does not fix it - a `flex: 1 1 0%` child has a zero
base size, so it stays on line one and stays crushed. The text needs a flex-basis
wide enough to claim the line. New utility in `app/globals.css`:

```css
@media (max-width: 720px) {
  .ev-wrap-row { flex-wrap: wrap; row-gap: 8px; }
  .ev-wrap-row > .ev-wrap-main    { flex: 1 1 calc(100% - 56px); min-width: 0; }
  .ev-wrap-row > .ev-wrap-lead-lg { flex-basis: calc(100% - 96px); }
  .ev-wrap-row > .ev-wrap-cta     { flex: 1 1 100%; width: 100%; }
}
```

`56px` is a leading icon plus its gap; `ev-wrap-lead-lg` is for rows led by a wide
date chip. Applied to the rows on the tutor dashboard, tutor schedule, course
pages, student outlines, my booklets, and the student dashboard.

### Native controls

- **All 24 `<select>` elements** are now styled by element type in `globals.css`:
  `appearance: none`, the app's radius and border, and our own chevron as an inline
  SVG background. Note the trap - most carried an inline `background:` or
  `padding:` shorthand, which wipes a background-image, so the chevron
  declarations need `!important`. `min-height: 40px` on phones.
- **Textarea resize grabbers** removed below 720px (`resize: none`) - you cannot
  drag them on a phone and they read as an unfinished control.
- **Checkboxes** raised to 18px on phones, on top of the existing invisible 44px
  hit area.
- **Focus rings.** Search fields nest a borderless `<input>` inside a rounded
  frosted pill, so the input's own ring drew a hard square rectangle inside the
  rounded shape. The ring now lives on the pill via `:focus-within`.

### Tables

No table may silently lose a column below 720px. Two accepted patterns, both used:

- **Collapse to cards** where the hidden column is the point of the page. Student
  **My Grades** does this - the grade sat off the right edge of a 640px table.
- **Scroll sideways and say so.** Booklet History, My Requests and the assessment
  tracker keep the wide grid and carry a visible swipe hint. A clipped table with
  no cue reads as dropped columns, not as scrollable.

Row rules were being drawn per *cell* with cells vertically centred, so each row
showed three disconnected segments at three different heights - a rendering fault
to the eye. Fixed with `align-items: stretch` on the grid.

### Dense layouts

- **Timetable** and **tutor Schedule** open on their list view below 720px. A
  7-column month grid gives each day ~44px, which truncated every class chip to
  "Y..".
- **Line chart x-axis labels** thin out until each has ~44px, instead of eight
  dates smearing into each other across 287px of plot.
- **4-up counter strips** (booklet tracker, outline overview) go 2-up; a lone odd
  card stays half width rather than becoming another near-empty full-width band.
- **Attendance P/L/A/E toggles** grow to 34px and drop to one column - four 24px
  targets 3px apart cannot use the invisible-hit-area trick without overlapping.
- **Course hero** raised to 300px on phones. Its content is absolutely positioned,
  so the box could not grow when the meta pills wrapped, and the last pill was
  sliced in half by the hero's bottom edge.
- **Nested scrollers with a fixed max-height** are uncapped on phones. My Booklets
  said "7 of 7" and showed 4.

### Copy written for a desktop layout

- "Pick a class on the left" and "Send one from the left" - there is no left
  column on a phone.
- "Enter to send · Shift+Enter for a new line · drag files anywhere in the thread"
  is desktop guidance; phones get "Tap the clip to attach a file."
- Placeholders longer than their own input clipped mid-word ("Ask Elliot about
  your hom", "Search requests by refer"). Shortened.
- A greyed read-only "Year level" field now says who sets it, instead of just
  looking broken.

### Not a layout bug, but found by the same pass

**Search returned duplicates.** The static seed index and the live index both
described the same course and the same uploaded outline, so one query returned
each twice and inflated the result count. `buildIndex` now dedupes on name plus
category, keeping whichever entry carries more detail.

## 2026-07-05 - Tutors can preview the raw outline file a student uploaded

Previously the tutor only saw the AI-extracted summary of a student's school
outline (assessments + weekly topics). Tutors can now also open the original
uploaded document itself, read-only.

**Tutor portal - `app/tutor/outlines/page.tsx`:**
- Expanding a submitted outline ("View outline") now shows a **source-file card**
  above the assessment schedule: file name, "Original school outline · uploaded
  <date>", and a **Preview file** button.
- Preview file opens the shared `PdfPreviewModal` with `annotate={false}` - the
  same read-only pop-up viewer My Booklets uses. No annotation tools, no download
  path (materials never leave the platform). The modal header shows student name,
  subject and upload date.
- Rows still in **Scanning** state also get a Preview file button - the file
  exists as soon as it is uploaded, so the tutor does not have to wait for the
  AI extraction to finish before reading it.
- Footer copy updated to mention the preview.

**Student portal - `app/(student)/outline/page.tsx`:**
- The "Shared with your tutor" disclosure now reads "They can also open your
  original file as a read-only preview" (previously it said the tutor does not
  read the raw file). Keep this disclosure accurate in production - students must
  know exactly what their tutor can see.

**For the production build:** the tutor-side preview should load the stored
upload (the same asset the AI scan consumed) into the in-portal viewer. It stays
preview-only - do not add a download or export action.

Verified: `npx tsc --noEmit` clean, `npm run build` green, zero console errors,
both flows walked in the browser (submitted + scanning states).
