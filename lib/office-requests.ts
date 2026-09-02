// The office's print ledger.
//
// WHY THIS EXISTS. The calendar used to draw a booklet status on a class from a
// seeded value, while the queue underneath listed real request records. The two
// were unrelated: 48 sessions displayed a status and only 3 had a request behind
// them, so clicking a day badged "Booklets requested" filtered the queue to
// nothing and the page said "No requests match". The status was a claim with no
// evidence.
//
// So the request is now the only source of truth. This file generates the
// ledger the office holds - one request per class that has actually asked for
// booklets - and allSessions() derives each class's status from it. A class can
// no longer claim a status that has no request, because the status IS the
// request.
//
// Generation is deterministic (a hash of the session id, no randomness), so the
// demo looks identical on every load and across the two portals.
//
// These records live office-side only, under evr-admin-requests. The tutor
// portal models one tutor, Priya, and her four requests are seeded in
// tutor-data.ts; the rest of this ledger belongs to the other tutors and
// centres she has no view of.

import { AdminSession, allSessions } from "./admin-schedule";
import { BookletRequest, CATALOGUE, DEFAULT_FORMAT, seedRequests } from "./tutor-data";

/** The office demo clock's day. Sessions before it have already happened. */
const TODAY = "2026-07-02";
/** Past this, a class is far enough out that nobody has ordered paper yet. */
const HORIZON = "2026-07-23";

export const OFFICE_REQUEST_PREFIX = "orq:";

/** True for a request that belongs to the office ledger rather than the tutor's. */
export function isOfficeRequest(r: BookletRequest): boolean {
  return r.id.startsWith(OFFICE_REQUEST_PREFIX);
}

/** djb2, so a session always draws the same status, printer and booklet. */
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/** "Year 9 Mathematics" -> { year: "Year 9", subject: "Mathematics" } */
function splitName(className: string): { year: string; subject: string } {
  const m = className.match(/^(Year \d+)\s+(.*)$/);
  if (!m) return { year: "Year 9", subject: className };
  return { year: m[1], subject: m[2] };
}

const PRINTER_BY_CENTRE: Record<string, string> = {
  "Harrisdale SHS": "Harrisdale SHS print room",
  "Piara Waters": "Piara Waters office",
};

function printerFor(centre: string): string {
  return PRINTER_BY_CENTRE[centre] ?? "Head office (Willetton)";
}

/**
 * A booklet from the catalogue for this class. The year has to match as well as
 * the subject: the catalogue only carries one maths title, so matching on
 * subject alone printed a Year 9 booklet against a Year 8 class.
 */
function bookletFor(className: string, h: number): { itemId: string; name: string } {
  const { year, subject } = splitName(className);
  const exact = CATALOGUE.filter((c) => c.subject === subject && c.year === year);
  if (exact.length) {
    const pick = exact[h % exact.length];
    return { itemId: pick.id, name: pick.name };
  }
  return { itemId: "gen-" + (h % 97), name: year + " " + subject + " class booklet.pdf" };
}

type Stage = "none" | "requested" | "approved" | "printed" | "failed" | "rejected";

/**
 * Where a class's booklets have got to, decided by how near the class is.
 *
 * The old spread ignored time, so a class in June could sit on "not requested"
 * for ever and one in August could already be printed. Paper follows the
 * calendar: past classes have been printed, the coming fortnight is a mix of
 * decisions, and anything further out has not been ordered yet.
 */
function stageFor(s: AdminSession): Stage {
  const h = hash(s.id);
  if (s.k < TODAY) {
    // Behind us: nearly everything was printed, with the odd failure or refusal.
    const r = h % 12;
    if (r === 0) return "failed";
    if (r === 1) return "rejected";
    return "printed";
  }
  if (s.k <= HORIZON) {
    // The working window - this is the spread the office actually manages.
    const r = h % 10;
    if (r < 3) return "requested";
    if (r < 7) return "approved";
    if (r === 7) return "printed";
    return "none";
  }
  // Too far out to have ordered paper.
  return h % 8 === 0 ? "requested" : "none";
}

const STAGE_STATE: Record<Exclude<Stage, "none">, Pick<BookletRequest, "approval" | "printing">> = {
  requested: { approval: "pending", printing: "not_started" },
  approved: { approval: "approved", printing: "not_started" },
  printed: { approval: "approved", printing: "completed" },
  failed: { approval: "approved", printing: "failed" },
  rejected: { approval: "rejected", printing: "not_started" },
};

const DAY = 86400000;

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(h: number): string {
  const hh = h % 12 === 0 ? 12 : h % 12;
  return String(hh).padStart(2, "0") + ":" + String((h * 7) % 60).padStart(2, "0") + " " + (h < 12 ? "am" : "pm");
}

function requestFor(s: AdminSession, stage: Exclude<Stage, "none">): BookletRequest {
  const h = hash(s.id);
  const { year, subject } = splitName(s.className);
  const item = bookletFor(s.className, h);
  // Requests go in a few days ahead of the class, which is what makes the
  // "requested on" date read sensibly against the class date.
  const classDate = new Date(s.k + "T12:00:00");
  const raised = new Date(classDate.getTime() - (3 + (h % 5)) * DAY);
  const printer = printerFor(s.centre);
  const state = STAGE_STATE[stage];
  return {
    id: OFFICE_REQUEST_PREFIX + s.id,
    ref: "REQ" + (1770000000 + (h % 20000000)),
    date: fmtDate(raised),
    time: fmtTime(8 + (h % 9)),
    classId: s.id,
    classText: s.className + " · " + classDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }),
    tutor: s.tutor,
    yearLevel: year,
    subject,
    items: [{ itemId: item.itemId, name: item.name, qty: s.students }],
    printer,
    format: h % 6 === 0 ? { ...DEFAULT_FORMAT, colour: "Colour" } : DEFAULT_FORMAT,
    remark: "One per student for " + classDate.toLocaleDateString("en-AU", { weekday: "long" }) + "'s session.",
    ...state,
    ...(stage === "failed" ? { note: "Printer jam at " + s.centre + ". Waiting to be re-queued." } : {}),
    ...(stage === "rejected" ? { note: "Duplicate of a request already approved for this class." } : {}),
    delivery: "print" as const,
  };
}

/**
 * Requests that belong to no scheduled class - a make-up session, a parent
 * asking for a spare, a set for a student who joined late. The office has to be
 * able to tell these apart, because there is no class roll to check the copy
 * count against and no calendar day they belong to.
 */
const CUSTOM: { ref: string; date: string; time: string; text: string; tutor: string; year: string; subject: string; item: string; qty: number; printer: string; stage: Exclude<Stage, "none"> }[] = [
  {
    ref: "REQ1783140880", date: "30 Jun 2026", time: "02:18 pm",
    text: "Custom request, not linked to a class", tutor: "Grace Lin",
    year: "Year 11", subject: "English", item: "Essay structure scaffold.pdf", qty: 4,
    printer: "Harrisdale SHS print room", stage: "requested",
  },
  {
    ref: "REQ1782988145", date: "27 Jun 2026", time: "10:05 am",
    text: "Custom request, not linked to a class", tutor: "Tobi Okafor",
    year: "Year 10", subject: "Chemistry", item: "Stoichiometry revision pack.pdf", qty: 3,
    printer: "Piara Waters office", stage: "printed",
  },
  {
    ref: "REQ1782744300", date: "24 Jun 2026", time: "04:52 pm",
    text: "Custom request, not linked to a class", tutor: "Amira Hassan",
    year: "Year 9", subject: "Science", item: "Cells and body systems booklet.pdf", qty: 2,
    printer: "Harrisdale SHS print room", stage: "approved",
  },
];

/**
 * The generated ledger: one request per in-person class that has ordered
 * booklets, excluding classes already covered by the tutor's own seeded
 * requests (those are the same job and would double up), plus the handful of
 * custom requests that belong to no class at all.
 */
export function officeRequests(): BookletRequest[] {
  const covered = new Set(seedRequests().map((r) => r.classId).filter(Boolean) as string[]);
  const out: BookletRequest[] = [];
  for (const s of allSessions()) {
    // Online classes print nothing, so there is no request to hold.
    if (s.booklet === null || covered.has(s.id)) continue;
    const stage = stageFor(s);
    if (stage === "none") continue;
    out.push(requestFor(s, stage));
  }
  for (const c of CUSTOM) {
    out.push({
      id: OFFICE_REQUEST_PREFIX + "custom:" + c.ref,
      ref: c.ref,
      date: c.date,
      time: c.time,
      classId: null,
      classText: c.text,
      tutor: c.tutor,
      yearLevel: c.year,
      subject: c.subject,
      items: [{ itemId: CATALOGUE.find((x) => x.name === c.item)?.id ?? "gen-c", name: c.item, qty: c.qty }],
      printer: c.printer,
      format: DEFAULT_FORMAT,
      remark: "Spare copies, not for a scheduled class.",
      ...STAGE_STATE[c.stage],
      delivery: "print" as const,
    });
  }
  return out;
}
