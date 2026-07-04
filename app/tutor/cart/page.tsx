// Cart - turns the selected materials into a print job. The request target
// uses the same visual selector as Study Materials; the materials table shows
// the full catalogue detail (subject, year group, last updated, preview); the
// print job form covers the complete printer option set (paper, side, colour,
// orientation, scale, stapling, pages per sheet) behind a defaults toggle.

import React, { useState } from "react";
import Link from "@/components/ui/Link";
import { useRouter } from "@/lib/router";
import { useTutor } from "@/lib/tutor-store";
import { CATALOGUE, DEFAULT_FORMAT, PRINTERS } from "@/lib/tutor-data";
import { ICON } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { RequestTargetSelector } from "@/components/tutor/RequestTargetSelector";
import { PdfPreviewModal } from "@/components/portal/PdfPreviewModal";

const selStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 11,
  border: "1px solid rgba(0,32,63,.12)",
  background: "rgba(255,255,255,.8)",
  padding: "0 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: "var(--fg1)",
  width: "100%",
  boxSizing: "border-box",
};

function Field({ label, required, children, dim }: { label: string; required?: boolean; children: React.ReactNode; dim?: boolean }) {
  return (
    <label style={{ display: "block", opacity: dim ? 0.5 : 1, transition: "opacity .2s ease" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg3)", marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: "var(--danger-500)", marginLeft: 3 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function RadioRow({ label, options, value, onChange, disabled }: { label: string; options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  // Real radiogroup semantics need roving tabindex + arrow keys to be complete
  // (only the checked option is in the tab order; arrows move the selection).
  const move = (dir: 1 | -1) => {
    if (disabled) return;
    const i = options.indexOf(value);
    const next = options[(i + dir + options.length) % options.length];
    onChange(next);
  };
  return (
    <div role="radiogroup" aria-label={label} style={{ opacity: disabled ? 0.5 : 1 }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg3)", marginBottom: 8 }}>{label}</span>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(o)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(1); }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(-1); }
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: on ? "var(--fg1)" : "var(--fg3)", padding: 0 }}
            >
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: on ? "5px solid var(--brand-500)" : "2px solid rgba(0,32,63,.25)", boxSizing: "border-box", background: "#fff", flex: "none", transition: "border .15s ease" }} />
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
    >
      <span style={{ width: 38, height: 22, borderRadius: 980, background: on ? "var(--brand-500)" : "rgba(0,32,63,.18)", position: "relative", transition: "background .2s ease", flex: "none" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,32,63,.3)", transition: "left .2s ease" }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? "var(--fg1)" : "var(--fg4)" }}>{label}</span>
    </button>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { cart, setQty, removeFromCart, sendRequest, hasInPerson } = useTutor();
  const [printer, setPrinter] = useState("");
  const [remark, setRemark] = useState("");
  const [editFormat, setEditFormat] = useState(false);
  const [format, setFormat] = useState(DEFAULT_FORMAT);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ name: string; meta: string } | null>(null);

  const totalCopies = cart.reduce((n, c) => n + c.qty, 0);
  const staplerOn = format.staple !== "No staple";

  const submit = () => {
    setError("");
    if (cart.length === 0) return setError("Your cart is empty. Add materials from the Study Materials page first.");
    if (!printer) return setError("Choose which printer this job should go to.");
    if (!remark.trim()) return setError("Add a short remark for the print team, it is required.");
    sendRequest({ printer, format, remark });
    router.push("/tutor/requests");
  };

  if (!hasInPerson) {
    return (
      <div className="glass-card" style={{ padding: "40px 22px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>Cart is part of in-person booklet requests</div>
        <div style={{ fontSize: 12.5, color: "var(--fg3)", marginTop: 6 }}>
          Your account is set up for online teaching only. Assign booklets straight from{" "}
          <Link href="/tutor/booklets" style={{ color: "var(--brand-600)", fontWeight: 600 }}>My Booklets</Link> instead.
        </div>
      </div>
    );
  }

  return (
    <div className="ev-page-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
      {/* REQUEST TARGET - same selector as Study Materials */}
      <div style={{ gridColumn: "span 12", position: "relative", zIndex: "var(--z-nav)" }}>
        <RequestTargetSelector hideCartLink />
      </div>

      {/* ITEMS */}
      <div className="glass-card" style={{ gridColumn: "span 12", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .12s backwards" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
          <h2 className="portal-section-title" style={{ fontSize: 15 }}>Study materials in this request</h2>
          {cart.length > 0 && <span style={{ fontSize: 12, color: "var(--fg4)" }}>{cart.length} file{cart.length === 1 ? "" : "s"} · {totalCopies} copies in total</span>}
        </div>
        {cart.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 0", color: "var(--fg4)" }}>
            <Icon path={ICON.doc} size={34} style={{ color: "var(--fg5-decorative)" }} />
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10, color: "var(--fg3)" }}>Your cart is empty</div>
            <div style={{ fontSize: 12, marginTop: 3 }}>
              Browse <Link href="/tutor/materials" style={{ color: "var(--brand-600)", fontWeight: 600 }}>Study Materials</Link> and add the booklets you need.
            </div>
          </div>
        )}
        {cart.length > 0 && (
          <div className="ev-scroll-x"><div style={{ display: "grid", gridTemplateColumns: "auto 1fr .8fr 1.6fr .8fr auto auto", gap: "0 14px", alignItems: "center", minWidth: 760 }}>
            <Head>S.NO</Head>
            <Head>SUBJECT</Head>
            <Head>YEAR GROUP</Head>
            <Head>FILE NAME</Head>
            <Head>LAST UPDATED</Head>
            <Head>COPIES</Head>
            <Head> </Head>
            {cart.map((c, i) => {
              const cat = CATALOGUE.find((x) => x.id === c.itemId);
              return (
                <React.Fragment key={c.itemId}>
                  <Cell><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg3)" }}>{i + 1}</span></Cell>
                  <Cell><span style={{ fontSize: 12.5, color: "var(--fg2)" }}>{cat?.subject ?? "-"}</span></Cell>
                  <Cell>
                    {cat ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-600)", background: "rgba(0,157,255,.12)", padding: "4px 11px", borderRadius: 980, whiteSpace: "nowrap" }}>{cat.year}</span>
                    ) : (
                      <span style={{ fontSize: 12.5, color: "var(--fg5-decorative)" }}>-</span>
                    )}
                  </Cell>
                  <Cell>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(0,157,255,.1)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        <Icon path={ICON.doc} size={13} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <button onClick={() => setPreview({ name: c.name, meta: cat ? cat.subject + " · " + cat.year + " · " + cat.topic : "Booklet" })} style={{ display: "block", border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--brand-600)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "left" }}>{c.name}</button>
                        {cat && <span style={{ display: "block", fontSize: 10.5, color: "var(--fg4)" }}>{cat.topic} · {cat.pages} pages</span>}
                      </span>
                    </div>
                  </Cell>
                  <Cell><span style={{ fontSize: 12.5, color: "var(--fg3)" }}>{cat?.updated ?? "-"}</span></Cell>
                  <Cell>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <button onClick={() => setQty(c.itemId, c.qty - 1)} className="mini-nav" style={{ width: 26, height: 26, borderRadius: 8, fontSize: 14 }}>−</button>
                      <span style={{ width: 26, textAlign: "center", fontSize: 13.5, fontWeight: 700 }}>{c.qty}</span>
                      <button onClick={() => setQty(c.itemId, c.qty + 1)} className="mini-nav" style={{ width: 26, height: 26, borderRadius: 8, fontSize: 14 }}>+</button>
                    </span>
                  </Cell>
                  <Cell>
                    <button onClick={() => removeFromCart(c.itemId)} className="btn-ghost press" style={{ height: 30, padding: "0 12px", borderRadius: 9, fontSize: 11.5, color: "var(--danger-500)" }}>
                      Remove
                    </button>
                  </Cell>
                </React.Fragment>
              );
            })}
          </div></div>
        )}
      </div>

      {/* PRINT JOB */}
      <div className="glass-card" style={{ gridColumn: "span 7", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .18s backwards" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 14 }}>Printer selection</h2>
        <Field label="SELECT PRINTER" required>
          <select value={printer} onChange={(e) => setPrinter(e.target.value)} style={selStyle}>
            <option value="">Select Printer</option>
            {PRINTERS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0 12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, fontFamily: "var(--font-display)" }}>Printing Format Details</span>
          <Switch on={editFormat} onToggle={() => setEditFormat((v) => !v)} label="Edit printer options" />
        </div>
        {!editFormat ? (
          <div style={{ fontSize: 12.5, color: "var(--fg2)", lineHeight: 1.7, background: "rgba(255,255,255,.55)", border: "1px solid rgba(0,32,63,.07)", borderRadius: 12, padding: "12px 15px" }}>
            {format.paper} · {format.sides} · {format.colour} · {format.orientation} · {format.scale ?? "100%"} · {format.staple} · {format.perSheet ?? "1 per page"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "evfadein .25s ease" }}>
            <div className="ev-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="PAPER SIZE">
                <select value={format.paper} onChange={(e) => setFormat({ ...format, paper: e.target.value })} style={selStyle}>
                  {["A4", "A3", "A5"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="SIDE">
                <select value={format.sides} onChange={(e) => setFormat({ ...format, sides: e.target.value })} style={selStyle}>
                  {["Double sided", "Single sided"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="BLACK AND WHITE / COLOUR">
                <select value={format.colour} onChange={(e) => setFormat({ ...format, colour: e.target.value })} style={selStyle}>
                  {["Black and white", "Colour"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
            </div>
            <div className="ev-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
              <RadioRow label="PAGE ORIENTATION" options={["Portrait", "Landscape"]} value={format.orientation} onChange={(v) => setFormat({ ...format, orientation: v })} />
              <Field label="SCALE">
                <select value={format.scale ?? "100%"} onChange={(e) => setFormat({ ...format, scale: e.target.value })} style={selStyle}>
                  {["100%", "Fit to page", "90%", "75%"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="PAGE PER SHEET">
                <select value={format.perSheet ?? "1 per page"} onChange={(e) => setFormat({ ...format, perSheet: e.target.value })} style={selStyle}>
                  {["1 per page", "2 per page", "4 per page"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
            </div>
            <div className="ev-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
              <RadioRow
                label="STAPLER PRINTING"
                options={["Yes", "No"]}
                value={staplerOn ? "Yes" : "No"}
                onChange={(v) => setFormat({ ...format, staple: v === "No" ? "No staple" : "Top left staple" })}
              />
              <Field label="STAPLE POSITION" dim={!staplerOn}>
                <select
                  value={staplerOn ? format.staple : ""}
                  disabled={!staplerOn}
                  onChange={(e) => setFormat({ ...format, staple: e.target.value })}
                  style={selStyle}
                >
                  {!staplerOn && <option value="">No staple</option>}
                  {["Top left staple", "Booklet fold and staple"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <span />
            </div>
          </div>
        )}
      </div>

      {/* REMARK + SEND */}
      <div className="glass-card" style={{ gridColumn: "span 5", padding: "20px 22px", boxSizing: "border-box", animation: "evrise .5s cubic-bezier(.16,1,.3,1) .22s backwards", display: "flex", flexDirection: "column" }}>
        <h2 className="portal-section-title" style={{ fontSize: 15, marginBottom: 14 }}>Remark for the print team</h2>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Required. For example: one per student, needed before Thursday's 7pm class."
          rows={5}
          maxLength={400}
          style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid rgba(0,32,63,.12)", background: "rgba(255,255,255,.8)", padding: "11px 13px", fontFamily: "inherit", fontSize: 13, color: "var(--fg1)", resize: "vertical", flex: 1 }}
        />
        {error && (
          <div role="alert" style={{ marginTop: 10, fontSize: 12.5, fontWeight: 600, color: "var(--danger-500)", background: "rgba(224,65,65,.08)", borderRadius: 10, padding: "9px 12px", animation: "evfadein .2s ease" }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={submit} className="btn-primary press" style={{ height: 42, padding: "0 22px", borderRadius: 12, fontSize: 13.5, flex: 1 }}>
            Send request for approval
          </button>
          <Link href="/tutor/materials" className="btn-ghost" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 13.5, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Back
          </Link>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg4)", marginTop: 10 }}>
          Once sent, the request goes to the Everest team for approval, then to printing. Track both under My Requests.
        </div>
      </div>

      {preview && <PdfPreviewModal open onClose={() => setPreview(null)} fileName={preview.name} meta={preview.meta} />}
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", paddingBottom: 8, whiteSpace: "nowrap" }}>{children}</div>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div style={{ minWidth: 0, padding: "11px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>{children}</div>;
}
