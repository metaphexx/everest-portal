// Elliot - the tutor's full-page assistant.
//
// The floating panel is fine for glancing at suggestions, but a conversation
// needs room: a cramped popover makes a tutor read three lines at a time. This
// is the real surface - suggestions down the side, a proper chat in the middle.
//
// Cost posture is stated, not hidden. Suggestions are derived on this device so
// they are free and unlimited; a question is a model call, so it is rationed and
// the remaining allowance is shown.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { Icon } from "@/components/ui/Icon";
import { seedSharedOutlines, SharedOutline } from "@/lib/tutor-data";
import { SUGGESTIONS_PER_BATCH, TutorSuggestion, tutorElliotReply, tutorSuggestions } from "@/lib/tutor-elliot";

const IC = {
  send: "M2 21 23 12 2 3v7l15 2-15 2v7Z",
  spark: "M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z",
};

const TONE: Record<TutorSuggestion["kind"], { label: string; color: string; bg: string }> = {
  alert: { label: "Needs attention", color: "var(--danger-500)", bg: "rgba(224,65,65,.1)" },
  practice: { label: "Practice paper", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  assign: { label: "Suggested booklet", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
};

const PROMPTS = ["Who is struggling?", "What should I assign next?", "What is waiting to be marked?", "Who still owes an outline?"];

interface Msg {
  who: "you" | "e";
  text: string;
  actions?: { label: string; href: string }[];
}

export default function TutorElliotPage() {
  const router = useRouter();
  const { assignMaterial, submissions, showToast, toMarkCount, pendingRequests, elliotRemaining, elliotCapped, countElliotAsk, hasOnline } = useTutor();

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [shown, setShown] = useState(SUGGESTIONS_PER_BATCH);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  const outlines: SharedOutline[] = useMemo(() => seedSharedOutlines(), []);
  const all = useMemo(() => tutorSuggestions(outlines, submissions, 12), [outlines, submissions]);
  const items = all.filter((s) => !dismissed.has(s.id));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, thinking]);

  const ask = (text?: string) => {
    const q = (text ?? draft).trim();
    if (!q || thinking) return;
    setDraft("");
    setMsgs((m) => [...m, { who: "you", text: q }]);
    if (elliotCapped) {
      setMsgs((m) => [...m, { who: "e", text: "That is my question allowance for today. The suggestions beside this chat keep working - they are worked out on your device, so they cost nothing and never run out." }]);
      return;
    }
    setThinking(true);
    window.setTimeout(() => {
      const a = tutorElliotReply(q, { outlines, submissions, toMarkCount, pendingRequests });
      setMsgs((m) => [...m, { who: "e", text: a.text, actions: (a.actions ?? []).filter((x) => x.href) }]);
      setThinking(false);
      countElliotAsk();
    }, 700);
  };

  const accept = (s: TutorSuggestion) => {
    if (!s.file) return;
    assignMaterial({ fileIds: [s.file.id], courseId: s.courseId, target: { kind: "student", studentId: s.student, studentName: s.student }, kind: s.materialKind ?? "booklet" });
    setDoneIds((d) => new Set(d).add(s.id));
    showToast(s.file.name + " assigned to " + s.student);
  };

  if (!hasOnline) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Elliot works with online classes</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for in-person booklet requests only, so there is nothing for Elliot to assign yet.</div>
      </div>
    );
  }

  return (
    <div className="ev-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, height: "calc(100dvh - 230px)", minHeight: 460, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {/* ---- conversation ---- */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", minHeight: 0, padding: 0, overflow: "hidden" }}>
        <div className="thin-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 20px 8px" }}>
          {msgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "26px 10px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent-violet),var(--brand-500))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", margin: "0 auto 14px", boxShadow: "0 14px 30px -12px rgba(0,157,255,.55)" }}>
                <Icon path={IC.spark} size={24} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>Ask Elliot about your students</div>
              <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6, maxWidth: 420, marginInline: "auto", lineHeight: 1.6 }}>
                Every answer comes from what is already in the portal: your students&apos; school outlines, their recorded scores, and the booklets in your Drive.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                {PROMPTS.map((pmt) => (
                  <button key={pmt} onClick={() => ask(pmt)} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 14px", borderRadius: 980, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}>
                    {pmt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.who === "you" ? "flex-end" : "flex-start", marginTop: 12 }}>
              <div style={{ maxWidth: "min(78%, 520px)", borderRadius: m.who === "you" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "11px 14px", fontSize: 13, lineHeight: 1.55, background: m.who === "you" ? "var(--brand-500)" : "rgba(255,255,255,.9)", color: m.who === "you" ? "#fff" : "var(--fg1)", boxShadow: m.who === "you" ? "none" : "0 8px 20px -14px rgba(0,32,63,.3)" }}>
                {m.text}
                {m.actions && m.actions.length > 0 && (
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                    {m.actions.map((a) => (
                      <button key={a.label} onClick={() => router.push(a.href)} className="press" style={{ height: 30, padding: "0 12px", borderRadius: 9, border: "none", background: "rgba(0,157,255,.12)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                        {a.label}
                      </button>
                    ))}
                  </span>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, background: "rgba(255,255,255,.9)", borderRadius: "16px 16px 16px 4px", padding: "12px 15px" }} aria-label="Elliot is thinking">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s infinite" }} />
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s .2s infinite" }} />
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--fg4)", animation: "evblink 1.2s .4s infinite" }} />
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ borderTop: "1px solid rgba(0,32,63,.07)", padding: "12px 16px 14px", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ask(); } }}
              placeholder={elliotCapped ? "Question allowance used for today" : "Ask about a student, or what to assign next"}
              aria-label="Ask Elliot"
              className="field"
              style={{ flex: 1, minWidth: 0, height: 44 }}
            />
            <button onClick={() => ask()} disabled={!draft.trim() || thinking} aria-label="Send" className="btn-primary press" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", opacity: !draft.trim() || thinking ? 0.5 : 1 }}>
              <Icon path={IC.send} size={16} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
            {elliotCapped
              ? "Question allowance used up for today. Suggestions keep working - they are worked out on your device."
              : elliotRemaining + " question" + (elliotRemaining === 1 ? "" : "s") + " left today. Suggestions are unlimited."}
          </div>
        </div>
      </div>

      {/* ---- suggestions ---- */}
      <div className="glass-card thin-scroll" style={{ padding: "18px 18px 20px", boxSizing: "border-box", overflowY: "auto", minHeight: 0 }}>
        <h2 className="portal-section-title" style={{ fontSize: 15 }}>What to assign next</h2>
        <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "var(--fg3)", lineHeight: 1.5 }}>
          From your students&apos; outlines and scores. Free and unlimited - worked out on your device.
        </p>

        {items.length === 0 && (
          <div style={{ padding: "18px 2px", fontSize: 12.5, color: "var(--fg4)", lineHeight: 1.55 }}>
            Nothing to suggest right now. Once students share their outlines and record scores, suggestions appear here.
          </div>
        )}

        {items.slice(0, shown).map((s) => {
          const tone = TONE[s.kind];
          const assigned = doneIds.has(s.id);
          return (
            <div key={s.id} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.7)", padding: "12px 13px", marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, color: tone.color, background: tone.bg, padding: "3px 9px", borderRadius: 980 }}>{tone.label}</span>
                <span style={{ fontSize: 10.5, color: "var(--fg4)" }}>{s.courseName}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{s.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 4, lineHeight: 1.5 }}>{s.reason}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {s.kind === "alert" ? (
                  <button onClick={() => router.push("/tutor/outlines")} className="btn-soft press ev-tap-h" style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 700 }}>
                    See their outline
                  </button>
                ) : assigned ? (
                  <span style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: "var(--success-700)", background: "rgba(34,160,91,.12)" }}>Assigned</span>
                ) : (
                  <button onClick={() => accept(s)} className="btn-primary press ev-tap-h" style={{ height: 32, padding: "0 15px", borderRadius: 9, fontSize: 11.5, fontWeight: 700 }}>
                    Yes, assign it
                  </button>
                )}
                <button onClick={() => setDismissed((d) => new Set(d).add(s.id))} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 13px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.8)", color: "var(--fg3)" }}>
                  Not now
                </button>
              </div>
            </div>
          );
        })}

        {items.length > shown && (
          <button onClick={() => setShown((n) => n + SUGGESTIONS_PER_BATCH)} className="btn-ghost press ev-tap-h" style={{ width: "100%", height: 38, marginTop: 12, borderRadius: 11, fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,.8)", color: "var(--fg2)" }}>
            Show {Math.min(SUGGESTIONS_PER_BATCH, items.length - shown)} more
          </button>
        )}
      </div>
    </div>
  );
}
