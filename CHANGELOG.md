# Changelog

Updates made to the prototype after the initial handoff. Each entry is part of the
specification: the production build must include it. See `HANDOFF.md` for the full
system description and `DESIGN-FIDELITY.md` for the UI contract.

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
