// PdfPreviewModal - booklets the tutor shares are view + annotate only, never
// a raw download (keeps materials inside the platform, matches how a real
// licensed booklet library would work). Deliberately no download/export
// action anywhere in this component. Annotation is a real, working canvas
// overlay (highlight/pen/eraser) - it just never leaves the session, same
// spirit as "no download".

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

const HIGHLIGHT_ICON = "M9 11H7v2h2v2h2v-2h2v-2h-2V9H9v2Zm11.7-6.3-1.4-1.4a1 1 0 0 0-1.4 0L15 6.2 3 18.2V21h2.8l12-12 2.9-2.9a1 1 0 0 0 0-1.4ZM6 19H4v-2l9-9 2 2-9 9Z";
const PEN_ICON = "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z";
const NOTE_ICON = "M4 4h16v12H7l-3 3V4Zm3 4h10V6H7v2Zm0 4h7v-2H7v2Z";
const ERASE_ICON = "M16.24 3.56 21 8.32a1 1 0 0 1 0 1.41l-8.9 8.9a2 2 0 0 1-2.83 0l-5-5a1 1 0 0 1 0-1.41l10.56-10.56a1 1 0 0 1 1.41 0ZM5 20h14v2H5v-2Z";

type Tool = "highlight" | "pen" | "note" | "erase" | null;

const TOOL_META: Record<Exclude<Tool, null>, { icon: string; color: string; label: string }> = {
  highlight: { icon: HIGHLIGHT_ICON, color: "var(--warn-500)", label: "Highlighter" },
  pen: { icon: PEN_ICON, color: "var(--brand-500)", label: "Pen" },
  note: { icon: NOTE_ICON, color: "var(--accent-violet)", label: "Sticky note" },
  erase: { icon: ERASE_ICON, color: "var(--fg3)", label: "Eraser" },
};

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  meta?: string;
  // "doc" (default) is a view + annotate booklet preview; "video" is a
  // watch-only recording (no annotation tools, no download either way);
  // "link" is a Google-Classroom-style in-portal preview of a shared URL.
  kind?: "doc" | "video" | "link";
  url?: string; // shown in the mock browser bar when kind === "link"
  // When false, a "doc" preview just loads the document with no annotation
  // toolbar or drawing canvas - a plain read-only viewer (used by My Booklets).
  annotate?: boolean;
  // Total pages in the real document. The preview only ever renders the first
  // `previewLimit`, but the tutor is told the true length so they know what
  // they are assigning.
  pages?: number;
  previewLimit?: number;
  /**
   * When supplied, the footer offers a primary "Save marked copy" action. Used
   * by the marking queue so a tutor can annotate a submission and hand the
   * marked-up version straight back, instead of only viewing it.
   */
  onSaveAnnotations?: () => void;
  saveLabel?: string;
  /**
   * A primary footer action for previews that are not about annotating - Print
   * History opens a booklet this way and offers "Print again", which is how a
   * reprint actually starts: from the record of the last one.
   */
  onAction?: () => void;
  actionLabel?: string;
}

export function PdfPreviewModal({ open, onClose, fileName, meta, kind = "doc", url, annotate = true, pages, previewLimit = 4, onSaveAnnotations, saveLabel = "Save marked copy", onAction, actionLabel = "Continue" }: PdfPreviewModalProps) {
  const canAnnotate = kind === "doc" && annotate;
  const [tool, setTool] = useState<Tool>("highlight");
  const [notes, setNotes] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const noteId = useRef(0);

  // Size the canvas to its CSS box in device pixels so strokes stay crisp.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, [open]);

  if (!open) return null;

  const posFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Pointer events (not mouse-only) so highlighting/drawing works with touch
  // and stylus input too - the annotation tools are the one place a tutor or
  // student is likely to be on a tablet.
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "note") {
      const { x, y } = posFromEvent(e);
      noteId.current += 1;
      setNotes((n) => [...n, { id: noteId.current, x, y, text: "" }]);
      return;
    }
    if (!tool) return;
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    const { x, y } = posFromEvent(e);
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !tool || tool === "note") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posFromEvent(e);
    if (tool === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "highlight") {
      ctx.strokeStyle = "rgba(245,166,35,.4)";
      ctx.lineWidth = 18;
    } else {
      // A canvas context cannot resolve a CSS custom property - it silently
      // falls back to black - so the pen colour is the token's literal value.
      ctx.strokeStyle = "#009DFF";
      ctx.lineWidth = 2.5;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearAll = () => {
    const ctx = canvasRef.current?.getContext("2d");
    const canvas = canvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setNotes([]);
  };

  return (
    <Modal
      onClose={onClose}
      labelledBy="pdf-preview-title"
      backdropStyle={{ background: "rgba(0,32,63,.32)" }}
      panelStyle={{ width: 860, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "rgba(255,255,255,.97)", overflow: "hidden" }}
    >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(0,32,63,.08)" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(224,65,65,.1)", color: "var(--danger-500)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z" size={16} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="pdf-preview-title" style={{ display: "block", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fileName}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 1 }}>{meta || "Shared by your tutor"} · {kind === "video" ? "view only" : kind === "link" ? "link preview" : canAnnotate ? "view and annotate only" : "document preview"}</span>
          </span>
          <button onClick={onClose} className="btn-ghost" style={{ width: 32, height: 32, borderRadius: 9, fontSize: 14, lineHeight: 1, flex: "none", background: "#fff" }}>
            ✕
          </button>
        </div>

        {/* toolbar - annotation tools only apply to annotatable document previews */}
        {canAnnotate && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderBottom: "1px solid rgba(0,32,63,.06)", flexWrap: "wrap", background: "rgba(0,32,63,.02)" }}>
          {(Object.keys(TOOL_META) as Exclude<Tool, null>[]).map((t) => {
            const m = TOOL_META[t];
            const on = tool === t;
            return (
              <button
                key={t}
                onClick={() => setTool(on ? null : t)}
                title={m.label}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 9,
                  border: on ? "1px solid " + m.color : "1px solid rgba(0,32,63,.1)",
                  background: on ? m.color + "22" : "rgba(255,255,255,.7)",
                  color: on ? m.color : "var(--fg2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "inherit",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Icon path={m.icon} size={13} />
                {m.label}
              </button>
            );
          })}
          <span className="ev-spacer-flex" style={{ flex: 1 }} />
          <button onClick={clearAll} className="btn-ghost" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, background: "rgba(255,255,255,.7)" }}>
            Clear annotations
          </button>
        </div>
        )}

        {/* recording player - watch only, no scrubbing controls that could download */}
        {kind === "video" && (
          <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "22px", background: "rgba(0,32,63,.035)" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 680, aspectRatio: "16 / 9", margin: "0 auto", background: "linear-gradient(135deg,#101828,#1F2A44)", borderRadius: 12, boxShadow: "0 18px 40px -18px rgba(0,32,63,.55)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button
                aria-label="Play recording"
                style={{ width: 64, height: 64, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.92)", color: "#101828", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 12px 30px -10px rgba(0,0,0,.5)" }}
              >
                <Icon path="M8 5v14l11-7L8 5Z" size={26} />
              </button>
              {/* faux scrubber */}
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 600, flex: "none" }}>0:00</span>
                <div style={{ flex: 1, height: 4, borderRadius: 980, background: "rgba(255,255,255,.25)", overflow: "hidden" }}>
                  <div style={{ width: "18%", height: "100%", background: "var(--brand-500)", borderRadius: 980 }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 600, flex: "none" }}>58:24</span>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--fg4)", marginTop: 10 }}>Class recording · streams in the portal, not downloadable</div>
          </div>
        )}

        {/* link preview - mock browser frame, like opening a shared link in Google Classroom */}
        {kind === "link" && (
          <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "22px", background: "rgba(0,32,63,.035)" }}>
            <div style={{ width: "100%", maxWidth: 680, margin: "0 auto", borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 40px -18px rgba(0,32,63,.4)", background: "#fff" }}>
              {/* browser chrome */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "rgba(0,32,63,.045)", borderBottom: "1px solid rgba(0,32,63,.08)" }}>
                <span style={{ display: "flex", gap: 5, flex: "none" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--danger-500)", opacity: 0.7 }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--warn-500)", opacity: 0.7 }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--success-500)", opacity: 0.7 }} />
                </span>
                <span style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid rgba(0,32,63,.1)", borderRadius: 980, padding: "5px 13px", fontSize: 11.5, color: "var(--fg2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{url || "https://..."}</span>
              </div>
              {/* mock webpage */}
              <div style={{ padding: "26px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ height: 16, width: "55%", borderRadius: 4, background: "rgba(0,32,63,.16)" }} />
                <div style={{ height: 8, width: "35%", borderRadius: 4, background: "rgba(0,157,255,.3)" }} />
                <div style={{ height: 8, width: "100%", borderRadius: 4, background: "rgba(0,32,63,.07)", marginTop: 12 }} />
                <div style={{ height: 8, width: "93%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
                <div style={{ height: 8, width: "97%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
                <div style={{ height: 140, width: "100%", borderRadius: 10, background: "linear-gradient(135deg,rgba(0,157,255,.12),rgba(122,90,248,.12))", marginTop: 12, border: "1px solid rgba(0,32,63,.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5Zm8.1 1h4v-2h-4v2Zm3-6h-2.9v2H15a3 3 0 0 1 0 6h-2.9v2H15a5 5 0 0 0 0-10Z" size={34} style={{ color: "rgba(0,125,204,.5)" }} />
                </div>
                <div style={{ height: 8, width: "88%", borderRadius: 4, background: "rgba(0,32,63,.07)", marginTop: 12 }} />
                <div style={{ height: 8, width: "72%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--fg4)", marginTop: 10 }}>Shared link · previews inside the portal, opens nothing outside it</div>
          </div>
        )}

        {/* page area */}
        {kind === "doc" && (
        <div className="thin-scroll" style={{ flex: 1, overflowY: "auto", padding: "22px", background: "rgba(0,32,63,.035)" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 640, aspectRatio: "1 / 1.35", margin: "0 auto", background: "#fff", borderRadius: 4, boxShadow: "0 12px 30px -14px rgba(0,32,63,.4)", overflow: "hidden" }}>
            {/* mock page content */}
            <div style={{ position: "absolute", inset: 0, padding: "48px 44px", display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
              <div style={{ height: 14, width: "60%", borderRadius: 4, background: "rgba(0,32,63,.14)" }} />
              <div style={{ height: 8, width: "100%", borderRadius: 4, background: "rgba(0,32,63,.07)", marginTop: 10 }} />
              <div style={{ height: 8, width: "94%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
              <div style={{ height: 8, width: "88%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
              <div style={{ height: 8, width: "97%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
              <div style={{ height: 8, width: "70%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
              <div style={{ height: 120, width: "100%", borderRadius: 8, background: "rgba(0,32,63,.05)", marginTop: 14, border: "1px dashed rgba(0,32,63,.12)" }} />
              <div style={{ height: 8, width: "100%", borderRadius: 4, background: "rgba(0,32,63,.07)", marginTop: 14 }} />
              <div style={{ height: 8, width: "82%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
              <div style={{ height: 8, width: "91%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
            </div>
            {/* annotation canvas */}
            {canAnnotate && (
              <canvas
                ref={canvasRef}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: tool ? "crosshair" : "default", touchAction: "none" }}
              />
            )}
            {canAnnotate && notes.map((n) => (
              <div
                key={n.id}
                style={{ position: "absolute", left: n.x, top: n.y, width: 150, background: "rgba(122,90,248,.14)", border: "1px solid rgba(122,90,248,.4)", borderRadius: 8, padding: 8, boxShadow: "0 6px 16px -8px rgba(0,32,63,.3)" }}
              >
                <textarea
                  value={n.text}
                  onChange={(e) => setNotes((list) => list.map((x) => (x.id === n.id ? { ...x, text: e.target.value } : x)))}
                  placeholder="Note..."
                  autoFocus
                  style={{ width: "100%", border: "none", background: "transparent", resize: "none", fontFamily: "inherit", fontSize: 11.5, color: "#3a2c5c", outline: "none" }}
                  rows={2}
                />
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--fg4)", marginTop: 10 }}>
            {pages
              ? pages > previewLimit
                ? "Preview of the first " + previewLimit + " pages · " + pages + " pages in total"
                : pages + " page" + (pages === 1 ? "" : "s")
              : "Page 1 of 1 · demo preview"}
          </div>
        </div>
        )}

        {/* footer - deliberately no download action */}
        <div style={{ borderTop: "1px solid rgba(0,32,63,.08)", padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          {(() => {
            const primary = onSaveAnnotations ? { fn: onSaveAnnotations, label: saveLabel } : onAction ? { fn: onAction, label: actionLabel } : null;
            return (
              <>
                <button onClick={onClose} className={primary ? "btn-ghost" : "btn-primary"} style={{ height: 38, padding: "0 20px", borderRadius: 11, fontSize: 13, fontWeight: 700, background: primary ? "rgba(255,255,255,.8)" : undefined, color: primary ? "var(--fg2)" : undefined }}>
                  {onSaveAnnotations ? "Cancel" : primary ? "Close" : "Done"}
                </button>
                {primary && (
                  <button onClick={primary.fn} className="btn-primary press" style={{ height: 38, padding: "0 20px", borderRadius: 11, fontSize: 13, fontWeight: 700 }}>
                    {primary.label}
                  </button>
                )}
              </>
            );
          })()}
        </div>
    </Modal>
  );
}
