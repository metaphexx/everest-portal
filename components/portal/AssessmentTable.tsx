// Editable assessment table shared by the course pages and the Assessment
// Tracker (same store, so edits in one place appear in the other instantly).
// Students can tick assessments off, record their score, and fix the
// weighting when the outline was vague. The average keeps the tutor and the
// student on the same page about progress.

import React, { useState } from "react";
import { Assessment, Outline, outlineAverage, scoreToPct } from "@/lib/features";
import { Icon } from "@/components/ui/Icon";

export function AverageChip({ assessments }: { assessments: Assessment[] }) {
  const avg = outlineAverage(assessments);
  const entered = assessments.filter((a) => scoreToPct(a.score) !== null).length;
  if (avg === null) return null;
  const tone = avg >= 75 ? { c: "var(--success-700)", bg: "rgba(34,160,91,.12)" } : avg >= 55 ? { c: "var(--warn-700)", bg: "rgba(245,166,35,.16)" } : { c: "var(--danger-500)", bg: "rgba(224,65,65,.12)" };
  return (
    <span title={"Weighted average across " + entered + " recorded result" + (entered === 1 ? "" : "s")} style={{ fontSize: 11.5, fontWeight: 800, color: tone.c, background: tone.bg, padding: "4px 12px", borderRadius: 980, flex: "none" }}>
      {avg}% average
    </span>
  );
}

function ScoreCell({ a, onSave }: { a: Assessment; onSave: (score: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(a.score ?? "");
  const pct = scoreToPct(a.score);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setVal(a.score ?? "");
          setEditing(true);
        }}
        title={a.score ? "Edit your score" : "Add the score you got"}
        style={{
          border: "1px dashed " + (a.score ? "transparent" : "rgba(0,32,63,.25)"),
          background: a.score ? (pct !== null && pct >= 75 ? "rgba(34,160,91,.12)" : pct !== null && pct >= 55 ? "rgba(245,166,35,.16)" : "rgba(224,65,65,.12)") : "transparent",
          color: a.score ? (pct !== null && pct >= 75 ? "var(--success-700)" : pct !== null && pct >= 55 ? "var(--warn-700)" : "var(--danger-500)") : "var(--fg4)",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 700,
          padding: "3px 9px",
          borderRadius: 980,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {a.score || "+ score"}
      </button>
    );
  }
  const commit = () => {
    onSave(val.trim());
    setEditing(false);
  };
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      placeholder="78% or 34/40"
      aria-label={"Score for " + a.name}
      style={{ width: 72, border: "1px solid var(--brand-500)", borderRadius: 8, padding: "3px 7px", fontFamily: "inherit", fontSize: 11.5, outline: "none", background: "#fff" }}
    />
  );
}

function WeightCell({ a, onSave }: { a: Assessment; onSave: (weight: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(a.weight ?? "");
  if (!editing) {
    return (
      <button
        onClick={() => {
          setVal(a.weight ?? "");
          setEditing(true);
        }}
        title="Edit the weighting"
        style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: a.weight ? "var(--fg1)" : "var(--fg4)", cursor: "pointer", padding: 0, textDecoration: "underline dotted rgba(0,32,63,.3)", textUnderlineOffset: 3 }}
      >
        {a.weight || "add"}
      </button>
    );
  }
  const commit = () => {
    const v = val.trim();
    onSave(v && !v.endsWith("%") && /^\d+(\.\d+)?$/.test(v) ? v + "%" : v);
    setEditing(false);
  };
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      placeholder="15%"
      aria-label={"Weighting for " + a.name}
      style={{ width: 48, border: "1px solid var(--brand-500)", borderRadius: 8, padding: "3px 7px", fontFamily: "inherit", fontSize: 11.5, outline: "none", background: "#fff" }}
    />
  );
}

export function AssessmentTable({
  outline,
  onUpdate,
  compact,
}: {
  outline: Outline;
  onUpdate: (assessmentId: string, patch: Partial<Pick<Assessment, "weight" | "score" | "done">>) => void;
  compact?: boolean;
}) {
  const cols = compact ? "auto 1.6fr .55fr .6fr .75fr" : "auto 1.7fr .8fr .5fr .6fr .55fr .75fr";
  return (
    <div>
      <div className="ev-scroll-x">
      <div>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10, padding: "8px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", borderBottom: "1px solid rgba(0,32,63,.1)", alignItems: "center" }}>
        <div style={{ width: 16 }} aria-hidden="true" />
        <div>ASSESSMENT</div>
        {!compact && <div>TYPE</div>}
        {!compact && <div>WEEK</div>}
        <div>DUE</div>
        <div>WEIGHT</div>
        <div>YOUR SCORE</div>
      </div>
      {outline.assessments.map((a) => (
        <div key={a.id} style={{ display: "grid", gridTemplateColumns: cols, gap: 10, padding: "10px 10px", borderBottom: "1px solid rgba(0,32,63,.06)", alignItems: "center", opacity: a.done ? 0.72 : 1 }}>
          <input
            type="checkbox"
            checked={!!a.done}
            onChange={(e) => onUpdate(a.id, { done: e.target.checked })}
            aria-label={"Mark " + a.name + " as done"}
            style={{ width: 15, height: 15, accentColor: "var(--brand-500)", cursor: "pointer" }}
          />
          <div style={{ fontSize: 12.5, fontWeight: 600, textDecoration: a.done ? "line-through" : "none", textDecorationColor: "rgba(0,32,63,.35)" }}>{a.name}</div>
          {!compact && (
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.1)", padding: "3px 9px", borderRadius: 980 }}>{a.type}</span>
            </div>
          )}
          {!compact && <div style={{ fontSize: 12, color: "var(--fg3)" }}>Wk {a.week}</div>}
          <div style={{ fontSize: 12, color: "var(--fg3)" }}>{a.due}</div>
          <div>
            <WeightCell a={a} onSave={(weight) => onUpdate(a.id, { weight })} />
          </div>
          <div>
            <ScoreCell a={a} onSave={(score) => onUpdate(a.id, { score: score || undefined, done: score ? true : a.done })} />
          </div>
        </div>
      ))}
      </div>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--fg6-faint)", padding: "8px 10px 0" }}>
        Tick assessments off as you sit them, and tap a weight or score to edit. Your tutor sees the same progress.
      </div>
    </div>
  );
}

/** Compact upcoming-assessments list for the course page sidebar. */
export function UpcomingAssessments({ outline, limit = 4 }: { outline: Outline; limit?: number }) {
  const upcoming = outline.assessments.filter((a) => !a.done).slice(0, limit);
  if (upcoming.length === 0) {
    return <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "6px 0" }}>Everything in this outline is done. Well earned break.</div>;
  }
  return (
    <div>
      {upcoming.map((a, i) => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < upcoming.length - 1 ? "1px solid rgba(0,32,63,.06)" : "none" }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--navy-500)", background: "rgba(0,32,63,.06)", padding: "4px 9px", borderRadius: 9, flex: "none" }}>Wk {a.week}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
            <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{a.due} · {a.type}</span>
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 800, flex: "none" }}>{a.weight}</span>
        </div>
      ))}
    </div>
  );
}
