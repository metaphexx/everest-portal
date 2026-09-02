// Office search results, grouped by what the result is.
//
// Grouped rather than a flat ranked list, because a query like "year 9" hits a
// class, its tutor, six students and two booklets, and an ungrouped list of
// those reads as noise.

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/router";
import { useAdmin } from "@/lib/admin-store";
import { useBase, useRole } from "@/lib/admin-role";
import { adminSearch } from "@/lib/admin-search";
import { Icon } from "@/components/ui/Icon";

const IC = { search: "m21 20-4.3-4.3a8 8 0 1 0-1.4 1.4L20 21l1-1ZM4 10a6 6 0 1 1 12 0A6 6 0 0 1 4 10Z" };

const GROUP_ORDER = ["Page", "Request", "Class", "Tutor", "Student", "Booklet", "Safeguarding"];

export default function AdminSearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { requests } = useAdmin();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);

  const role = useRole();
  const base = useBase();
  const results = useMemo(() => (q.trim() ? adminSearch(q.trim(), requests, 40, { role, base }) : []), [q, requests, role, base]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof results>();
    for (const r of results) {
      const k = r.kind ?? "Other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()].sort((a, b) => {
      const ai = GROUP_ORDER.indexOf(a[0]);
      const bi = GROUP_ORDER.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [results]);

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "16px 18px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) backwards" }}>
        <div className="glass-control" style={{ display: "flex", alignItems: "center", gap: 9, borderRadius: 12, padding: "0 14px", height: 46 }}>
          <Icon path={IC.search} size={16} style={{ color: "var(--fg4)", flex: "none" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) router.push(base + "/search?q=" + encodeURIComponent(q.trim()));
            }}
            placeholder="Search classes, tutors, students, requests"
            aria-label="Search the portal"
            autoFocus
            style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 14, color: "var(--fg1)", height: "100%" }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 10 }}>
          {q.trim() ? (
            <>
              <strong style={{ fontWeight: 800, color: "var(--fg1)" }}>{results.length}</strong> result{results.length === 1 ? "" : "s"} for &quot;{q.trim()}&quot;
            </>
          ) : (
            "Type to search everything the office holds."
          )}
        </div>
      </div>

      {groups.map(([kind, rows]) => (
        <div key={kind} className="glass-card" style={{ gridColumn: "span 12", padding: "14px 18px 8px", boxSizing: "border-box", animation: "evrise .55s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: "var(--fg4)", padding: "2px 2px 8px" }}>{kind.toUpperCase()}</div>
          {rows.map((r, i) => (
            <button
              key={kind + i}
              onClick={() => router.push(r.page)}
              className="list-hover"
              style={{ display: "flex", width: "100%", textAlign: "left", alignItems: "center", gap: 12, padding: "11px 8px", borderRadius: 10, cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", borderTop: i === 0 ? "none" : "1px solid rgba(0,32,63,.06)" }}
            >
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--fg1)" }}>{r.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 2 }}>{r.meta}</span>
              </span>
            </button>
          ))}
        </div>
      ))}

      {q.trim() && results.length === 0 && (
        <div className="glass-card" style={{ gridColumn: "span 12", padding: "34px 22px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>Nothing matches &quot;{q.trim()}&quot;</div>
          <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>{role === "print" ? "Try a class, a centre or a request reference." : "Try a student, a tutor, a class, a centre or a request reference."}</div>
        </div>
      )}
    </div>
  );
}
