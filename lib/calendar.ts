import { dateKey } from "./data";

export const DOWS_MON = ["M", "T", "W", "T", "F", "S", "S"];

export interface GridCell {
  d: Date;
  k: string;
  inMonth: boolean;
}

/** 42-cell month grid, Monday-first (the portal default). */
export function monthGrid(vm: number, vy: number): GridCell[] {
  const first = new Date(vy, vm, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const cells: GridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(vy, vm, 1 - offset + i);
    cells.push({ d, k: dateKey(d), inMonth: d.getMonth() === vm });
  }
  return cells;
}

export function monthLabel(vm: number, vy: number): string {
  return new Date(vy, vm, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

export function todayKey(now: number): string {
  return dateKey(new Date(now));
}
