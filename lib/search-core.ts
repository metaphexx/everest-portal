// Shared search engine for both portals.
//
// Extracted so the tutor side stops being a hardcoded eleven-item substring
// filter. Same synonym expansion, tokenising and weighted ranking the student
// side already had; each portal supplies its own index.
//
// Swap rank() for a real vector search when the backend lands - the callers
// only depend on the {name, meta, page} shape and the score ordering.

/** Everyday words people type -> the vocabulary the portal actually uses. */
export const SYNONYMS: Record<string, string[]> = {
  // shared
  homework: ["worksheet", "due"],
  hw: ["worksheet", "due"],
  test: ["assessment", "topic test"],
  exam: ["assessment", "examination"],
  sac: ["assessment"],
  teacher: ["tutor"],
  class: ["session", "course", "timetable", "schedule"],
  lesson: ["session", "course"],
  marks: ["grade", "score", "marking"],
  results: ["grade", "score"],
  score: ["grade", "assessment"],
  recording: ["session recording", "library"],
  video: ["recording", "library"],
  notes: ["library", "study"],
  chem: ["chemistry"],
  maths: ["mathematics", "gate", "quantitative"],
  english: ["verbal", "essay"],
  file: ["drive", "pdf", "booklet"],
  files: ["drive", "booklet"],
  upload: ["drive", "outline", "submit"],
  outline: ["outline", "assessment tracker"],
  help: ["support", "elliot"],
  money: ["billing", "support"],
  pay: ["billing", "support"],
  timetable: ["timetable", "session", "schedule"],
  calendar: ["timetable", "schedule"],
  average: ["assessment tracker", "grade"],
  message: ["messages", "chat", "conversation"],
  msg: ["messages"],
  dm: ["messages"],
  settings: ["settings", "profile", "account", "password"],
  profile: ["settings", "account"],
  logout: ["sign out", "settings"],
  // tutor vocabulary
  print: ["printing", "booklet", "request", "history"],
  printing: ["print", "booklet", "history"],
  order: ["request", "cart"],
  basket: ["cart"],
  request: ["request", "cart", "booklet"],
  mark: ["marking", "grade", "feedback"],
  marking: ["marking", "grade", "feedback"],
  feedback: ["marking", "grade"],
  roll: ["attendance"],
  register: ["attendance"],
  attendance: ["attendance", "present", "absent"],
  student: ["students", "roster", "class"],
  students: ["student", "roster", "class"],
  assign: ["assign", "booklet", "materials"],
  material: ["materials", "booklet", "study materials"],
  materials: ["material", "booklet", "study materials"],
  centre: ["centre", "campus", "location"],
  campus: ["centre"],
};

export function tokens(q: string): string[] {
  const raw = q.toLowerCase().split(/[^a-z0-9%]+/).filter((t) => t.length > 1);
  const out = new Set<string>(raw);
  raw.forEach((t) => (SYNONYMS[t] ?? []).forEach((s) => s.split(" ").forEach((w) => out.add(w))));
  return Array.from(out);
}

export interface Indexable {
  name: string;
  meta: string;
  color: string;
  page: string;
  /** What kind of thing this is, shown as a chip so results read as navigation. */
  kind?: string;
  /** Extra words that should match but are not worth showing. */
  keywords?: string;
  /** Nudges destinations above incidental content matches. */
  boost?: number;
}

export function scoreFor(item: Indexable, toks: string[], rawQuery: string): number {
  const name = item.name.toLowerCase();
  const meta = item.meta.toLowerCase();
  const extra = (item.keywords ?? "").toLowerCase();
  let score = 0;
  if (name === rawQuery) score += 120; // exact title
  else if (name.startsWith(rawQuery)) score += 80;
  else if (name.includes(rawQuery)) score += 60;
  let nameHits = 0;
  let otherHits = 0;
  for (const t of toks) {
    if (name.includes(t)) {
      nameHits += 1;
      score += name.startsWith(t) ? 22 : 14;
    } else if (meta.includes(t)) {
      otherHits += 1;
      score += 7;
    } else if (extra.includes(t)) {
      otherHits += 1;
      score += 6;
    }
  }
  if (nameHits === 0 && otherHits === 0) return 0;
  if (nameHits >= 2) score += 12;
  return score + (item.boost ?? 0);
}

/** Rank an index against a query, best first. */
export function rank<T extends Indexable>(index: T[], query: string, limit = 12): (T & { score: number })[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return [];
  const toks = tokens(raw);
  return index
    .map((item) => ({ ...item, score: scoreFor(item, toks, raw) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}
