// Elliot for tutors: a floating panel of concrete, one-tap suggestions.
//
// Deliberately not a chat box. A tutor's question is "what should this student
// get next", and the portal already knows: their school outline says what is
// coming up, their scores say how they are travelling, and the Drive is tagged
// by topic. So Elliot proposes and the tutor taps Assign - or dismisses it.
//
// Same budget posture as the student's Elliot: this is derived locally from
// data already on the device, so it costs nothing per suggestion.

import React, { useMemo, useState } from "react";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { Icon } from "@/components/ui/Icon";
import { useDismissable } from "@/lib/use-dismissable";
import { seedSharedOutlines, SharedOutline } from "@/lib/tutor-data";
import { SUGGESTIONS_PER_BATCH, TutorAskAnswer, TutorSuggestion, tutorElliotReply, tutorSuggestions } from "@/lib/tutor-elliot";

const IC = {
  spark: "M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Zm6 10 .9 2.6L21 15l-2.1.8L18 18l-.9-2.2L15 15l2.1-.4L18 12Z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  alert: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v6h-2V7Zm0 8h2v2h-2v-2Z",
};

const TONE: Record<TutorSuggestion["kind"], { label: string; color: string; bg: string }> = {
  alert: { label: "Needs attention", color: "var(--danger-500)", bg: "rgba(224,65,65,.1)" },
  practice: { label: "Practice paper", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  assign: { label: "Suggested booklet", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
};

export function TutorElliotFab() {
  const router = useRouter();
  const { assignMaterial, submissions, showToast, hasOnline, toMarkCount, pendingRequests, elliotRemaining, elliotCapped, countElliotAsk } = useTutor();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"suggest" | "ask">("suggest");
  // Suggestions arrive in batches so the panel opens on a decision, not a wall.
  const [shown, setShown] = useState(SUGGESTIONS_PER_BATCH);
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<{ who: "you" | "e"; text: string; actions?: { label: string; href: string }[] }[]>([]);
  const [thinking, setThinking] = useState(false);
  const wrapRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  // The student portal writes outlines into its own blob; the tutor sees the
  // shared seed plus anything shared since.
  const outlines: SharedOutline[] = useMemo(() => seedSharedOutlines(), []);
  const all = useMemo(() => tutorSuggestions(outlines, submissions, 12), [outlines, submissions]);
  const items = all.filter((s) => !dismissed.has(s.id));

  // Only online teaching has anything to assign.
  if (!hasOnline) return null;

  const ask = () => {
    const q = draft.trim();
    if (!q || thinking) return;
    setDraft("");
    setThread((t) => [...t, { who: "you", text: q }]);
    if (elliotCapped) {
      setThread((t) => [...t, { who: "e", text: "That is my question allowance for today. The suggestions tab keeps working - it is worked out on your device, so it costs nothing and never runs out." }]);
      return;
    }
    setThinking(true);
    window.setTimeout(() => {
      const a: TutorAskAnswer = tutorElliotReply(q, { outlines, submissions, toMarkCount, pendingRequests });
      setThread((t) => [...t, { who: "e", text: a.text, actions: (a.actions ?? []).filter((x) => x.href) }]);
      setThinking(false);
      countElliotAsk();
    }, 700);
  };

  const accept = (s: TutorSuggestion) => {
    if (!s.file) return;
    assignMaterial({
      fileIds: [s.file.id],
      courseId: s.courseId,
      target: { kind: "student", studentId: s.student, studentName: s.student },
      kind: s.materialKind ?? "booklet",
    });
    setDoneIds((d) => new Set(d).add(s.id));
    showToast(s.file.name + " assigned to " + s.student);
  };

  return (
    <div ref={wrapRef} style={{ position: "fixed", right: 20, bottom: 20, zIndex: "var(--z-fab)" as unknown as number, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      {open && (
        <div
          role="dialog"
          aria-label="Elliot suggestions"
          className="thin-scroll"
          style={{
            width: "min(360px, calc(100vw - 32px))",
            maxHeight: "min(70vh, 560px)",
            overflowY: "auto",
            overscrollBehavior: "contain",
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,.9)",
            borderRadius: 18,
            boxShadow: "0 30px 60px -20px rgba(0,32,63,.45)",
            padding: 16,
            animation: "evdrop .2s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 800 }}>Elliot</div>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 3, lineHeight: 1.5 }}>
                {tab === "suggest"
                  ? "Worked out from your students' school outlines and their scores so far."
                  : "Ask about a student, what to assign, or who is behind."}
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="btn-ghost press" style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.9)", color: "var(--fg2)", flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              <Icon path={IC.close} size={14} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, background: "rgba(0,32,63,.05)", borderRadius: 11, padding: 3, margin: "12px 0 2px" }} role="tablist">
            {([["suggest", "Suggestions"], ["ask", "Ask Elliot"]] as const).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                style={{ flex: 1, height: 32, borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, background: tab === k ? "#fff" : "transparent", color: tab === k ? "var(--fg1)" : "var(--fg3)", boxShadow: tab === k ? "0 2px 6px rgba(0,32,63,.12)" : "none" }}
              >
                {label}
                {k === "suggest" && items.length > 0 ? " (" + items.length + ")" : ""}
              </button>
            ))}
          </div>

          {tab === "ask" && (
            <div>
              {thread.length === 0 && (
                <div style={{ padding: "14px 4px 6px", fontSize: 12, color: "var(--fg3)", lineHeight: 1.55 }}>
                  Try &ldquo;how is Maya going?&rdquo;, &ldquo;who is struggling?&rdquo;, &ldquo;what should I assign next?&rdquo; or &ldquo;who still owes an outline?&rdquo;
                </div>
              )}
              {thread.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.who === "you" ? "flex-end" : "flex-start", marginTop: 8 }}>
                  <div style={{ maxWidth: "88%", borderRadius: 14, padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, background: m.who === "you" ? "var(--brand-500)" : "rgba(0,32,63,.05)", color: m.who === "you" ? "#fff" : "var(--fg1)" }}>
                    {m.text}
                    {m.actions && m.actions.length > 0 && (
                      <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {m.actions.map((a) => (
                          <button
                            key={a.label}
                            onClick={() => { setOpen(false); router.push(a.href); }}
                            className="press"
                            style={{ height: 28, padding: "0 11px", borderRadius: 8, border: "none", background: "rgba(255,255,255,.85)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {thinking && <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 8 }}>Elliot is thinking…</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ask(); } }}
                  placeholder={elliotCapped ? "Question allowance used for today" : "Ask Elliot about a student"}
                  aria-label="Ask Elliot"
                  className="field"
                  style={{ flex: 1, minWidth: 0, height: 40 }}
                />
                <button onClick={ask} disabled={!draft.trim() || thinking} className="btn-primary press" style={{ height: 40, padding: "0 16px", borderRadius: 11, fontSize: 12.5, fontWeight: 700, opacity: !draft.trim() || thinking ? 0.5 : 1 }}>
                  Ask
                </button>
              </div>
              {/* The rule, stated rather than hidden: suggestions are free
                  because they are derived on the device; questions are not. */}
              <div style={{ fontSize: 10.5, color: "var(--fg4)", marginTop: 7, lineHeight: 1.5 }}>
                {elliotCapped
                  ? "Question allowance used up for today. Suggestions keep working - they are worked out on your device."
                  : elliotRemaining + " question" + (elliotRemaining === 1 ? "" : "s") + " left today. Suggestions are unlimited."}
              </div>
            </div>
          )}

          {tab === "suggest" && items.length === 0 && (
            <div style={{ padding: "18px 4px", textAlign: "center", fontSize: 12.5, color: "var(--fg4)" }}>
              Nothing to suggest right now. Once students share their outlines and record scores, suggestions appear here.
            </div>
          )}

          {tab === "suggest" && items.slice(0, shown).map((s) => {
            const tone = TONE[s.kind];
            const assigned = doneIds.has(s.id);
            return (
              <div key={s.id} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.7)", padding: "12px 13px", marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: tone.color, background: tone.bg, padding: "3px 9px", borderRadius: 980 }}>
                    {tone.label}
                  </span>
                  <span style={{ fontSize: 10.5, color: "var(--fg4)" }}>{s.courseName}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 4, lineHeight: 1.5 }}>{s.reason}</div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {s.kind === "alert" ? (
                    <button
                      onClick={() => { setOpen(false); router.push("/tutor/outlines"); }}
                      className="btn-soft press ev-tap-h"
                      style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 700 }}
                    >
                      See their outline
                    </button>
                  ) : assigned ? (
                    <span style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)" }}>
                      Assigned
                    </span>
                  ) : (
                    <button
                      onClick={() => accept(s)}
                      className="btn-primary press ev-tap-h"
                      style={{ height: 32, padding: "0 15px", borderRadius: 9, fontSize: 11.5, fontWeight: 700 }}
                    >
                      Yes, assign it
                    </button>
                  )}
                  <button
                    onClick={() => setDismissed((d) => new Set(d).add(s.id))}
                    className="btn-ghost press ev-tap-h"
                    style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg3)" }}
                  >
                    Not now
                  </button>
                </div>
              </div>
            );
          })}
          {tab === "suggest" && items.length > shown && (
            <button
              onClick={() => setShown((n) => n + SUGGESTIONS_PER_BATCH)}
              className="btn-ghost press ev-tap-h"
              style={{ width: "100%", height: 38, marginTop: 10, borderRadius: 11, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}
            >
              Show {Math.min(SUGGESTIONS_PER_BATCH, items.length - shown)} more
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={"Elliot suggestions" + (items.length ? " - " + items.length + " waiting" : "")}
        aria-expanded={open}
        className="fab-btn press"
        style={{ position: "relative", width: 56, height: 56, borderRadius: "50%", border: "none", background: "linear-gradient(135deg,var(--accent-violet),var(--brand-500))", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 36px -12px rgba(0,32,63,.5)" }}
      >
        <Icon path={IC.spark} size={22} />
        {items.length > 0 && !open && (
          <span style={{ position: "absolute", top: -2, right: -2, minWidth: 20, height: 20, padding: "0 5px", borderRadius: 980, background: "var(--danger-500)", color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-page)" }}>
            {items.length}
          </span>
        )}
      </button>
    </div>
  );
}
