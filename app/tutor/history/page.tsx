// History - the full print log, one row PER BOOKLET requested (not grouped
// into request packets), filterable by centre, day, class and status, with a
// "showing print history for" summary line. Clicking a row (or its eye)
// opens the Print Details popup: file, drive id, description, job info,
// class context, plus Print Again straight back into the cart.

import React, { useMemo, useState } from "react";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { BookletRequest, CATALOGUE, CENTRES, RequestItem, TUTOR, TUTOR_COURSES, TUTOR_COURSE_ORDER, centreOfPrinter, driveIdFor } from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

const selStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 11,
  border: "1px solid rgba(0,32,63,.12)",
  background: "rgba(255,255,255,.8)",
  padding: "0 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: "var(--fg1)",
};

const DAYS = ["Tuesday", "Wednesday", "Thursday", "Saturday"];
const EYE = "M12 5C5.6 5 2 12 2 12s3.6 7 10 7 10-7 10-7-3.6-7-10-7Zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z";

// History reads booklet-level status: a pending request means the booklet has
// been REQUESTED; approval/rejection carries over from the request itself.
const HISTORY_STATUS: Record<BookletRequest["approval"], { label: string; color: string; bg: string }> = {
  pending: { label: "Requested", color: "var(--warn-700)", bg: "rgba(245,166,35,.16)" },
  approved: { label: "Approved", color: "var(--brand-600)", bg: "rgba(0,157,255,.12)" },
  rejected: { label: "Rejected", color: "var(--danger-500)", bg: "rgba(224,65,65,.12)" },
};

interface HistoryRow {
  req: BookletRequest;
  item: RequestItem;
  key: string;
}

function centreOf(r: BookletRequest): string {
  return r.delivery === "digital" ? "Online" : centreOfPrinter(r.printer);
}

/** "Year 9 Science · Tue 7 Jul" -> { cls: "Year 9 Science", day: "Tue 7 Jul" } */
function splitClassText(classText: string): { cls: string; day: string } {
  const [cls, day] = classText.split("·").map((s) => s.trim());
  return { cls: cls ?? classText, day: day ?? "" };
}

export default function HistoryPage() {
  const router = useRouter();
  const { requests, hasInPerson, addToCart, setRequestClass, showToast } = useTutor();
  const [centre, setCentre] = useState("All centres");
  const [day, setDay] = useState("All days");
  const [course, setCourse] = useState("All classes");
  const [status, setStatus] = useState("All statuses");
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  // One row per booklet in every request - never grouped into packets.
  const allRows = useMemo<HistoryRow[]>(
    () => requests.flatMap((req) => req.items.map((item) => ({ req, item, key: req.id + ":" + item.itemId }))),
    [requests]
  );

  const rows = useMemo(() => {
    return allRows.filter(({ req, item }) => {
      if (centre !== "All centres" && centreOf(req) !== centre) return false;
      if (course !== "All classes" && !req.classText.startsWith(course)) return false;
      if (day !== "All days" && !req.classText.includes(day.slice(0, 3))) return false;
      if (status !== "All statuses" && HISTORY_STATUS[req.approval].label !== status) return false;
      if (q.trim()) {
        const cat = CATALOGUE.find((c) => c.id === item.itemId);
        const hay = (req.ref + " " + req.classText + " " + item.name + " " + (cat?.topic ?? "") + " " + centreOf(req)).toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [allRows, centre, day, course, status, q]);

  const clear = () => {
    setCentre("All centres");
    setDay("All days");
    setCourse("All classes");
    setStatus("All statuses");
    setQ("");
  };
  const filtered = centre !== "All centres" || day !== "All days" || course !== "All classes" || status !== "All statuses";

  const open = openKey ? rows.find((r) => r.key === openKey) ?? allRows.find((r) => r.key === openKey) ?? null : null;

  const printAgain = (row: HistoryRow) => {
    const cat = CATALOGUE.find((c) => c.id === row.item.itemId);
    if (!cat) {
      showToast("That booklet is no longer in the catalogue.");
      return;
    }
    setRequestClass(row.req.classId);
    addToCart(cat, row.item.qty);
    setOpenKey(null);
    router.push("/tutor/cart");
  };

  // "View preview" opens the booklet on the Study Materials page (deep-linked),
  // where the tutor previews it - no raw Google Drive access from history.
  const viewPreview = (row: HistoryRow) => {
    setOpenKey(null);
    router.push("/tutor/materials?preview=" + encodeURIComponent(row.item.itemId));
  };

  if (!hasInPerson) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>History is part of in-person booklet requests</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>Your account is set up for online teaching only. See what has been assigned from My Booklets instead.</div>
      </div>
    );
  }

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* FILTERS */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "18px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .06s backwards" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <select value={centre} onChange={(e) => setCentre(e.target.value)} style={selStyle} aria-label="Centre filter">
            <option>All centres</option>
            {CENTRES.map((c) => (
              <option key={c}>{c}</option>
            ))}
            <option>Head office</option>
            <option>Online</option>
          </select>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={selStyle} aria-label="Day filter">
            <option>All days</option>
            {DAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select value={course} onChange={(e) => setCourse(e.target.value)} style={selStyle} aria-label="Class filter">
            <option>All classes</option>
            {TUTOR_COURSE_ORDER.map((id) => (
              <option key={id}>{TUTOR_COURSES[id].name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={selStyle} aria-label="Status filter">
            <option>All statuses</option>
            <option>Requested</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
          <button onClick={clear} className="btn-ghost" style={{ height: 40, padding: "0 18px", borderRadius: 11, fontSize: 12.5, opacity: filtered || q ? 1 : 0.55 }}>
            Clear
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference, class, booklet or topic"
            className="field"
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 10 }}>
          Showing print history for: <b>{centre}</b> · <b>{day}</b> · <b>{course}</b>{status !== "All statuses" && <> · <b>{status}</b></>}
        </div>
      </div>

      {/* TABLE - one row per booklet */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
        {/* Phones get cards. Nine columns at 980px means STATUS and ACTION - the
            two a tutor actually opens this page for - sit off the right edge
            behind a swipe, which is not a reasonable thing to ask of a phone. */}
        <div className="ev-only-mobile" style={{ flexDirection: "column", gap: 10 }}>
          {rows.map((row, i) => {
            const { req, item } = row;
            const sm = HISTORY_STATUS[req.approval];
            const cat = CATALOGUE.find((c) => c.id === item.itemId);
            const { cls, day: classDay } = splitClassText(req.classText);
            const isCustom = !req.classId;
            return (
              <div key={row.key} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.6)", padding: "13px 15px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <button onClick={() => setOpenKey(row.key)} style={{ flex: 1, minWidth: 0, border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span className="ev-title-2" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--brand-600)" }}>{item.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 2 }}>
                      {isCustom ? "Custom request" : cls + " · " + classDay}
                    </span>
                  </button>
                  <span style={{ flex: "none", fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: "5px 11px", borderRadius: 980, whiteSpace: "nowrap" }}>{sm.label}</span>
                </div>
                {/* Labelled pairs, not bare values in a row: without labels the
                    columns shifted on every card because centre names differ in
                    length, so nothing lined up down the list. */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px 14px", marginTop: 10, fontSize: 12 }}>
                  {[
                    ["Printed", req.date],
                    ["Centre", centreOf(req)],
                    ["Topic", cat?.topic ?? req.subject],
                    ["Copies", String(item.qty)],
                  ].map(([label, value]) => (
                    <span key={label} style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)" }}>{label.toUpperCase()}</span>
                      <span style={{ display: "block", color: "var(--fg2)", marginTop: 1 }}>{value}</span>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setOpenKey(row.key)}
                  className="btn-ghost press"
                  style={{ width: "100%", height: 36, marginTop: 10, borderRadius: 9, fontSize: 12, color: "var(--brand-600)", background: "rgba(255,255,255,.7)" }}
                >
                  View print details
                </button>
              </div>
            );
          })}
        </div>

        <div className="ev-scroll-x ev-only-desktop"><div style={{ display: "grid", gridTemplateColumns: "auto 1fr .9fr 1.1fr 1.6fr .9fr auto auto auto", gap: "0 14px", alignItems: "stretch", minWidth: 980 }}>
          <Head>S.NO</Head>
          <Head>DATE CREATED</Head>
          <Head>CENTRE</Head>
          <Head>CLASS DETAILS</Head>
          <Head>BOOKLET</Head>
          <Head>TOPIC</Head>
          <Head>COUNT</Head>
          <Head>STATUS</Head>
          <Head>ACTION</Head>
          {rows.map((row, i) => {
            const { req, item } = row;
            const sm = HISTORY_STATUS[req.approval];
            const cat = CATALOGUE.find((c) => c.id === item.itemId);
            const { cls, day: classDay } = splitClassText(req.classText);
            const isCustom = !req.classId;
            return (
              <React.Fragment key={row.key}>
                <Cell><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg3)" }}>{i + 1}</span></Cell>
                <Cell>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{req.date}</div>
                  <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{req.time ?? req.ref}</div>
                </Cell>
                <Cell><span style={{ fontSize: 12.5, color: "var(--fg2)" }}>{centreOf(req)}</span></Cell>
                <Cell>
                  {isCustom ? (
                    <span style={{ fontSize: 12, color: "var(--fg5-decorative)" }}>-</span>
                  ) : (
                    <>
                      <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cls}</div>
                      <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{classDay}</div>
                    </>
                  )}
                </Cell>
                <Cell>
                  <button onClick={() => setOpenKey(row.key)} style={{ display: "block", border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left", maxWidth: "100%" }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--brand-600)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                    <span style={{ display: "block", fontSize: 10, color: "var(--fg4)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{driveIdFor(item.name).slice(0, 26)}…</span>
                  </button>
                </Cell>
                <Cell>
                  <span style={{ fontSize: 11.5, color: "var(--fg2)", background: "rgba(0,32,63,.05)", border: "1px solid rgba(0,32,63,.08)", padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{cat?.topic ?? req.subject}</span>
                </Cell>
                <Cell><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg3)" }}>{item.qty}</span></Cell>
                <Cell><span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: "5px 11px", borderRadius: 980, whiteSpace: "nowrap" }}>{sm.label}</span></Cell>
                <Cell>
                  <button onClick={() => setOpenKey(row.key)} title="View print details" aria-label="View print details" className="press hit-area-8 ev-tap" style={{ width: 30, height: 30, borderRadius: 9, border: "none", background: "rgba(0,157,255,.1)", color: "var(--brand-600)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon path={EYE} size={14} />
                  </button>
                </Cell>
              </React.Fragment>
            );
          })}
        </div></div>
        {rows.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--fg4)", padding: "22px 0", textAlign: "center" }}>Nothing matches those filters yet.</div>
        )}
        {rows.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--fg4)", marginTop: 12, textAlign: "right" }}>Total: {rows.length} booklet{rows.length === 1 ? "" : "s"}</div>
        )}
      </div>

      {/* PRINT DETAILS POPUP */}
      {open && <PrintDetailsModal row={open} onClose={() => setOpenKey(null)} onPrintAgain={() => printAgain(open)} onViewPreview={() => viewPreview(open)} />}
    </div>
  );
}

function PrintDetailsModal({ row, onClose, onPrintAgain, onViewPreview }: { row: HistoryRow; onClose: () => void; onPrintAgain: () => void; onViewPreview: () => void }) {
  const { req, item } = row;
  const sm = HISTORY_STATUS[req.approval];
  const cat = CATALOGUE.find((c) => c.id === item.itemId);
  const { cls, day } = splitClassText(req.classText);
  const isCustom = !req.classId;
  const description = cat
    ? cat.subject + " " + cat.year + " booklet, " + cat.pages + " pages covering " + cat.topic.toLowerCase() + ". Standard curriculum material with key concepts and practice questions."
    : "Standard curriculum booklet covering key concepts and practice questions.";

  return (
    <Modal
      onClose={onClose}
      labelledBy="print-details-title"
      panelClassName="thin-scroll"
      panelStyle={{ width: 620, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto", background: "rgba(255,255,255,.97)", padding: 26, boxSizing: "border-box" }}
    >
        <div id="print-details-title" style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Print Details</div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: -0.2, wordBreak: "break-word" }}>{item.name}</div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 3, wordBreak: "break-all" }}>{driveIdFor(item.name)}</div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: sm.color, background: sm.bg, padding: "6px 14px", borderRadius: 980, whiteSpace: "nowrap", flex: "none" }}>{sm.label}</span>
        </div>

        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--fg2)", lineHeight: 1.6 }}>{description}</p>

        <button
          onClick={onViewPreview}
          className="press"
          style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 11, border: "1px solid rgba(0,157,255,.3)", background: "rgba(0,157,255,.07)", color: "var(--brand-600)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          <Icon path={EYE} size={14} />
          View preview
        </button>

        {/* JOB INFO */}
        <div style={{ marginTop: 18, background: "rgba(0,32,63,.03)", border: "1px solid rgba(0,32,63,.06)", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: "var(--fg3)", marginBottom: 12 }}>JOB INFO</div>
          <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px" }}>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--fg4)", marginBottom: 4 }}>Copies</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700 }}>
                <Icon path="M18 3H6v4h12V3Zm1 5H5a2 2 0 0 0-2 2v6h4v4h10v-4h4v-6a2 2 0 0 0-2-2Zm-4 10H9v-5h6v5Z" size={14} style={{ color: "var(--fg3)" }} />
                {item.qty}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--fg4)", marginBottom: 4 }}>Requested By</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700 }}>
                <Icon path="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5Z" size={14} style={{ color: "var(--fg3)" }} />
                {TUTOR.name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--fg4)", marginBottom: 4 }}>Requested Date</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700 }}>
                <Icon path="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10Z" size={14} style={{ color: "var(--fg3)" }} />
                {req.date}{req.time ? ", " + req.time : ""}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--fg4)", marginBottom: 4 }}>Printer</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg2-alt)" }}>{req.printer || "Digital delivery"}</div>
            </div>
          </div>
        </div>

        {/* CLASS CONTEXT */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: "var(--fg3)", marginBottom: 12 }}>CLASS CONTEXT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 14 }}>
            <ContextItem icon="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" label="Centre" value={centreOf(req)} />
            <ContextItem icon="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z" label="Day" value={isCustom ? "" : day} />
            <ContextItem icon={ICON.courses} label="Class" value={isCustom ? "" : cls} />
            <ContextItem icon="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5Z" label="Assigned Tutor" value={TUTOR.name} />
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 22 }}>
          <button onClick={onClose} className="btn-ghost" style={{ height: 42, padding: "0 26px", borderRadius: 12, fontSize: 13, color: "var(--brand-600)", background: "rgba(255,255,255,.85)", border: "1px solid rgba(0,157,255,.3)" }}>
            Close
          </button>
          <button onClick={onPrintAgain} className="btn-primary press" style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon path="M18 3H6v4h12V3Zm1 5H5a2 2 0 0 0-2 2v6h4v4h10v-4h4v-6a2 2 0 0 0-2-2Zm-4 10H9v-5h6v5Z" size={14} />
            Print Again
          </button>
        </div>
    </Modal>
  );
}

function ContextItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
      <Icon path={icon} size={15} style={{ color: "var(--fg4)", flex: "none", marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        {value ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 1 }}>{label}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--fg5-decorative)", marginTop: 2 }}>{label}</div>
        )}
      </div>
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", paddingBottom: 8, whiteSpace: "nowrap" }}>{children}</div>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div style={{ minWidth: 0, padding: "12px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>{children}</div>;
}
