// The teaching view.
//
// Assigning a booklet is not teaching with it. This is the surface a tutor
// opens in its own tab, shares to the class, and draws on while they explain -
// the booklet page underneath, ink on top, and a blank board to flip to when
// the page runs out of room.
//
// It deliberately carries NO portal shell. The whole tab is shared to a class,
// so a sidebar with unread message counts, a roster, or another student's name
// would be shared with it. Nothing on this page names a student.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "@/lib/router";
import { Icon } from "@/components/ui/Icon";
import { TeachBoard } from "@/components/tutor/TeachBoard";
import { DRIVE_FILES, MaterialAssignment, SEED_ASSIGNMENTS, TUTOR_COURSES } from "@/lib/tutor-data";
import { HIGHLIGHT_COLOURS, PEN_COLOURS, Stroke, TeachTool, boardsFor, loadTeach, saveTeach } from "@/lib/teach";

const IC = {
  pen: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
  highlight: "M9 11H7v2h2v2h2v-2h2v-2h-2V9H9v2Zm11.7-6.3-1.4-1.4a1 1 0 0 0-1.4 0L15 6.2 3 18.2V21h2.8l12-12 2.9-2.9a1 1 0 0 0 0-1.4ZM6 19H4v-2l9-9 2 2-9 9Z",
  erase: "M16.24 3.56 21 8.32a1 1 0 0 1 0 1.41l-8.9 8.9a2 2 0 0 1-2.83 0l-5-5a1 1 0 0 1 0-1.41l10.56-10.56a1 1 0 0 1 1.41 0ZM5 20h14v2H5v-2Z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62A7.98 7.98 0 0 1 12.5 11c3.5 0 6.47 2.28 7.5 5.44l2.37-.78A10 10 0 0 0 12.5 8Z",
  clear: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z",
  prev: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59Z",
  next: "M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59Z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm2 18H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z",
  board: "M4 4h16v12H4V4Zm7 14h2v3h-2v-3Z",
};

const SIZES = [
  { id: "s", label: "Fine", pen: 0.0022, hi: 0.02 },
  { id: "m", label: "Medium", pen: 0.004, hi: 0.032 },
  { id: "l", label: "Bold", pen: 0.0075, hi: 0.05 },
];

/** Assignments live in localStorage, so a fresh tab can read them directly. */
function readAssignment(id: string): MaterialAssignment | null {
  let list: MaterialAssignment[] = SEED_ASSIGNMENTS;
  try {
    const raw = window.localStorage.getItem("evr-tutor");
    if (raw) {
      const p = JSON.parse(raw) as { assignments?: MaterialAssignment[] };
      if (Array.isArray(p.assignments)) list = p.assignments;
    }
  } catch {
    /* fall back to the seed */
  }
  return list.find((a) => a.id === id) ?? null;
}

function ToolButton({ on, label, path, onClick }: { on: boolean; label: string; path: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className="press ev-tap-h"
      style={{
        width: 38,
        height: 38,
        borderRadius: 11,
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        background: on ? "var(--brand-500)" : "rgba(255,255,255,.85)",
        color: on ? "#fff" : "var(--fg2)",
        boxShadow: on ? "0 6px 16px -8px rgba(0,157,255,.8)" : "inset 0 0 0 1px rgba(0,32,63,.08)",
      }}
    >
      <Icon path={path} size={16} />
    </button>
  );
}

export default function TeachView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const assignment = useMemo(() => (id ? readAssignment(id) : null), [id]);
  const file = useMemo(() => DRIVE_FILES.find((f) => f.id === assignment?.fileId), [assignment]);
  const course = assignment ? TUTOR_COURSES[assignment.courseId] : undefined;
  const pages = file?.pages ?? 12;

  const [doc, setDoc] = useState(() => (id ? loadTeach(id) : { strokes: {}, boards: 0 }));
  const boards = useMemo(() => boardsFor(pages, doc.boards), [pages, doc.boards]);
  const [boardId, setBoardId] = useState("p1");
  const [tool, setTool] = useState<TeachTool>("pen");
  const [penColour, setPenColour] = useState(PEN_COLOURS[0].hex);
  const [hiColour, setHiColour] = useState(HIGHLIGHT_COLOURS[0].hex);
  const [sizeId, setSizeId] = useState("m");
  const [zoom, setZoom] = useState(1);

  const board = boards.find((b) => b.id === boardId) ?? boards[0];
  const strokes = doc.strokes[boardId] ?? [];
  const sz = SIZES.find((s) => s.id === sizeId) ?? SIZES[1];
  const colour = tool === "highlight" ? hiColour : penColour;
  const size = tool === "highlight" ? sz.hi : sz.pen;

  // Every change writes through: a lesson that loses its working because the
  // tab was closed is worse than no ink at all.
  const update = useCallback(
    (next: (d: typeof doc) => typeof doc) => {
      setDoc((d) => {
        const n = next(d);
        if (id) saveTeach(id, n);
        return n;
      });
    },
    [id]
  );

  const commit = (s: Stroke) => update((d) => ({ ...d, strokes: { ...d.strokes, [boardId]: [...(d.strokes[boardId] ?? []), s] } }));
  const undo = () => update((d) => ({ ...d, strokes: { ...d.strokes, [boardId]: (d.strokes[boardId] ?? []).slice(0, -1) } }));
  const clear = () => update((d) => ({ ...d, strokes: { ...d.strokes, [boardId]: [] } }));
  const addBoard = () => {
    update((d) => ({ ...d, boards: d.boards + 1 }));
    setBoardId("w" + (doc.boards + 2));
  };

  const idx = boards.findIndex((b) => b.id === boardId);
  const step = (n: number) => {
    const next = boards[idx + n];
    if (next) setBoardId(next.id);
  };

  // Shortcuts, because a tutor mid-sentence should not have to hunt for a
  // button. Arrows turn the page, and the tool keys match their initials.
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") stepRef.current(1);
      else if (e.key === "ArrowLeft") stepRef.current(-1);
      else if (e.key === "p") setTool("pen");
      else if (e.key === "h") setTool("highlight");
      else if (e.key === "e") setTool("erase");
      else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  if (!assignment) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 800 }}>That material is not assigned any more</div>
          <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 8 }}>It may have been removed from the class since this tab was opened.</div>
        </div>
      </div>
    );
  }

  const swatches = tool === "highlight" ? HIGHLIGHT_COLOURS : PEN_COLOURS;
  const activeSwatch = tool === "highlight" ? hiColour : penColour;

  return (
    <div style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#EEF3F8,#E7EDF4)" }}>
      {/* identity + exit */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "rgba(255,255,255,.86)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,32,63,.07)", flexWrap: "wrap" }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,157,255,.12)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Icon path={IC.doc} size={16} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {assignment.fileName}
          </span>
          {/* The class, never the student: this tab gets shared to a room. */}
          <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>
            {course?.name ?? "Class material"} · safe to share, nothing here names a student
          </span>
        </span>
        <button
          onClick={() => router.push("/tutor/courses/" + assignment.courseId)}
          aria-label="Done teaching"
          className="btn-ghost press ev-tap-h"
          style={{ height: 36, padding: "0 14px", borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)", background: "rgba(255,255,255,.9)", flex: "none", display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <Icon path={IC.close} size={12} /> <span className="ev-only-desktop">Done teaching</span>
        </button>
      </div>

      {/* tools */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", flexWrap: "wrap", borderBottom: "1px solid rgba(0,32,63,.06)" }}>
        <ToolButton on={tool === "pen"} label="Pen (p)" path={IC.pen} onClick={() => setTool("pen")} />
        <ToolButton on={tool === "highlight"} label="Highlighter (h)" path={IC.highlight} onClick={() => setTool("highlight")} />
        <ToolButton on={tool === "erase"} label="Eraser (e)" path={IC.erase} onClick={() => setTool("erase")} />

        <span style={{ width: 1, height: 26, background: "rgba(0,32,63,.1)", margin: "0 3px", flex: "none" }} />

        {/* Colour is meaningless for an eraser, so it goes away rather than
            sitting there inert. */}
        {/* One flex item, so the swatches wrap as a SET. Left loose they wrap
            one at a time and orphan a single colour on its own row. */}
        {tool !== "erase" && (
          <span style={{ display: "inline-flex", gap: 8, flex: "none" }}>
            {swatches.map((c) => (
            <button
              key={c.id}
              onClick={() => (tool === "highlight" ? setHiColour(c.hex) : setPenColour(c.hex))}
              aria-label={c.label}
              aria-pressed={activeSwatch === c.hex}
              title={c.label}
              className="press ev-teach-swatch"
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                cursor: "pointer",
                flex: "none",
                background: c.hex,
                opacity: tool === "highlight" ? 0.55 : 1,
                border: activeSwatch === c.hex ? "2.5px solid rgba(255,255,255,.95)" : "2.5px solid transparent",
                boxShadow: activeSwatch === c.hex ? "0 0 0 2px " + c.hex : "inset 0 0 0 1px rgba(0,32,63,.12)",
              }}
            />
            ))}
          </span>
        )}

        <span style={{ width: 1, height: 26, background: "rgba(0,32,63,.1)", margin: "0 3px", flex: "none" }} />

        <div style={{ display: "inline-flex", background: "rgba(255,255,255,.85)", borderRadius: 11, padding: 3, gap: 2, boxShadow: "inset 0 0 0 1px rgba(0,32,63,.08)", flex: "none" }}>
          {SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSizeId(s.id)}
              aria-pressed={sizeId === s.id}
              className="press ev-tap-h"
              style={{ height: 30, padding: "0 11px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, background: sizeId === s.id ? "var(--brand-500)" : "transparent", color: sizeId === s.id ? "#fff" : "var(--fg3)" }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <span style={{ flex: 1 }} />

        {/* Undo and Clear wrap as a pair - split across rows they read as two
            unrelated controls, and Clear alone on a row invites a mis-tap. */}
        <span style={{ display: "inline-flex", gap: 8, flex: "none" }}>
        <button onClick={undo} disabled={strokes.length === 0} aria-label="Undo" className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 13px", borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)", background: "rgba(255,255,255,.85)", opacity: strokes.length === 0 ? 0.45 : 1, display: "inline-flex", alignItems: "center", gap: 7, flex: "none" }}>
          <Icon path={IC.undo} size={14} /> <span className="ev-only-desktop">Undo</span>
        </button>
        <button onClick={clear} disabled={strokes.length === 0} aria-label={"Clear this " + (board?.kind === "board" ? "board" : "page")} className="btn-ghost press ev-tap-h" style={{ height: 38, padding: "0 13px", borderRadius: 11, fontSize: 12.5, fontWeight: 600, color: "var(--danger-500)", background: "rgba(224,65,65,.08)", opacity: strokes.length === 0 ? 0.45 : 1, display: "inline-flex", alignItems: "center", gap: 7, flex: "none" }}>
          <Icon path={IC.clear} size={14} /> <span className="ev-only-desktop">Clear {board?.kind === "board" ? "board" : "page"}</span>
        </button>
        </span>
      </div>

      {/* stage */}
      <div className="thin-scroll" style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "18px 16px 14px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        {board && (
          <TeachBoard
            key={board.id}
            kind={board.kind}
            pageNo={board.kind === "page" ? Number(board.id.slice(1)) : 0}
            strokes={strokes}
            tool={tool}
            colour={colour}
            size={size}
            zoom={zoom}
            onCommit={commit}
          />
        )}
      </div>

      {/* page / board strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "rgba(255,255,255,.86)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(0,32,63,.07)", flexWrap: "wrap" }}>
        <button onClick={() => step(-1)} disabled={idx <= 0} aria-label="Previous" className="btn-ghost press ev-tap-h" style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,.9)", color: "var(--fg2)", opacity: idx <= 0 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, flex: "none" }}>
          <Icon path={IC.prev} size={15} />
        </button>

        <div className="thin-scroll" style={{ flex: 1, minWidth: 0, display: "flex", gap: 6, overflowX: "auto", padding: "2px 0" }}>
          {boards.map((b) => {
            const on = b.id === boardId;
            const inked = (doc.strokes[b.id]?.length ?? 0) > 0;
            return (
              <button
                key={b.id}
                onClick={() => setBoardId(b.id)}
                aria-pressed={on}
                className="press ev-tap-h"
                style={{
                  height: 32,
                  minWidth: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: on ? "var(--brand-500)" : b.kind === "board" ? "rgba(122,90,248,.12)" : "rgba(0,32,63,.05)",
                  color: on ? "#fff" : b.kind === "board" ? "var(--accent-violet)" : "var(--fg3)",
                }}
              >
                {b.kind === "board" && <Icon path={IC.board} size={12} />}
                {b.kind === "page" ? b.id.slice(1) : b.label}
                {/* A dot marks a page that already has working on it, so a tutor
                    can find where they were without opening every page. */}
                {inked && <span style={{ width: 5, height: 5, borderRadius: "50%", background: on ? "rgba(255,255,255,.9)" : "var(--warn-500)" }} />}
              </button>
            );
          })}
          <button onClick={addBoard} className="press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 10, border: "1px dashed rgba(122,90,248,.45)", background: "transparent", color: "var(--accent-violet)", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", flex: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon path={IC.add} size={12} /> New board
          </button>
        </div>

        <button onClick={() => step(1)} disabled={idx >= boards.length - 1} aria-label="Next" className="btn-ghost press ev-tap-h" style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,.9)", color: "var(--fg2)", opacity: idx >= boards.length - 1 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, flex: "none" }}>
          <Icon path={IC.next} size={15} />
        </button>

        <span style={{ width: 1, height: 24, background: "rgba(0,32,63,.1)", flex: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, flex: "none" }}>
          {[
            { z: 1, label: "Fit" },
            { z: 1.35, label: "Larger" },
            { z: 1.8, label: "Largest" },
          ].map((o) => (
            <button
              key={o.label}
              onClick={() => setZoom(o.z)}
              aria-pressed={zoom === o.z}
              className="press ev-tap-h"
              style={{ height: 32, padding: "0 11px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, background: zoom === o.z ? "rgba(0,157,255,.12)" : "transparent", color: zoom === o.z ? "var(--brand-600)" : "var(--fg4)" }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
