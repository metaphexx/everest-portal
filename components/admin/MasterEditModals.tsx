// Editing the master records behind the office: centres, printers, and which
// printer serves which centre.
//
// These three were the last screens still saying "not wired up in this
// prototype yet". They follow the live system's forms field for field, because
// the office already knows those, but in this register and with the fields it
// does not need dropped: a centre's room count (nothing reads it) and a
// printer's colour capability (its print defaults already say whether a job
// goes out in colour).

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { PeoplePicker, PickerOption } from "@/components/admin/PeoplePicker";
import { Centre, CentrePrinter, Printer } from "@/lib/admin-masters";
import { AdminStudent, STAFF, StaffMember } from "@/lib/admin-data";
import {
  COLOUR_OPTIONS,
  ORIENT_OPTIONS,
  PAPER_OPTIONS,
  PER_SHEET_OPTIONS,
  PrintFormat,
  SCALE_OPTIONS,
  SIDES_OPTIONS,
  STAPLE_OPTIONS,
} from "@/lib/tutor-data";

const IC = {
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z",
  printer: "M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-3 11H8v-5h8v5Zm3-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1-9H6v4h12V3Z",
  gear: "M19.4 13a7.8 7.8 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3H11l-.3 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.8 7.8 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1L11 21h4l.3-2.6c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6ZM13 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
  pin: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
};

const STATUS = ["Active", "Inactive"];

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--fg4)", marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: "var(--danger-500)" }}> *</span>}
    </div>
  );
}

function Row({ children, cols = "repeat(auto-fit,minmax(190px,1fr))" }: { children: React.ReactNode; cols?: string }) {
  return <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, marginTop: 12 }}>{children}</div>;
}

function Head({ title, sub, onClose }: { title: string; sub: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span id="masteredit-title" style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--fg3)", marginTop: 3 }}>{sub}</span>
      </span>
      <button onClick={onClose} aria-label="Close" className="btn-ghost press" style={{ width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg3)", flex: "none" }}>
        <Icon path={IC.close} size={14} />
      </button>
    </div>
  );
}

function Actions({ valid, why, onSave, onClose }: { valid: boolean; why: string; onSave: () => void; onClose: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
      <button onClick={onSave} disabled={!valid} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
        Save changes
      </button>
      <button onClick={onClose} className="btn-ghost press ev-tap-h" style={{ height: 44, padding: "0 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
        Cancel
      </button>
      {!valid && <span style={{ fontSize: 11.5, color: "var(--fg4)" }}>{why}</span>}
    </div>
  );
}

function sel(label: string, value: string, options: string[], onChange: (v: string) => void, required?: boolean) {
  return (
    <span>
      <Label required={required}>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label={label}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </span>
  );
}

// ---------------------------------------------------------------------------

export function EditCentreModal({ centre, onClose, onSave }: { centre: Centre; onClose: () => void; onSave: (id: string, patch: Partial<Centre>) => void }) {
  const [name, setName] = useState(centre.name);
  const [email, setEmail] = useState(centre.adminEmail);
  const [location, setLocation] = useState(centre.location);
  const [status, setStatus] = useState(centre.active ? "Active" : "Inactive");

  const valid = name.trim().length > 0 && email.trim().length > 0 && location.trim().length > 0;
  const save = () => valid && onSave(centre.id, { name: name.trim(), adminEmail: email.trim(), location: location.trim(), active: status === "Active" });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(88vh, 720px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title="Edit centre" sub="Where classes run, and who the office writes to about them." onClose={onClose} />
        <Row>
          <span>
            <Label required>Centre name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
          <span>
            <Label required>Centre admin email</Label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row>
          <span>
            <Label required>Location</Label>
            <span className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 13px", height: 44 }}>
              <Icon path={IC.pin} size={14} style={{ color: "var(--fg4)", flex: "none" }} />
              <input value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Location" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, height: "100%" }} />
            </span>
          </span>
          {sel("Status", status, STATUS, setStatus, true)}
        </Row>
        <Actions valid={valid} why="A centre needs a name, an email and a location." onSave={save} onClose={onClose} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function EditPrinterModal({ printer, centres, onClose, onSave }: { printer: Printer; centres: string[]; onClose: () => void; onSave: (id: string, patch: Partial<Printer>) => void }) {
  const [name, setName] = useState(printer.name);
  const [model, setModel] = useState(printer.model);
  const [centre, setCentre] = useState(printer.centre);
  const [status, setStatus] = useState(printer.active ? "Active" : "Inactive");
  const [stapler, setStapler] = useState(printer.stapler ? "Yes" : "No");
  const [fmt, setFmt] = useState<PrintFormat>(printer.defaults);

  const set = (patch: Partial<PrintFormat>) => setFmt((f) => ({ ...f, ...patch }));
  const valid = name.trim().length > 0 && model.trim().length > 0;
  const save = () =>
    valid &&
    onSave(printer.id, {
      name: name.trim(),
      model: model.trim(),
      centre,
      active: status === "Active",
      stapler: stapler === "Yes",
      // A printer with no stapler cannot staple, whatever the position said.
      defaults: { ...fmt, staple: stapler === "Yes" ? fmt.staple : "No staple" },
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(780px, calc(100vw - 32px))", maxHeight: "min(90vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title="Edit printer" sub="What it is, and what a job sent to it uses unless the request says otherwise." onClose={onClose} />

        <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,32,63,.08)" }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(0,157,255,.12)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon path={IC.printer} size={15} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 800 }}>The printer</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>Identity and where it sits</span>
              </span>
            </div>
            <Row cols="1fr">
              <span>
                <Label required>Printer name</Label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
              </span>
            </Row>
            <Row cols="1fr">
              <span>
                <Label required>Model</Label>
                <input value={model} onChange={(e) => setModel(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
              </span>
            </Row>
            <Row cols="1fr">{sel("Centre", centre, centres, setCentre, true)}</Row>
            <Row cols="1fr">{sel("Status", status, STATUS, setStatus)}</Row>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,32,63,.08)" }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(14,156,142,.14)", color: "var(--accent-teal)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon path={IC.gear} size={15} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 800 }}>Print defaults</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>What a job uses unless changed</span>
              </span>
            </div>
            <Row cols="1fr">{sel("Stapler fitted", stapler, ["Yes", "No"], setStapler)}</Row>
            <Row cols="1fr">{sel("Paper size", fmt.paper, PAPER_OPTIONS, (v) => set({ paper: v }), true)}</Row>
            <Row cols="1fr">{sel("Sides", fmt.sides, SIDES_OPTIONS, (v) => set({ sides: v }), true)}</Row>
            <Row cols="1fr">{sel("Orientation", fmt.orientation, ORIENT_OPTIONS, (v) => set({ orientation: v }), true)}</Row>
            <Row cols="1fr">{sel("Scale", fmt.scale ?? "100%", SCALE_OPTIONS, (v) => set({ scale: v }), true)}</Row>
            {/* Only offered when there is a stapler to position. */}
            {stapler === "Yes" && <Row cols="1fr">{sel("Staple position", fmt.staple, STAPLE_OPTIONS, (v) => set({ staple: v }), true)}</Row>}
            <Row cols="1fr">{sel("Colour", fmt.colour, COLOUR_OPTIONS, (v) => set({ colour: v }), true)}</Row>
            <Row cols="1fr">{sel("Pages per sheet", fmt.perSheet ?? "2 per page", PER_SHEET_OPTIONS, (v) => set({ perSheet: v }), true)}</Row>
          </div>
        </div>

        <Actions valid={valid} why="A printer needs a name and a model." onSave={save} onClose={onClose} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function EditCentrePrinterModal({
  mapping,
  centres,
  printers,
  onClose,
  onSave,
}: {
  mapping: CentrePrinter;
  centres: string[];
  printers: Printer[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<CentrePrinter>) => void;
}) {
  const [centre, setCentre] = useState(mapping.centre);
  const [chosen, setChosen] = useState<string[]>(mapping.printers);
  const [tutors, setTutors] = useState<string[]>(mapping.tutors);
  const [status, setStatus] = useState(mapping.active ? "Active" : "Inactive");

  const printerOptions: PickerOption[] = printers.map((p) => ({
    id: p.name,
    label: p.name,
    meta: p.model + " · " + p.centre,
    initials: p.model.slice(0, 2).toUpperCase(),
  }));
  const tutorOptions: PickerOption[] = STAFF.map((t) => ({ id: t.name, label: t.name, meta: t.centres.join(", "), initials: t.initials, colour: t.colour }));

  // The default has to be one of the mapped printers, or a job has nowhere to go.
  const [defaultPrinter, setDefaultPrinter] = useState(mapping.defaultPrinter);
  const effectiveDefault = chosen.includes(defaultPrinter) ? defaultPrinter : chosen[0] ?? "";

  const valid = chosen.length > 0;
  const save = () => valid && onSave(mapping.id, { centre, printers: chosen, tutors, defaultPrinter: effectiveDefault, active: status === "Active" });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(90vh, 880px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title="Edit centre printers" sub="Which printers a centre can send to, and who may send to them." onClose={onClose} />

        <Row>
          {sel("Centre", centre, centres, setCentre, true)}
          {sel("Status", status, STATUS, setStatus)}
        </Row>

        <Row cols="1fr">
          <PeoplePicker
            label="Printers"
            required
            options={printerOptions}
            value={chosen}
            onChange={setChosen}
            placeholder="Choose the printers at this centre"
            emptyHint="A centre with no printer cannot receive a print request."
          />
        </Row>

        <Row cols="1fr">
          <PeoplePicker
            label="Tutors"
            options={tutorOptions}
            value={tutors}
            onChange={setTutors}
            placeholder="Anyone at this centre"
            emptyHint="Leave empty and every tutor at the centre may send to these printers."
          />
        </Row>

        {chosen.length > 0 && (
          <div style={{ marginTop: 14, border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "var(--fg4)", marginBottom: 8 }}>WHAT IS MAPPED</div>
            {chosen.map((n) => {
              const p = printers.find((x) => x.name === n);
              const isDefault = n === effectiveDefault;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{p ? p.model : "Not in the printer list"}</span>
                  </span>
                  {/* One default per centre: picking a new one moves it rather
                      than leaving two printers both claiming to be the default. */}
                  <button
                    onClick={() => setDefaultPrinter(n)}
                    aria-pressed={isDefault}
                    className="press ev-tap-h"
                    style={{ height: 30, padding: "0 12px", borderRadius: 980, border: isDefault ? "none" : "1.5px solid rgba(0,32,63,.14)", background: isDefault ? "var(--accent-teal)" : "transparent", color: isDefault ? "#fff" : "var(--fg3)", fontFamily: "inherit", fontSize: 11, fontWeight: 700, cursor: "pointer", flex: "none" }}
                  >
                    {isDefault ? "Default" : "Make default"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Actions valid={valid} why="Map at least one printer to the centre." onSave={save} onClose={onClose} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const IC2 = {
  eye: "M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Zm0-7A2.5 2.5 0 1 0 12 14a2.5 2.5 0 0 0 0-5Z",
  eyeOff: "M2 4.27 3.28 3 21 20.72 19.73 22l-3.1-3.1A9.9 9.9 0 0 1 12 19c-5 0-9-4.5-9-7 0-1.4 1.24-3.3 3.2-4.8L2 4.27ZM12 7.5a4.5 4.5 0 0 1 4.5 4.5c0 .5-.09 1-.25 1.44l-5.69-5.7c.45-.15.94-.24 1.44-.24Z",
};

/** A password box with a reveal toggle, blank unless the office is setting one. */
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <span>
      <Label>{label}</Label>
      <span className="glass-control" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: "0 11px 0 13px", height: 44 }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Leave blank to keep the current one"
          aria-label={label}
          autoComplete="new-password"
          style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, height: "100%" }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide " + label.toLowerCase() : "Show " + label.toLowerCase()}
          className="btn-ghost press"
          style={{ width: 30, height: 30, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg4)", flex: "none" }}
        >
          <Icon path={show ? IC2.eyeOff : IC2.eye} size={14} />
        </button>
      </span>
    </span>
  );
}

export function EditTutorModal({ tutor, onClose, onSave }: { tutor: StaffMember; onClose: () => void; onSave: (id: string, patch: Partial<StaffMember>) => void }) {
  const [name, setName] = useState(tutor.name);
  const [email, setEmail] = useState(tutor.email);
  const [phone, setPhone] = useState(tutor.phone);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState(tutor.status === "active" ? "Active" : "On leave");

  const mismatch = pw.length > 0 && pw !== pw2;
  const valid = name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0 && !mismatch;
  const save = () =>
    valid &&
    onSave(tutor.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: status === "Active" ? "active" : "on_leave",
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(620px, calc(100vw - 32px))", maxHeight: "min(90vh, 820px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title="Edit tutor" sub="Their details and whether they can sign in." onClose={onClose} />
        <Row>
          <span>
            <Label required>Name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
          <span>
            <Label required>Email</Label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row>
          <span>
            <Label required>Phone number</Label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
          {sel("Status", status, ["Active", "On leave"], setStatus)}
        </Row>
        <Row>
          <PasswordField label="Set a new password" value={pw} onChange={setPw} />
          <span>
            <PasswordField label="Confirm password" value={pw2} onChange={setPw2} />
            {mismatch && <span style={{ display: "block", fontSize: 11, color: "var(--danger-500)", marginTop: 5 }}>The two passwords do not match.</span>}
          </span>
        </Row>
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
          Left blank, the tutor keeps the password they have.
        </div>
        <Actions valid={valid} why={mismatch ? "The two passwords do not match." : "A tutor needs a name, an email and a phone number."} onSave={save} onClose={onClose} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function EditStudentModal({
  student,
  onClose,
  onSave,
}: {
  student: AdminStudent;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(student.name);
  const [year, setYear] = useState(student.year);
  const [parent, setParent] = useState(student.parent);
  const [phone, setPhone] = useState(student.parentPhone);
  const [status, setStatus] = useState(student.status === "active" ? "Active" : student.status === "trial" ? "Trial" : "Withdrawn");

  const valid = name.trim().length > 0 && parent.trim().length > 0;
  const save = () =>
    valid &&
    onSave(student.name, {
      name: name.trim(),
      year,
      parent: parent.trim(),
      parentPhone: phone.trim(),
      status: status === "Active" ? "active" : status === "Trial" ? "trial" : "withdrawn",
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(620px, calc(100vw - 32px))", maxHeight: "min(90vh, 820px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title="Edit student" sub="Their details and who the office rings about them." onClose={onClose} />
        <Row>
          <span>
            <Label required>Student name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
          {sel("Year", year, ["Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"], setYear, true)}
        </Row>
        <Row>
          <span>
            <Label required>Parent or guardian</Label>
            <input value={parent} onChange={(e) => setParent(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
          <span>
            <Label>Contact number</Label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row>{sel("Status", status, ["Active", "Trial", "Withdrawn"], setStatus)}</Row>
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
          Which classes a student is in is set on the class itself, not here.
        </div>
        <Actions valid={valid} why="A student needs a name and a parent or guardian." onSave={save} onClose={onClose} />
      </div>
    </Modal>
  );
}
