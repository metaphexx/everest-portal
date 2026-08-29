// The drawable stage: a booklet page or a blank board, with the ink canvas on
// top of it. It owns nothing - the parent holds the strokes so undo, clear and
// board switching all stay in one place.

import React, { useCallback, useEffect, useRef } from "react";
import { BOARD_ASPECT, PAGE_ASPECT, Stroke, TeachTool, paint } from "@/lib/teach";

interface TeachBoardProps {
  kind: "page" | "board";
  /** Which page of the booklet is under the ink (page boards only). */
  pageNo: number;
  strokes: Stroke[];
  tool: TeachTool;
  colour: string;
  size: number;
  zoom: number;
  onCommit: (s: Stroke) => void;
}

export function TeachBoard({ kind, pageNo, strokes, tool, colour, size, zoom, onCommit }: TeachBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const live = useRef<Stroke | null>(null);
  const drawing = useRef(false);

  // Repaint from the stroke list. Called on every change and on resize, which
  // is the whole reason strokes are stored as normalised vectors.
  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, live.current ? [...strokes, live.current] : strokes, rect.width, rect.height);
  }, [strokes]);

  useEffect(() => { repaint(); }, [repaint, zoom]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => repaint());
    ro.observe(el);
    return () => ro.disconnect();
  }, [repaint]);

  const at = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  // Pointer events, not mouse events: a tutor on a tablet with a stylus is the
  // likeliest person to be drawing on a booklet in front of a class.
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const [x, y] = at(e);
    live.current = { tool, colour, size, pts: [x, y] };
    // Capture AFTER the stroke exists, and never let it take the stroke down
    // with it: losing a line mid-explanation in front of a class is the worst
    // possible time to find out this call can throw.
    try {
      canvasRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* capture is an improvement, not a requirement */
    }
    repaint();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !live.current) return;
    const [x, y] = at(e);
    live.current.pts.push(x, y);
    repaint();
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const s = live.current;
    live.current = null;
    if (s && s.pts.length >= 2) onCommit(s);
    else repaint();
  };

  const isPage = kind === "page";

  return (
    <div
      ref={wrapRef}
      className="ev-teach-board"
      style={{
        position: "relative",
        // Height-driven, so at "Fit" the whole page is on screen without
        // scrolling - the thing a class is looking at should not need scrolling
        // to be seen. A phone has no height to spare, so globals.css flips this
        // to width-driven below 720px.
        ["--tz" as string]: String(zoom * 100) + "%",
        aspectRatio: String(isPage ? PAGE_ASPECT : BOARD_ASPECT),
        maxWidth: "100%",
        flex: "none",
        background: "#fff",
        borderRadius: isPage ? 4 : 12,
        boxShadow: "0 18px 44px -20px rgba(0,32,63,.45)",
        overflow: "hidden",
      }}
    >
      {isPage ? (
        // The booklet page under the ink. The portal has no real PDF renderer,
        // so this stands in for the page the tutor is teaching from.
        <div style={{ position: "absolute", inset: 0, padding: "7% 6.5%", display: "flex", flexDirection: "column", gap: "1.6%", pointerEvents: "none" }}>
          <div style={{ height: "2.4%", width: "58%", borderRadius: 4, background: "rgba(0,32,63,.16)" }} />
          <div style={{ height: "1.5%", width: "34%", borderRadius: 4, background: "rgba(0,157,255,.28)", marginBottom: "2%" }} />
          {[100, 94, 88, 97, 70].map((w, i) => (
            <div key={i} style={{ height: "1.3%", width: w + "%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
          ))}
          <div style={{ height: "18%", width: "100%", borderRadius: 8, background: "rgba(0,32,63,.04)", margin: "2.4% 0", border: "1px dashed rgba(0,32,63,.12)" }} />
          {[100, 82, 91, 76].map((w, i) => (
            <div key={i} style={{ height: "1.3%", width: w + "%", borderRadius: 4, background: "rgba(0,32,63,.07)" }} />
          ))}
          <div style={{ marginTop: "auto", fontSize: 11, color: "rgba(0,32,63,.3)", textAlign: "center" }}>{pageNo}</div>
        </div>
      ) : (
        // A blank board carries a faint grid: freehand working stays legible on
        // a projector, and a grid gives a straight edge to draw against.
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(0,32,63,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,32,63,.05) 1px,transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", cursor: "crosshair" }}
      />
    </div>
  );
}
