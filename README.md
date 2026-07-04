# Everest Tutoring Portal (prototype / specification build)

The complete, working front end for the Everest Tutoring platform: a **student
portal** and a **tutor portal**, wired against deterministic in-browser mock data so
every screen, state and interaction can be exercised with no backend and no API keys.

Built with **React 18 + TypeScript + Vite**, routed with **React Router v6**. Plain
client-side SPA - drops into any React stack.

This repository is both a runnable demo and the **specification** for the production
build. Start here:

| Read this | For |
|---|---|
| [`HANDOFF.md`](HANDOFF.md) | Full developer handoff: what the app does, architecture, every student / tutor / admin interaction, the AI features, and how to integrate it into an existing system |
| [`DESIGN-FIDELITY.md`](DESIGN-FIDELITY.md) | The UI contract. The production app must look identical to this prototype - fonts, colours, sizing, spacing, motion. Non-negotiable |
| [`CLAUDE.md`](CLAUDE.md) | Working rules for AI coding assistants in this repo |

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

- `/` - student portal (persona: Maya Kapoor, Year 11)
- `/tutor` - tutor portal (persona: Priya Rao; header switcher toggles her
  in-person / online / both working modes)

Open both in two tabs of the same browser and actions sync live between portals
(shared localStorage). Reset the demo any time with `localStorage.clear()` + reload.
The demo "today" is Saturday 4 July 2026.

## Health checks

```bash
npx tsc --noEmit   # typecheck - clean at handoff
npm run build      # production build - green at handoff
```

Also true at handoff: zero console errors on a fresh seed, every route responsive
down to 375px with no horizontal overflow, WCAG AA contrast on informational text,
keyboard-accessible modals/menus/radio groups, `prefers-reduced-motion` respected.

## What is in here (high level)

- **Student**: dashboard, courses, timetable, Assessment Tracker (outline upload +
  AI scan + self-recorded marks), library and drive (preview-only materials),
  worksheet submission, grades, AI-moderated tutor messaging, Elliot AI assistant
  (budget-capped, with agentic actions and support requests), classroom
  (posts / questions / attachments), support, settings, AI portal search.
- **Tutor**: mode-aware dashboard (next class hero, booklet pipeline, booklet
  tracker graphs), courses and schedule, marking queue, Student Outlines (grouped by
  class, with Year 7-10 auto-reminders and manual nudges), the full in-person
  booklet pipeline (catalogue with class-locked filters, cart with real print
  options, requests, per-booklet history with print details), My Booklets (Drive
  assignment with AI content search, pop-up previews, cross-year assignment),
  classroom and messaging.
- **Admin**: not a UI in this build; its required behaviour is specified in
  `HANDOFF.md` section 6 (print queue approvals, Drive linking, catalogue, support
  desk, rosters, moderation review).

All "AI" behaviour is deterministic local code that defines the exact UX the real
models must reproduce, including the cost-control design (debounced search, daily
Elliot budget invisible to students, one-shot document scans, classifier-based
moderation). See `HANDOFF.md` section 7.
