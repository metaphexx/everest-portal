// The full booklet request, and the decision on it.
//
// Modelled on the live system's detail page, which is the right content in the
// wrong shape: three read-only field grids each with their own Edit button that
// unlocks a different part of the form, and Approve/Reject a long scroll below.
//
// Here the decision buttons are pinned to the bottom of the modal, and Edit
// turns a whole card into inputs at once. The office edits the printer or the
// format because a tutor picked the wrong one - that is a correction before
// approving, not a separate task.

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { APPROVAL_META, BookletRequest, DEFAULT_FORMAT, PRINTERS, PrintFormat } from "@/lib/tutor-data";
import { centreStyle } from "@/lib/admin-schedule";
import { centreOfPrinter } from "@/lib/tutor-data";

const IC = {
  edit: "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13Z",
};

const PAPER = ["A4", "A3", "Letter"];
const SIDES = ["Double sided", "Single sided"];
const COLOUR = ["Black and white", "Colour"];
const ORIENT = ["Portrait", "Landscape"];
const SCALE = ["100%", "Fit to width", "Fit to page"];
const STAPLE = ["Top left staple", "Top right staple", "Left edge staple", "No staple"];
const PER_SHEET = ["1 per page", "2 per page", "4 per page"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 12.5, color: "var(--fg1)", fontWeight: 600, lineHeight: 1.45, wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

function Card({ title, onEdit, editing, children }: { title: string; onEdit?: () => void; editing?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "13px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, fontFamily: "var(--font-display)" }}>{title}</span>
        {onEdit && (
          <button onClick={onEdit} className="btn-ghost press ev-tap-h" style={{ height: 32, padding: "0 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 700, color: editing ? "var(--accent-teal)" : "var(--fg2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon path={IC.edit} size={12} />
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function RequestDetail({
  request,
  onClose,
  onApprove,
  onReject,
  onUpdate,
  readOnly,
}: {
  request: BookletRequest | null;
  onClose: () => void;
  onApprove?: (id: string, note: string) => void;
  onReject?: (id: string, reason: string) => void;
  /** Saves a corrected printer or print format back onto the request. */
  onUpdate?: (id: string, patch: { printer?: string; format?: PrintFormat }) => void;
  readOnly?: boolean;
}) {
  const [editPrinter, setEditPrinter] = useState(false);
  const [editFormat, setEditFormat] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (!request) return null;
  const r = request;
  const fmt: PrintFormat = { ...DEFAULT_FORMAT, ...r.format };
  const copies = r.items.reduce((n, i) => n + i.qty, 0);
  const sheets = fmt.perSheet === "2 per page" ? Math.ceil(copies / 2) : fmt.perSheet === "4 per page" ? Math.ceil(copies / 4) : copies;
  const meta = APPROVAL_META[r.approval];
  const cs = centreStyle(centreOfPrinter(r.printer));

  const set = (patch: Partial<PrintFormat>) => onUpdate?.(r.id, { format: { ...fmt, ...patch } });

  const sel = (label: string, value: string, options: string[], onChange: (v: string) => void) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field" style={{ width: "100%", height: 40, boxSizing: "border-box", fontSize: 12.5 }} aria-label={label}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal onClose={onClose} labelledBy="req-detail" panelStyle={{ width: "min(720px, calc(100vw - 32px))", maxHeight: "min(88vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <span style={{ flex: "none", width: 5, alignSelf: "stretch", borderRadius: 3, background: cs.colour }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span id="req-detail" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>
              {r.classText}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--fg4)", marginTop: 3 }}>
              {r.ref} · requested {r.date}
              {r.time ? " at " + r.time : ""} · {r.yearLevel} {r.subject}
            </span>
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: meta.color, background: meta.bg, padding: "5px 11px", borderRadius: 980, flex: "none" }}>{meta.label}</span>
        </div>

        <Card title="Booklets requested">
          {r.items.map((it) => (
            <div key={it.itemId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid rgba(0,32,63,.05)" }}>
              <Icon path={IC.file} size={14} style={{ color: "var(--fg4)", flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, wordBreak: "break-word" }}>{it.name}</span>
              <span style={{ flex: "none", fontSize: 12, fontWeight: 800, color: "var(--fg2)" }}>x{it.qty}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--fg3)", paddingTop: 8, marginTop: 4, borderTop: "1px solid rgba(0,32,63,.07)" }}>
            {copies} copies over about {sheets} sheet{sheets === 1 ? "" : "s"} at {fmt.perSheet}.
          </div>
        </Card>

        <Card title="Printer" onEdit={readOnly ? undefined : () => setEditPrinter((v) => !v)} editing={editPrinter}>
          {editPrinter ? (
            sel("Printer", r.printer, PRINTERS, (v) => onUpdate?.(r.id, { printer: v }))
          ) : (
            <Field label="Sending to">
              {r.printer}
              <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg4)", marginTop: 2 }}>{centreOfPrinter(r.printer)}</span>
            </Field>
          )}
        </Card>

        <Card title="Printing format" onEdit={readOnly ? undefined : () => setEditFormat((v) => !v)} editing={editFormat}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
            {editFormat ? (
              <>
                {sel("Paper size", fmt.paper, PAPER, (v) => set({ paper: v }))}
                {sel("Sides", fmt.sides, SIDES, (v) => set({ sides: v }))}
                {sel("Colour", fmt.colour, COLOUR, (v) => set({ colour: v }))}
                {sel("Orientation", fmt.orientation, ORIENT, (v) => set({ orientation: v }))}
                {sel("Scale", fmt.scale ?? "100%", SCALE, (v) => set({ scale: v }))}
                {sel("Staple", fmt.staple, STAPLE, (v) => set({ staple: v }))}
                {sel("Pages per sheet", fmt.perSheet ?? "2 per page", PER_SHEET, (v) => set({ perSheet: v }))}
              </>
            ) : (
              <>
                <Field label="Paper size">{fmt.paper}</Field>
                <Field label="Sides">{fmt.sides}</Field>
                <Field label="Colour">{fmt.colour}</Field>
                <Field label="Orientation">{fmt.orientation}</Field>
                <Field label="Scale">{fmt.scale ?? "100%"}</Field>
                <Field label="Staple">{fmt.staple}</Field>
                <Field label="Pages per sheet">{fmt.perSheet ?? "2 per page"}</Field>
              </>
            )}
          </div>
        </Card>

        <Card title="Notes">
          <Field label="Tutor's remark">{r.remark ? <span style={{ fontWeight: 500, fontStyle: "italic" }}>&ldquo;{r.remark}&rdquo;</span> : <span style={{ color: "var(--fg4)", fontWeight: 500 }}>None given</span>}</Field>
          {!readOnly && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: "var(--fg4)", marginBottom: 4 }}>INSTRUCTION FOR THE PRINT ROOM</div>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Optional. For example: collate by class, deliver to the front desk by Tuesday lunchtime."
                aria-label="Instruction for the print room"
                className="field"
                style={{ width: "100%", minHeight: 62, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }}
              />
            </div>
          )}
          {r.note && (
            <div style={{ marginTop: 10, borderRadius: 10, background: r.approval === "rejected" ? "rgba(224,65,65,.08)" : "rgba(0,32,63,.05)", padding: "9px 11px", fontSize: 11.5, color: r.approval === "rejected" ? "var(--danger-500)" : "var(--fg3)", lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700 }}>Office note: </strong>
              {r.note}
            </div>
          )}
        </Card>

        {/* decision, pinned to the bottom rather than a scroll away */}
        {!readOnly && r.approval === "pending" && (
          <div style={{ marginTop: 16 }}>
            {rejecting ? (
              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this rejected? The tutor sees this in My Requests."
                  aria-label="Rejection reason"
                  className="field"
                  autoFocus
                  style={{ width: "100%", minHeight: 70, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button onClick={() => onReject?.(r.id, reason.trim() || "No reason given.")} className="press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "none", background: "var(--danger-500)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                    Send rejection
                  </button>
                  <button onClick={() => setRejecting(false)} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => onApprove?.(r.id, instruction.trim())} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
                  Approve for printing
                </button>
                <button onClick={() => setRejecting(true)} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--danger-500)" }}>
                  Reject
                </button>
                <span className="ev-spacer-flex" style={{ flex: 1 }} />
                <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {(readOnly || r.approval !== "pending") && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: "var(--fg4)", flex: 1, minWidth: 0 }}>
              {r.approval === "approved" ? "Approved and in the print queue." : r.approval === "rejected" ? "Rejected. The tutor has been told." : ""}
            </span>
            <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 18px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
