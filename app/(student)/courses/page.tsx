import React from "react";
import { useRouter } from "@/lib/router";
import { COURSE_DEFS, COURSE_ORDER, CourseId } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { ImageSlot } from "@/components/ui/ImageSlot";

const BLURB: Record<CourseId, string> = {
  chem: "Reaction mechanisms, organic pathways and lab technique with worked examples every session.",
  verbal: "Comprehension, analysis and written response practice aligned to this term's texts.",
  gate: "Exam strategy and timed practice papers for the GATE entry program.",
};
const SHORT_SCHED: Record<CourseId, string> = { chem: "Thu 7pm", verbal: "Tue 7pm", gate: "Sat 10am" };
const COUNT: Record<CourseId, string> = { chem: "16 sessions", verbal: "12 sessions", gate: "10 workshops" };

export default function CoursesPage() {
  const router = useRouter();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
      {COURSE_ORDER.map((cid, i) => {
        const cd = COURSE_DEFS[cid];
        const kb = ["evkenburns1 13s", "evkenburns2 16s", "evkenburns3 19s"][i % 3];
        return (
          <div key={cid} className="card-lift" style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 360, boxShadow: "0 16px 36px -18px rgba(0,32,63,.4)" }}>
            <ImageSlot slotId={cd.slotId} fallbackSrc={cd.photo} placeholder={`Drop a ${cd.name} class photo`} className="ev-kenburns" style={{ position: "absolute", inset: 0, animation: kb + " ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, background: cd.grad, pointerEvents: "none" }} />
            <button onClick={() => router.push(`/courses/${cid}`)} style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 18px 16px", cursor: "pointer", color: "#fff", border: "none", background: "none", fontFamily: "inherit", textAlign: "left", display: "block", width: "100%" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 11 }}>
                <Icon path={cd.icon} size={19} style={{ color: "#fff" }} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>{cd.name}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.88, margin: "6px 0 11px" }}>{BLURB[cid]}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 13 }}>
                <Pill>{cd.tutor}</Pill>
                <Pill>{SHORT_SCHED[cid]}</Pill>
                <Pill>{COUNT[cid]}</Pill>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700 }}>
                Open course
                <Icon path="m9 6 6 6-6 6" size={14} stroke />
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,.92)", color: "var(--navy-500)", fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 980 }}>{children}</span>;
}
