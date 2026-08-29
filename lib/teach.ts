// The teaching surface's ink.
//
// A tutor opens an assigned booklet in its own tab, draws on it while the class
// watches their screen, and flips to a blank board when the booklet runs out of
// room. Everything here is about that session.
//
// Strokes are stored as VECTORS in normalised 0-1 coordinates, not as a bitmap.
// That matters for three reasons: the ink survives a resize or a zoom, undo is a
// pop rather than a repaint from history, and the whole session fits in
// localStorage so reopening the tab tomorrow still has last week's working on
// the page.
//
// Colours are literal hex, not var(--brand-500): a canvas context does not
// resolve CSS custom properties, it silently falls back to black.

export type TeachTool = "pen" | "highlight" | "erase";

export interface Stroke {
  tool: TeachTool;
  colour: string;
  /** Stroke width as a fraction of the board's width, so it scales with zoom. */
  size: number;
  /** Flat [x0,y0,x1,y1,...] in 0-1 board space. */
  pts: number[];
}

/** One page of the booklet, or one blank board. */
export interface Board {
  id: string;
  kind: "page" | "board";
  label: string;
}

export interface TeachDoc {
  strokes: Record<string, Stroke[]>;
  /** How many blank boards the tutor has added beyond the first. */
  boards: number;
}

const KEY = "evr-teach";

export const PEN_COLOURS = [
  { id: "ink", hex: "#182030", label: "Ink" },
  { id: "brand", hex: "#009DFF", label: "Blue" },
  { id: "danger", hex: "#E04141", label: "Red" },
  { id: "success", hex: "#22A05B", label: "Green" },
  { id: "violet", hex: "#7A5AF8", label: "Violet" },
];

export const HIGHLIGHT_COLOURS = [
  { id: "amber", hex: "#F5A623", label: "Amber" },
  { id: "teal", hex: "#0E9C8E", label: "Teal" },
  { id: "violet", hex: "#7A5AF8", label: "Violet" },
];

/** A booklet page is taller than it is wide; a board is landscape. */
export const PAGE_ASPECT = 1 / 1.35;
export const BOARD_ASPECT = 16 / 10;

function readAll(): Record<string, TeachDoc> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, TeachDoc>) : {};
  } catch {
    return {};
  }
}

export function loadTeach(id: string): TeachDoc {
  const doc = readAll()[id];
  return doc && typeof doc === "object" ? { strokes: doc.strokes ?? {}, boards: doc.boards ?? 0 } : { strokes: {}, boards: 0 };
}

export function saveTeach(id: string, doc: TeachDoc): void {
  if (typeof window === "undefined") return;
  try {
    const all = readAll();
    all[id] = doc;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* a full quota must not break a live lesson */
  }
}

/** Pages of the booklet plus however many blank boards have been added. */
export function boardsFor(pages: number, extraBoards: number): Board[] {
  const list: Board[] = [];
  for (let i = 1; i <= pages; i++) list.push({ id: "p" + i, kind: "page", label: "Page " + i });
  for (let i = 1; i <= extraBoards + 1; i++) list.push({ id: "w" + i, kind: "board", label: "Board " + i });
  return list;
}

/** Replay a stroke list onto a context sized to `w` x `h` CSS pixels. */
export function paint(ctx: CanvasRenderingContext2D, strokes: Stroke[], w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  for (const s of strokes) {
    if (s.pts.length < 2) continue;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, s.size * w);
    if (s.tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else if (s.tool === "highlight") {
      // One path at low alpha, so overlapping passes of the same stroke do not
      // stack into a solid block.
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = s.colour;
    } else {
      ctx.strokeStyle = s.colour;
    }
    ctx.beginPath();
    ctx.moveTo(s.pts[0] * w, s.pts[1] * h);
    if (s.pts.length === 2) {
      // A tap should still leave a dot.
      ctx.lineTo(s.pts[0] * w + 0.01, s.pts[1] * h);
    } else {
      for (let i = 2; i < s.pts.length; i += 2) ctx.lineTo(s.pts[i] * w, s.pts[i + 1] * h);
    }
    ctx.stroke();
    ctx.restore();
  }
}
