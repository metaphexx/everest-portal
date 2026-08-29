// Pricing, discounts and the waitlist.
//
// The live system prices a week of tutoring by HOW MANY SUBJECTS a student
// takes - 1, 2 or 3 - which is the same shape as the block model: one room,
// consecutive slots, and a student on one, two or all three rosters. So the
// price of a block enrolment falls straight out of the number of ticked
// subjects, and this file is where that rate lives.

export interface PriceBundle {
  id: string;
  subjects: number;
  period: "Weekly" | "Termly";
  rate: number;
  effective: string;
  active: boolean;
}

export const PRICE_BUNDLES: PriceBundle[] = [
  { id: "pb1", subjects: 1, period: "Termly", rate: 35, effective: "2026-07-20", active: true },
  { id: "pb2", subjects: 2, period: "Termly", rate: 60, effective: "2026-07-20", active: true },
  { id: "pb3", subjects: 3, period: "Termly", rate: 80, effective: "2026-07-20", active: true },
  { id: "pb4", subjects: 1, period: "Weekly", rate: 45, effective: "2026-07-20", active: true },
  { id: "pb5", subjects: 2, period: "Weekly", rate: 75, effective: "2026-01-15", active: false },
];

export interface SiblingDiscount {
  id: string;
  /** Which child this applies to: 2 means the second sibling enrolled. */
  nth: number;
  percent: number;
  appliesTo: string;
  active: boolean;
}

export const SIBLING_DISCOUNTS: SiblingDiscount[] = [
  { id: "sd1", nth: 2, percent: 10, appliesTo: "Every subject the second sibling takes", active: true },
  { id: "sd2", nth: 3, percent: 15, appliesTo: "Every subject the third sibling takes", active: true },
  { id: "sd3", nth: 4, percent: 20, appliesTo: "Fourth sibling and beyond", active: false },
];

/**
 * What a student pays for a given number of subjects, before any sibling
 * discount. Returns null when nothing is priced for that count - which is the
 * case the office needs to see, not a silent zero.
 */
export function rateFor(subjects: number, period: PriceBundle["period"] = "Termly"): PriceBundle | null {
  return PRICE_BUNDLES.find((b) => b.active && b.subjects === subjects && b.period === period) ?? null;
}

/** The saving per extra subject, which is the argument for taking the block. */
export function perSubject(b: PriceBundle): number {
  return Math.round((b.rate / b.subjects) * 100) / 100;
}

export type WaitPriority = "high" | "normal" | "low";

export interface WaitlistEntry {
  id: string;
  student: string;
  year: string;
  parent: string;
  email: string;
  phone: string;
  subject: string;
  centre: string;
  term: string;
  priority: WaitPriority;
  added: string;
  note: string;
  status: "waiting" | "offered" | "enrolled" | "declined";
}

export const WAITLIST: WaitlistEntry[] = [
  { id: "w1", student: "Noah Bennett", year: "Year 8", parent: "Claire Bennett", email: "claire.bennett@example.com", phone: "0412 883 220", subject: "Year 8 Mathematics", centre: "Harrisdale SHS", term: "Term 3 2026", priority: "high", added: "2026-08-04", note: "Sibling already enrolled in Year 10 Maths.", status: "waiting" },
  { id: "w2", student: "Aria Kaur", year: "Year 8", parent: "Manpreet Kaur", email: "m.kaur@example.com", phone: "0433 019 774", subject: "Year 8 Science", centre: "Harrisdale SHS", term: "Term 3 2026", priority: "normal", added: "2026-08-07", note: "", status: "waiting" },
  { id: "w3", student: "Leo Fitzgerald", year: "Year 10", parent: "Sean Fitzgerald", email: "sean.f@example.com", phone: "0400 552 118", subject: "Year 10 Mathematics", centre: "Willetton", term: "Term 3 2026", priority: "high", added: "2026-07-29", note: "Wants the Saturday block, not weeknights.", status: "offered" },
  { id: "w4", student: "Mia Rahman", year: "Year 9", parent: "Sadia Rahman", email: "sadia.r@example.com", phone: "0466 204 913", subject: "Year 9 English", centre: "Piara Waters", term: "Term 3 2026", priority: "normal", added: "2026-08-11", note: "", status: "waiting" },
  { id: "w5", student: "Ethan Novak", year: "Year 8", parent: "Petra Novak", email: "petra.novak@example.com", phone: "0421 776 305", subject: "Year 8 English", centre: "Harrisdale SHS", term: "Term 3 2026", priority: "low", added: "2026-08-15", note: "Happy to wait until Term 4.", status: "waiting" },
  { id: "w6", student: "Zara Ahmed", year: "Year 10", parent: "Yusuf Ahmed", email: "y.ahmed@example.com", phone: "0455 331 887", subject: "Year 10 Science", centre: "Willetton", term: "Term 3 2026", priority: "normal", added: "2026-07-22", note: "", status: "enrolled" },
  { id: "w7", student: "Hana Suzuki", year: "Year 9", parent: "Rie Suzuki", email: "rie.suzuki@example.com", phone: "0490 118 662", subject: "Year 9 Mathematics", centre: "Piara Waters", term: "Term 3 2026", priority: "normal", added: "2026-07-18", note: "Went elsewhere, keep for Term 4.", status: "declined" },
];

export const PRIORITY_META: Record<WaitPriority, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "var(--danger-500)", bg: "rgba(224,65,65,.1)" },
  normal: { label: "Normal", color: "var(--fg3)", bg: "rgba(0,32,63,.06)" },
  low: { label: "Low", color: "var(--fg4)", bg: "rgba(0,32,63,.04)" },
};

/** How long an entry has been waiting, against the demo's today. */
export function daysWaiting(added: string, today = "2026-08-29"): number {
  const a = new Date(added + "T12:00:00").getTime();
  const t = new Date(today + "T12:00:00").getTime();
  return Math.max(0, Math.round((t - a) / 86400000));
}
