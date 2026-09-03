// Catalogue: the booklets the office publishes.
//
// This is the source of both tutor-facing lists - Study Materials (request it
// printed) and My Booklets (assign it digitally) - so a booklet added here
// appears in both. Saying that on the page saves the question being asked.

import React, { useMemo, useState } from "react";
import Link from "@/components/ui/Link";
import { useAdmin } from "@/lib/admin-store";
import { Icon } from "@/components/ui/Icon";
import { CAT_SUBJECTS, CATALOGUE, YEAR_GROUPS } from "@/lib/tutor-data";

const IC = {
  book: "M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6Zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H8V4h12v12Z",
};

export default function AdminCatalogue() {
  const { notWired } = useAdmin();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("All");
  const [year, setYear] = useState("All");

  const shown = useMemo(
    () =>
      CATALOGUE.filter((c) => {
        if (subject !== "All" && c.subject !== subject) return false;
        if (year !== "All" && c.year !== year) return false;
        const ql = q.trim().toLowerCase();
        return !ql || (c.name + " " + c.topic + " " + c.subject).toLowerCase().includes(ql);
      }),
    [q, subject, year]
  );

  const pages = shown.reduce((n, c) => n + c.pages, 0);

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card ev-wrap-row" style={{ gridColumn: "span 12", padding: "14px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <span className="ev-wrap-main" style={{ flex: "1 0 auto", minWidth: 0, fontSize: 12, color: "var(--fg2)", lineHeight: 1.6 }}>
          Everything here reaches tutors twice: in <strong style={{ fontWeight: 700 }}>Study Materials</strong> to request printed, and in{" "}
          <strong style={{ fontWeight: 700 }}>My Booklets</strong> to assign to an online class. A booklet is not uploaded here - it comes from whichever
          Drive folder its subject is mapped to.
        </span>
        <Link
          href="/admin/masters?tab=subject-drive"
          className="btn-primary press ev-tap-h ev-wrap-cta"
          style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, flex: "none", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          Map a subject's Drive folder
        </Link>
      </div>

      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search booklets by name or topic" aria-label="Search the catalogue" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box", marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <span>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>SUBJECT</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Subject">
              {["All", ...CAT_SUBJECTS].map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All subjects" : s}
                </option>
              ))}
            </select>
          </span>
          <span>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 5 }}>YEAR</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Year">
              {["All", ...YEAR_GROUPS].map((y) => (
                <option key={y} value={y}>
                  {y === "All" ? "All years" : y}
                </option>
              ))}
            </select>
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>
          {shown.length} booklet{shown.length === 1 ? "" : "s"} · {pages} pages in total
        </div>
      </div>

      {shown.map((c, i) => (
        <div key={c.id} className="glass-card" style={{ gridColumn: "span 4", padding: "16px 18px", boxSizing: "border-box", animation: `evrise .55s cubic-bezier(.16,1,.3,1) ${0.06 + i * 0.02}s backwards` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(14,156,142,.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <Icon path={IC.book} size={16} style={{ color: "var(--accent-teal)" }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{c.name}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>
                {c.year} {c.subject} · {c.topic}
              </span>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>
                {c.pages} pages · updated {c.updated}
              </span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button onClick={() => notWired("Booklet preview")} className="btn-soft press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 700 }}>
              Preview
            </button>
            <button onClick={() => notWired("Replace booklet")} className="btn-ghost press ev-tap-h" style={{ height: 34, padding: "0 13px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: "var(--fg2)" }}>
              Replace
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
