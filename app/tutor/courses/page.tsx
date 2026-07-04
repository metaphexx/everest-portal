"use client";

// My Courses - every class the tutor teaches. Each card opens the course's
// home page (students, sessions, materials, marking in one place).

import React from "react";
import { useRouter } from "next/navigation";
import { useTutor } from "@/lib/tutor-store";
import { TUTOR_COURSES, TUTOR_COURSE_ORDER } from "@/lib/tutor-data";
import { todayKey } from "@/lib/calendar";
import { Icon } from "@/components/ui/Icon";

export default function TutorCoursesPage() {
  const router = useRouter();
  const { now, classes, submissions } = useTutor();
  const tKey = todayKey(now);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
      {TUTOR_COURSE_ORDER.map((id, i) => {
        const cd = TUTOR_COURSES[id];
        const sessions = classes.filter((c) => c.course === id);
        const doneCount = sessions.filter((c) => c.k < tKey).length;
        const next = sessions.find((c) => c.k >= tKey);
        const nextLabel = next
          ? new Date(next.k + "T12:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) + ", " + cd.time
          : "No more sessions this term";
        const toMark = submissions.filter((s) => s.course === id && !s.marked).length;
        return (
          <button
            key={id}
            className="card-lift"
            onClick={() => router.push(`/tutor/courses/${id}`)}
            style={{
              position: "relative",
              borderRadius: 18,
              overflow: "hidden",
              minHeight: 280,
              cursor: "pointer",
              boxShadow: "0 16px 36px -18px rgba(0,32,63,.4)",
              animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.08 + i * 0.06}s backwards`,
              border: "none",
              fontFamily: "inherit",
              textAlign: "left",
              padding: 0,
              display: "block",
              width: "100%",
            }}
          >
            <div className="ev-kenburns" style={{ position: "absolute", inset: 0, backgroundImage: `url(${cd.photo})`, backgroundSize: "cover", backgroundPosition: "center", animation: ["evkenburns1 13s", "evkenburns2 16s", "evkenburns3 19s"][i % 3] + " ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, background: cd.grad }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 18px 16px", color: "#fff" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.16)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon path={cd.icon} size={18} style={{ color: "#fff" }} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{cd.name}</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.45, opacity: 0.88, margin: "5px 0 12px" }}>{cd.tagline}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <Pill>{cd.centre}</Pill>
                <Pill>{cd.sched}</Pill>
                <Pill>{cd.students.length} students</Pill>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 11.5 }}>
                <span style={{ opacity: 0.85 }}>
                  Next: {nextLabel} · {doneCount}/{sessions.length} sessions done
                </span>
                {toMark > 0 && (
                  <span style={{ background: "rgba(224,65,65,.9)", padding: "4px 10px", borderRadius: 980, fontWeight: 700, flex: "none" }}>{toMark} to mark</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,.92)", color: "var(--navy-500)", fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 980 }}>{children}</span>;
}
