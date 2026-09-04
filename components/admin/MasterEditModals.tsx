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
import { BookletDriveMap, Centre, CentrePrinter, CourseCategory, CourseRow, CourseTutorMap, DriveMap, Printer, SubjectRow, Term, YearGroup } from "@/lib/admin-masters";
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

function Actions({ valid, why, onSave, onClose, label = "Save changes" }: { valid: boolean; why: string; onSave: () => void; onClose: () => void; label?: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
      <button onClick={onSave} disabled={!valid} className="btn-primary press ev-tap-h" style={{ height: 44, padding: "0 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
        {label}
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

export function EditCentreModal({ centre, onClose, onSave }: { /** Absent when adding a new centre. */ centre?: Centre; onClose: () => void; onSave: (id: string, patch: Partial<Centre>) => void }) {
  const [name, setName] = useState(centre?.name ?? "");
  const [email, setEmail] = useState(centre?.adminEmail ?? "");
  const [location, setLocation] = useState(centre?.location ?? "");
  const [status, setStatus] = useState(centre ? (centre.active ? "Active" : "Inactive") : "Active");

  const valid = name.trim().length > 0 && email.trim().length > 0 && location.trim().length > 0;
  const save = () => valid && onSave(centre?.id ?? "c" + Date.now().toString(36), { name: name.trim(), adminEmail: email.trim(), location: location.trim(), active: status === "Active" });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(88vh, 720px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={centre ? "Edit centre" : "Add a centre"} sub="Where classes run, and who the office writes to about them." onClose={onClose} />
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
        <Actions valid={valid} why="A centre needs a name, an email and a location." onSave={save} onClose={onClose} label={centre ? "Save changes" : "Add centre"} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const NEW_PRINTER_DEFAULTS: PrintFormat = { paper: "A4", sides: "Double sided", colour: "Black and white", orientation: "Portrait", staple: "No staple", scale: "100%", perSheet: "2 per page" };

export function EditPrinterModal({ printer, centres, onClose, onSave }: { /** Absent when adding a new printer. */ printer?: Printer; centres: string[]; onClose: () => void; onSave: (id: string, patch: Partial<Printer>) => void }) {
  const [name, setName] = useState(printer?.name ?? "");
  const [model, setModel] = useState(printer?.model ?? "");
  const [centre, setCentre] = useState(printer?.centre ?? centres[0] ?? "");
  const [status, setStatus] = useState(printer ? (printer.active ? "Active" : "Inactive") : "Active");
  const [stapler, setStapler] = useState(printer?.stapler ? "Yes" : "No");
  const [fmt, setFmt] = useState<PrintFormat>(printer?.defaults ?? NEW_PRINTER_DEFAULTS);

  const set = (patch: Partial<PrintFormat>) => setFmt((f) => ({ ...f, ...patch }));
  const valid = name.trim().length > 0 && model.trim().length > 0;
  const save = () =>
    valid &&
    onSave(printer?.id ?? "p" + Date.now().toString(36), {
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
        <Head title={printer ? "Edit printer" : "Add a printer"} sub="What it is, and what a job sent to it uses unless the request says otherwise." onClose={onClose} />

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

        <Actions valid={valid} why="A printer needs a name and a model." onSave={save} onClose={onClose} label={printer ? "Save changes" : "Add printer"} />
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
  /** Absent when mapping a new centre's printers. */
  mapping?: CentrePrinter;
  centres: string[];
  printers: Printer[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<CentrePrinter>) => void;
}) {
  const [centre, setCentre] = useState(mapping?.centre ?? centres[0] ?? "");
  const [chosen, setChosen] = useState<string[]>(mapping?.printers ?? []);
  const [status, setStatus] = useState(mapping ? (mapping.active ? "Active" : "Inactive") : "Active");

  const printerOptions: PickerOption[] = printers.map((p) => ({
    id: p.name,
    label: p.name,
    meta: p.model + " · " + p.centre,
    initials: p.model.slice(0, 2).toUpperCase(),
  }));

  // The default has to be one of the mapped printers, or a job has nowhere to go.
  const [defaultPrinter, setDefaultPrinter] = useState(mapping?.defaultPrinter ?? "");
  const effectiveDefault = chosen.includes(defaultPrinter) ? defaultPrinter : chosen[0] ?? "";

  const valid = chosen.length > 0;
  const save = () => valid && onSave(mapping?.id ?? "cp" + Date.now().toString(36), { centre, printers: chosen, defaultPrinter: effectiveDefault, active: status === "Active" });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(90vh, 880px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={mapping ? "Edit centre printers" : "Map a centre's printers"} sub="Which printers a centre can send to. Any tutor may send to any printer mapped here." onClose={onClose} />

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

        <Actions valid={valid} why="Map at least one printer to the centre." onSave={save} onClose={onClose} label={mapping ? "Save changes" : "Add mapping"} />
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

export function EditTutorModal({ tutor, onClose, onSave }: { /** Absent when adding a new tutor. */ tutor?: StaffMember; onClose: () => void; onSave: (id: string, patch: Partial<StaffMember>) => void }) {
  const [name, setName] = useState(tutor?.name ?? "");
  const [email, setEmail] = useState(tutor?.email ?? "");
  const [phone, setPhone] = useState(tutor?.phone ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState(tutor?.status === "on_leave" ? "On leave" : "Active");

  const mismatch = pw.length > 0 && pw !== pw2;
  const valid = name.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0 && !mismatch && (!!tutor || pw.length > 0);
  const initials = name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const save = () =>
    valid &&
    onSave(tutor?.id ?? "st" + Date.now().toString(36), {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: status === "Active" ? "active" : "on_leave",
      ...(tutor ? {} : { initials, role: "Tutor", duties: "both", centres: [], colour: "var(--accent-teal)" }),
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(620px, calc(100vw - 32px))", maxHeight: "min(90vh, 820px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={tutor ? "Edit tutor" : "Add a tutor"} sub="Their details and whether they can sign in." onClose={onClose} />
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
          <PasswordField label={tutor ? "Set a new password" : "Set a password"} value={pw} onChange={setPw} />
          <span>
            <PasswordField label="Confirm password" value={pw2} onChange={setPw2} />
            {mismatch && <span style={{ display: "block", fontSize: 11, color: "var(--danger-500)", marginTop: 5 }}>The two passwords do not match.</span>}
          </span>
        </Row>
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
          {tutor ? "Left blank, the tutor keeps the password they have." : "A new tutor needs a password to sign in with."}
        </div>
        <Actions
          valid={valid}
          why={mismatch ? "The two passwords do not match." : tutor ? "A tutor needs a name, an email and a phone number." : "A tutor needs a name, an email, a phone number and a password."}
          onSave={save}
          onClose={onClose}
          label={tutor ? "Save changes" : "Add tutor"}
        />
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
  /** Absent when enrolling a new student. */
  student?: AdminStudent;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(student?.name ?? "");
  const [year, setYear] = useState(student?.year ?? "Year 7");
  const [email, setEmail] = useState(student?.email ?? "");
  const [parent, setParent] = useState(student?.parent ?? "");
  const [phone, setPhone] = useState(student?.parentPhone ?? "");
  const [parentEmail, setParentEmail] = useState(student?.parentEmail ?? "");
  const [status, setStatus] = useState(student ? (student.status === "active" ? "Active" : student.status === "trial" ? "Trial" : "Withdrawn") : "Trial");

  const valid = name.trim().length > 0 && parent.trim().length > 0;
  const save = () =>
    valid &&
    onSave(student?.name ?? name.trim(), {
      name: name.trim(),
      year,
      email: email.trim(),
      parent: parent.trim(),
      parentPhone: phone.trim(),
      parentEmail: parentEmail.trim(),
      status: status === "Active" ? "active" : status === "Trial" ? "trial" : "withdrawn",
      ...(student ? {} : { initials: name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase(), classNames: [], centre: "Online", delivery: "online", attendance: 100 }),
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(620px, calc(100vw - 32px))", maxHeight: "min(90vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={student ? "Edit student" : "Enrol a student"} sub="Their details and who the office rings about them." onClose={onClose} />
        <Row>
          <span>
            <Label required>Student name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
          {sel("Year", year, ["Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"], setYear, true)}
        </Row>
        <Row cols="1fr">
          <span>
            <Label>Student email</Label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
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
        <Row cols="1fr">
          <span>
            <Label>Parent or guardian email</Label>
            <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row>{sel("Status", status, ["Active", "Trial", "Withdrawn"], setStatus)}</Row>
        <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
          Which classes a student is in is set on the class itself, not here.
        </div>
        <Actions valid={valid} why="A student needs a name and a parent or guardian." onSave={save} onClose={onClose} label={student ? "Save changes" : "Enrol student"} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const IC3 = {
  layers: "M12 2 2 8l10 6 10-6-10-6Zm0 13.5L4.2 10.8 2 12l10 6 10-6-2.2-1.2L12 15.5Z",
  cal: "M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v11H5V9Z",
  book: "M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3V4Zm3 14h9V7a1 1 0 0 0-1-1H6v12.2A3 3 0 0 1 7 18Z",
  edit: "M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
  bin: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z",
};

/** One tutor's subjects at one centre, on a set of dates. */
export interface Selection {
  tutor: string;
  centre: string;
  subjects: string[];
  dates: string[];
  active: boolean;
}

function Chip({ label, tone, onRemove }: { label: string; tone: "date" | "subject"; onRemove?: () => void }) {
  const c = tone === "date" ? { color: "var(--brand-700)", bg: "rgba(0,157,255,.1)" } : { color: "var(--accent-purple)", bg: "rgba(122,90,248,.13)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: c.bg, color: c.color, borderRadius: 980, padding: onRemove ? "3px 5px 3px 10px" : "4px 10px", fontSize: 11, fontWeight: 700, flex: "none" }}>
      {label}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={"Remove " + label}
          onClick={onRemove}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRemove();
            }
          }}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: "50%", background: "rgba(0,32,63,.08)", cursor: "pointer" }}
        >
          <Icon path={IC.close} size={8} />
        </span>
      )}
    </span>
  );
}

const CAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/**
 * A month grid for picking every session date at once, instead of one date
 * plus a click each time - a term is usually a dozen Wednesdays, not one.
 * Dates are matched and stored as the same short label ("21 Jul") the rest of
 * a selection already uses, so a click here and a click to remove a chip stay
 * in sync with each other.
 */
function SessionCalendar({ selected, onToggle }: { selected: string[]; onToggle: (label: string) => void }) {
  // Open on the month the selection already sits in, so editing a run of
  // August dates does not start three clicks away from them.
  const [view, setView] = useState(() => {
    const first = selected[0] ? new Date(selected[0] + " 2026") : null;
    return first && !Number.isNaN(first.getTime()) ? new Date(first.getFullYear(), first.getMonth(), 1) : new Date(2026, 6, 1);
  });
  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first grid; Date.getDay() is Sunday-first.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))];

  return (
    <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} aria-label="Previous month" className="btn-ghost press" style={{ width: 28, height: 28, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: 15, fontWeight: 700, color: "var(--fg2)" }}>
          ‹
        </button>
        <span style={{ fontSize: 12, fontWeight: 800 }}>{CAL_MONTHS[month]} {year}</span>
        <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} aria-label="Next month" className="btn-ghost press" style={{ width: 28, height: 28, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: 15, fontWeight: 700, color: "var(--fg2)" }}>
          ›
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, fontSize: 10, fontWeight: 700, color: "var(--fg4)", textAlign: "center", marginBottom: 4 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const label = dayLabel(d);
          const on = selected.includes(label);
          return (
            <button
              type="button"
              key={i}
              onClick={() => onToggle(label)}
              aria-pressed={on}
              aria-label={(on ? "Remove " : "Add ") + label}
              className="press"
              style={{ height: 30, borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, background: on ? "var(--accent-teal)" : "transparent", color: on ? "#fff" : "var(--fg2)" }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Class selection: which subjects a tutor covers at a centre, and on which
 * dates. The live form builds these one at a time and lists what has been built
 * beside the form, which is right - a term is several of these, and losing the
 * list while you add the next one is what makes the screen hard. This keeps
 * that shape and drops its "center003" ids, which name nothing to a person.
 */
export function EditClassSelectionModal({
  selection,
  tutors,
  centres,
  subjects,
  onClose,
  onSave,
  onAddAll,
}: {
  /** Absent when adding new selections. */
  selection?: Selection & { id: string };
  tutors: string[];
  centres: string[];
  subjects: string[];
  onClose: () => void;
  onSave?: (id: string, patch: Partial<Selection>) => void;
  /** Used instead of onSave when adding - every selection built in this sitting is created at once. */
  onAddAll?: (rows: Selection[]) => void;
}) {
  // Everything built so far. Editing an existing row starts with it in the list.
  const [built, setBuilt] = useState<Selection[]>(selection ? [{ ...selection }] : []);
  const [editingAt, setEditingAt] = useState<number | null>(null);

  const [tutor, setTutor] = useState(tutors[0] ?? "");
  const [centre, setCentre] = useState(centres[0] ?? "");
  const [subs, setSubs] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const reset = () => {
    setTutor(tutors[0] ?? "");
    setCentre(centres[0] ?? "");
    setSubs([]);
    setDates([]);
    setActive(true);
    setEditingAt(null);
  };

  const toggleDate = (label: string) => setDates((d) => (d.includes(label) ? d.filter((x) => x !== label) : [...d, label]));

  const canAdd = tutor && centre && subs.length > 0 && dates.length > 0;
  const addSelection = () => {
    if (!canAdd) return;
    const next: Selection = { tutor, centre, subjects: subs, dates, active };
    setBuilt((b) => (editingAt === null ? [...b, next] : b.map((x, i) => (i === editingAt ? next : x))));
    reset();
  };

  const loadForEdit = (i: number) => {
    const sel = built[i];
    setTutor(sel.tutor);
    setCentre(sel.centre);
    setSubs(sel.subjects);
    setDates(sel.dates);
    setActive(sel.active);
    setEditingAt(i);
  };

  // Editing an existing row: the row being edited is the first selection, and
  // only it saves - the rest are new ones the office built in this sitting,
  // which a prototype cannot create from an edit dialog. Adding: every
  // selection built in this sitting is created.
  const valid = built.length > 0;
  const save = () => {
    if (!valid) return;
    if (selection) onSave?.(selection.id, built[0]);
    else onAddAll?.(built);
  };

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(880px, calc(100vw - 32px))", maxHeight: "min(90vh, 900px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={selection ? "Edit class selection" : "Add a class selection"} sub="Which subjects a tutor covers at a centre, and on which dates." onClose={onClose} />

        <div className="ev-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
          {/* ---- the form ---- */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon path={IC3.layers} size={15} style={{ color: "var(--brand-600)" }} />
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>{editingAt === null ? "New selection" : "Selection " + (editingAt + 1)}</span>
            </div>

            <Row cols="1fr">{sel("Tutor", tutor, tutors, setTutor, true)}</Row>
            <Row cols="1fr">{sel("Centre", centre, centres, setCentre, true)}</Row>

            <Row cols="1fr">
              <span>
                <Label required>Subjects</Label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !subs.includes(e.target.value)) setSubs((x) => [...x, e.target.value]);
                  }}
                  className="field"
                  style={{ width: "100%", height: 44, boxSizing: "border-box" }}
                  aria-label="Add a subject"
                >
                  <option value="">Add a subject</option>
                  {subjects.filter((x) => !subs.includes(x)).map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
                {subs.length > 0 && (
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {subs.map((x) => (
                      <Chip key={x} label={x} tone="subject" onRemove={() => setSubs((v) => v.filter((y) => y !== x))} />
                    ))}
                  </span>
                )}
              </span>
            </Row>

            <Row cols="1fr">
              <span>
                <Label required>Session dates</Label>
                <span style={{ fontSize: 11, color: "var(--fg4)", display: "block", marginBottom: 8 }}>Click every date this runs on - a term is usually several at once.</span>
                {/* Re-keyed per selection so loading one for editing re-opens the calendar on its own month. */}
                <SessionCalendar key={editingAt ?? "new"} selected={dates} onToggle={toggleDate} />
                {dates.length > 0 && (
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {dates.map((x) => (
                      <Chip key={x} label={x} tone="date" onRemove={() => setDates((v) => v.filter((y) => y !== x))} />
                    ))}
                  </span>
                )}
              </span>
            </Row>

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer" }}>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label="Active"
                onClick={() => setActive((v) => !v)}
                className="press"
                style={{ width: 46, height: 27, borderRadius: 980, border: "none", cursor: "pointer", flex: "none", padding: 3, background: active ? "var(--accent-teal)" : "rgba(0,32,63,.18)", transition: "background .2s ease" }}
              >
                <span style={{ display: "block", width: 21, height: 21, borderRadius: "50%", background: "#fff", transform: active ? "translateX(19px)" : "translateX(0)", transition: "transform .2s cubic-bezier(.16,1,.3,1)" }} />
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Active</span>
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={addSelection} disabled={!canAdd} className="btn-primary press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7, opacity: canAdd ? 1 : 0.5 }}>
                <Icon path={IC3.plus} size={13} />
                {editingAt === null ? "Add selection" : "Update selection"}
              </button>
              <button onClick={reset} className="btn-ghost press ev-tap-h" style={{ height: 42, padding: "0 16px", borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>
                Reset
              </button>
            </div>
          </div>

          {/* ---- what has been built ---- */}
          <div style={{ minWidth: 0, borderLeft: "1px solid rgba(0,32,63,.08)", paddingLeft: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800 }}>Selections</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: "var(--brand-500)", borderRadius: 980, padding: "2px 8px" }}>{built.length}</span>
            </div>

            {built.length === 0 && <div style={{ fontSize: 12, color: "var(--fg4)", lineHeight: 1.55 }}>Nothing added yet. Build one on the left.</div>}

            {built.map((b, i) => (
              <div key={i} style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "12px 13px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 800 }}>Selection {i + 1}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2 }}>{b.tutor} · {b.centre}</span>
                  </span>
                  <button onClick={() => loadForEdit(i)} aria-label={"Edit selection " + (i + 1)} className="btn-ghost press" style={{ width: 30, height: 30, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--fg2)", flex: "none" }}>
                    <Icon path={IC3.edit} size={13} />
                  </button>
                  {/* The row being edited is the reason this modal is open, so it
                      cannot be removed from inside it - delete it from the table. */}
                  {i > 0 && (
                    <button onClick={() => setBuilt((v) => v.filter((_, j) => j !== i))} aria-label={"Remove selection " + (i + 1)} className="btn-ghost press" style={{ width: 30, height: 30, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--danger-500)", flex: "none" }}>
                      <Icon path={IC3.bin} size={13} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)" }}>
                  <Icon path={IC3.cal} size={12} />
                  DATES
                  <span style={{ fontWeight: 800, color: "var(--brand-600)" }}>{b.dates.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {b.dates.map((d) => (
                    <Chip key={d} label={d} tone="date" />
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,32,63,.06)", fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: "var(--fg4)" }}>
                  <Icon path={IC3.book} size={12} />
                  SUBJECTS
                  <span style={{ fontWeight: 800, color: "var(--accent-purple)" }}>{b.subjects.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {b.subjects.map((x) => (
                    <Chip key={x} label={x} tone="subject" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Actions valid={valid} why="Add at least one selection." onSave={save} onClose={onClose} label={selection ? "Save changes" : built.length > 1 ? "Add " + built.length + " selections" : "Add selection"} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const TERM_STATES = ["ongoing", "upcoming", "finished"];
const SUBJECT_AREAS = ["Mathematics", "English", "Science", "Humanities"];
const YEARS = ["Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"];

export function EditTermModal({ term, onClose, onSave }: { /** Absent when adding a new term. */ term?: Term; onClose: () => void; onSave: (id: string, patch: Partial<Term>) => void }) {
  const [name, setName] = useState(term?.name ?? "");
  const [start, setStart] = useState(term?.start ?? "");
  const [end, setEnd] = useState(term?.end ?? "");
  const [weeks, setWeeks] = useState(term?.weeks ?? 10);
  const [state, setState] = useState<string>(term?.state ?? "upcoming");

  const valid = name.trim().length > 0 && start.trim().length > 0 && end.trim().length > 0 && weeks > 0;
  const save = () => valid && onSave(term?.id ?? "t" + Date.now().toString(36), { name: name.trim(), start: start.trim(), end: end.trim(), weeks, state: state as Term["state"] });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(620px, calc(100vw - 32px))", maxHeight: "min(88vh, 760px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={term ? "Edit term" : "Add a term"} sub="The dates everything else is planned against." onClose={onClose} />
        <Row cols="1fr">
          <span>
            <Label required>Term name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
        </Row>
        <Row>
          <span>
            <Label required>Starts</Label>
            <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="e.g. 20 Jul 2026" aria-label="Term start" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
          <span>
            <Label required>Ends</Label>
            <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="e.g. 25 Sep 2026" aria-label="Term end" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row>
          <span>
            <Label required>Weeks</Label>
            <input type="number" min={1} max={20} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
          {sel("State", state, TERM_STATES, setState)}
        </Row>
        <Actions valid={valid} why="A term needs a name, both dates and a length." onSave={save} onClose={onClose} label={term ? "Save changes" : "Add term"} />
      </div>
    </Modal>
  );
}

/**
 * A year group's subjects are not stored on the group - they are whichever
 * Subjects rows point their own year level back at it. So "choosing the
 * subjects" here means reassigning subjects' year level, not editing a list
 * that lives on the group itself.
 */
export function EditYearGroupModal({
  group,
  subjects,
  onSetSubjectYear,
  onClose,
  onSave,
}: {
  /** Absent when adding a new year group. */
  group?: YearGroup;
  subjects: SubjectRow[];
  /** Moves a subject into (or out of) this year group by changing its year level. */
  onSetSubjectYear: (subjectId: string, year: string) => void;
  onClose: () => void;
  onSave: (id: string, patch: Partial<YearGroup>) => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [year, setYear] = useState(group?.year ?? YEARS[1]);
  const [status, setStatus] = useState(group ? (group.active ? "Active" : "Inactive") : "Active");
  const [addSubject, setAddSubject] = useState("");
  /**
   * Subject moves are held here until Save, not written on click. The dialog
   * offers Save and Cancel, so a change made inside it has to be undoable by
   * Cancel like every other field.
   */
  const [moves, setMoves] = useState<Record<string, string>>({});
  const yearOf = (s: SubjectRow) => moves[s.id] ?? s.year;

  const valid = name.trim().length > 0;
  const save = () => {
    if (!valid) return;
    for (const [subjectId, y] of Object.entries(moves)) onSetSubjectYear(subjectId, y);
    onSave(group?.id ?? "yg" + Date.now().toString(36), { name: name.trim(), year, active: status === "Active" });
  };

  const inGroup = subjects.filter((s) => yearOf(s) === year);
  const notInGroup = subjects.filter((s) => yearOf(s) !== year);

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(88vh, 760px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={group ? "Edit year group" : "Add a year group"} sub="A cohort, the year level it sits at, and which subjects belong to it." onClose={onClose} />
        <Row cols="1fr">
          <span>
            <Label required>Name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
        </Row>
        <Row>
          {sel("Year level", year, YEARS, setYear, true)}
          {sel("Status", status, STATUS, setStatus)}
        </Row>

        <Row cols="1fr">
          <span>
            <Label>Subjects in this year group</Label>
            {inGroup.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--fg4)", lineHeight: 1.55 }}>No subject points at {year} yet. Add one below.</div>
            ) : (
              <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {inGroup.map((s) => (
                  <Chip key={s.id} label={s.name} tone="subject" onRemove={() => setMoves((m) => ({ ...m, [s.id]: "" }))} />
                ))}
              </span>
            )}
            {notInGroup.length > 0 && (
              <select
                value={addSubject}
                onChange={(e) => {
                  if (e.target.value) {
                    setMoves((m) => ({ ...m, [e.target.value]: year }));
                    setAddSubject("");
                  }
                }}
                className="field"
                style={{ width: "100%", height: 44, boxSizing: "border-box", marginTop: 8 }}
                aria-label="Move a subject into this year group"
              >
                <option value="">Move a subject into this year group</option>
                {notInGroup.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} (currently {yearOf(s) || "unassigned"})</option>
                ))}
              </select>
            )}
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 6, lineHeight: 1.5 }}>
              Removing a subject here does not delete it - it just leaves it unassigned until you move it into another year group.
              Subject moves apply when you save.
            </div>
          </span>
        </Row>

        <Actions valid={valid} why="A year group needs a name." onSave={save} onClose={onClose} label={group ? "Save changes" : "Add year group"} />
      </div>
    </Modal>
  );
}

/**
 * One form for a subject, whether it is being created or corrected. Two forms
 * for one record is how the two drift apart, and a subject has three fields.
 */
export function SubjectModal({
  subject,
  onClose,
  onSave,
}: {
  /** Absent when adding a new one. */
  subject?: SubjectRow;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(subject?.name ?? "");
  const [year, setYear] = useState(subject?.year ?? YEARS[1]);
  const [area, setArea] = useState<string>(subject?.area ?? SUBJECT_AREAS[0]);
  const [status, setStatus] = useState(subject ? (subject.active ? "Active" : "Inactive") : "Active");

  const valid = name.trim().length > 0;
  const save = () =>
    valid &&
    onSave(subject?.id ?? "sb-" + Date.now().toString(36), {
      name: name.trim(),
      year,
      area,
      active: status === "Active",
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(88vh, 660px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head
          title={subject ? "Edit subject" : "Add a subject"}
          sub="What it is called, the year it belongs to and the area it sits in."
          onClose={onClose}
        />
        <Row cols="1fr">
          <span>
            <Label required>Subject name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Year 9 Science" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
        </Row>
        <Row>
          {sel("Year level", year, YEARS, setYear, true)}
          {sel("Area", area, SUBJECT_AREAS, setArea, true)}
        </Row>
        <Row cols="1fr">{sel("Status", status, STATUS, setStatus)}</Row>
        <Actions valid={valid} why="A subject needs a name." onSave={save} onClose={onClose} label={subject ? "Save changes" : "Add subject"} />
      </div>
    </Modal>
  );
}

/**
 * A course category, whether it is being created or corrected. The description
 * is what makes a category mean something: "Upper school (Years 10 to 12)" is
 * a label, and a parent still has to be told what is in it.
 */
export function CourseCategoryModal({
  category,
  onClose,
  onSave,
}: {
  /** Absent when adding a new one. */
  category?: CourseCategory;
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState(category ? (category.active ? "Active" : "Inactive") : "Active");

  const valid = name.trim().length > 0 && description.trim().length > 0;
  const save = () =>
    valid &&
    onSave(category?.id ?? "cc-" + Date.now().toString(36), {
      name: name.trim(),
      description: description.trim(),
      active: status === "Active",
      // Nothing is in a brand new category until a course names it.
      ...(category ? {} : { courses: 0 }),
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(88vh, 640px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head
          title={category ? "Edit course category" : "Add a course category"}
          sub="How the catalogue is grouped for tutors and parents."
          onClose={onClose}
        />
        <Row cols="1fr">
          <span>
            <Label required>Category name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Upper school (Years 10 to 12)" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
        </Row>
        <Row cols="1fr">
          <span>
            <Label required>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What belongs in this category"
              aria-label="Description"
              className="field"
              style={{ width: "100%", minHeight: 66, boxSizing: "border-box", padding: "10px 12px", resize: "vertical" }}
            />
          </span>
        </Row>
        <Row cols="1fr">{sel("Status", status, STATUS, setStatus, true)}</Row>
        {category && (
          <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 8, lineHeight: 1.5 }}>
            How many courses sit in a category follows from the courses themselves, so it is not set here.
          </div>
        )}
        <Actions valid={valid} why="A category needs a name and a description." onSave={save} onClose={onClose} label={category ? "Save changes" : "Add category"} />
      </div>
    </Modal>
  );
}

/** One form for a course, whether it is being created or corrected. */
export function EditCourseModal({
  course,
  categories,
  onClose,
  onSave,
}: {
  /** Absent when adding a new course. */
  course?: CourseRow;
  categories: string[];
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(course?.name ?? "");
  const [shortName, setShortName] = useState(course?.shortName ?? "");
  const [category, setCategory] = useState(course?.category ?? categories[0] ?? "");
  const [year, setYear] = useState(course?.year ?? YEARS[1]);
  const [subs, setSubs] = useState<string[]>(course?.subjects ?? []);
  const [subjectInput, setSubjectInput] = useState("");
  const [weeks, setWeeks] = useState(course?.durationWeeks ?? 10);
  const [status, setStatus] = useState(course ? (course.active ? "Active" : "Inactive") : "Active");

  const addSubject = () => {
    const v = subjectInput.trim();
    if (v && !subs.includes(v)) setSubs((x) => [...x, v]);
    setSubjectInput("");
  };

  const valid = name.trim().length > 0 && shortName.trim().length > 0 && subs.length > 0 && weeks > 0;
  const save = () =>
    valid &&
    onSave(course?.id ?? "co" + Date.now().toString(36), {
      name: name.trim(),
      shortName: shortName.trim(),
      category,
      year,
      subjects: subs,
      durationWeeks: weeks,
      active: status === "Active",
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "min(90vh, 880px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={course ? "Edit course" : "Add a course"} sub="What a student enrols in. Classes are the sessions that run it." onClose={onClose} />
        <Row>
          <span>
            <Label required>Course name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Year 11 Chemistry ATAR" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
          <span>
            <Label required>Short name</Label>
            <input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="For example: Y11 Chem" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row>
          {sel("Category", category, categories, setCategory, true)}
          {sel("Year", year, YEARS, setYear, true)}
        </Row>
        <Row cols="1fr">
          <span>
            <Label required>Subjects</Label>
            <span style={{ display: "flex", gap: 8 }}>
              <input
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubject();
                  }
                }}
                placeholder="Type a subject and press Enter"
                aria-label="Add a subject"
                className="field"
                style={{ flex: 1, minWidth: 0, height: 44, boxSizing: "border-box" }}
              />
              <button type="button" onClick={addSubject} disabled={!subjectInput.trim()} className="btn-soft press ev-tap-h" style={{ height: 44, padding: "0 14px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, flex: "none", opacity: subjectInput.trim() ? 1 : 0.5 }}>
                <Icon path={IC3.plus} size={13} />
              </button>
            </span>
            {subs.length > 0 && (
              <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {subs.map((x) => (
                  <Chip key={x} label={x} tone="subject" onRemove={() => setSubs((v) => v.filter((y) => y !== x))} />
                ))}
              </span>
            )}
          </span>
        </Row>
        <Row>
          <span>
            <Label required>Length, in weeks</Label>
            <input type="number" min={1} max={20} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
          {sel("Status", status, STATUS, setStatus)}
        </Row>
        <Actions valid={valid} why="A course needs a name, a short name, at least one subject and a length." onSave={save} onClose={onClose} label={course ? "Save changes" : "Add course"} />
      </div>
    </Modal>
  );
}

/**
 * Which tutors teach a course. The course itself is fixed: this row IS that
 * course's mapping, so changing it here would silently rewrite a different
 * course's staffing rather than move this one.
 */
export function EditCourseTutorModal({
  mapping,
  courses,
  tutors,
  onClose,
  onSave,
}: {
  /** Absent when mapping a course that has no tutor row yet. */
  mapping?: CourseTutorMap;
  /** Courses with no mapping yet - only used when adding. */
  courses?: string[];
  tutors: string[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<CourseTutorMap>) => void;
}) {
  const [course, setCourse] = useState(mapping?.course ?? courses?.[0] ?? "");
  const [chosen, setChosen] = useState<string[]>(mapping?.tutors ?? []);
  const [status, setStatus] = useState(mapping ? (mapping.active ? "Active" : "Inactive") : "Active");

  const options: PickerOption[] = tutors.map((t) => {
    const member = STAFF.find((s) => s.name === t);
    return {
      id: t,
      label: t,
      meta: member ? (member.status === "on_leave" ? "On leave" : member.centres.join(", ")) : undefined,
      initials: member ? member.initials : t.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
      colour: member?.colour,
    };
  });

  const valid = course.trim().length > 0;
  const save = () => valid && onSave(mapping?.id ?? "ct" + Date.now().toString(36), { course, tutors: chosen, active: status === "Active" });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(600px, calc(100vw - 32px))", maxHeight: "min(88vh, 700px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head title={mapping ? "Edit course tutors" : "Staff a course"} sub="Who teaches this course, and whether the mapping is live." onClose={onClose} />

        <Row cols="1fr">
          {mapping ? (
            <span>
              <Label>Course</Label>
              <div className="glass-control" style={{ display: "flex", alignItems: "center", height: 44, borderRadius: 12, padding: "0 13px", background: "rgba(0,32,63,.04)", color: "var(--fg3)", fontSize: 13, fontWeight: 600 }}>
                {mapping.course}
              </div>
              <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 4 }}>
                This row is that course. To staff a different one, edit its own row.
              </span>
            </span>
          ) : (
            sel("Course", course, courses ?? [], setCourse, true)
          )}
        </Row>

        <Row cols="1fr">
          <PeoplePicker
            label="Tutors"
            options={options}
            value={chosen}
            onChange={setChosen}
            placeholder="Nobody assigned"
            emptyHint="A course with no tutor does not appear in anyone's portal."
          />
        </Row>

        <Row cols="1fr">{sel("Status", status, STATUS, setStatus, true)}</Row>

        <Actions valid={valid} why="Pick which course this is staffing." onSave={save} onClose={onClose} label={mapping ? "Save changes" : "Add mapping"} />
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const IC4 = {
  bin: "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z",
  tick: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
};

/**
 * A subject and the Drive folder its materials live in. This map serves BOTH
 * kinds of class: an in-person booklet request prints from it, and an online
 * tutor sending work sees what it holds for their subject and year.
 */
export function SubjectDriveModal({
  map,
  subjects,
  onClose,
  onSave,
}: {
  /** Absent when mapping a new folder. */
  map?: DriveMap;
  subjects: string[];
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [label, setLabel] = useState(map?.label ?? "");
  const [folder, setFolder] = useState(map?.folder ?? "");
  const [status, setStatus] = useState(map ? (map.active ? "Active" : "Inactive") : "Active");

  const valid = label.trim().length > 0 && folder.trim().length > 0;
  const save = () => valid && onSave(map?.id ?? "sd-" + Date.now().toString(36), { label, folder: folder.trim(), active: status === "Active" });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(660px, calc(100vw - 32px))", maxHeight: "min(88vh, 620px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head
          title={map ? "Edit subject Drive map" : "Map a folder to a subject"}
          sub="Where a subject's materials live. In-person requests print from here, and online tutors send from it."
          onClose={onClose}
        />
        <Row>
          <span>
            <Label required>Subject</Label>
            <select value={label} onChange={(e) => setLabel(e.target.value)} className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} aria-label="Subject">
              <option value="">Choose a subject</option>
              {[...new Set([...(label ? [label] : []), ...subjects])].map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </span>
          <span>
            <Label required>Drive folder link</Label>
            <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." aria-label="Drive folder link" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
          </span>
        </Row>
        <Row cols="1fr">{sel("Status", status, STATUS, setStatus)}</Row>
        <Actions valid={valid} why="Pick a subject and paste its folder link." onSave={save} onClose={onClose} label={map ? "Save changes" : "Map the folder"} />
      </div>
    </Modal>
  );
}

/**
 * A booklet folder and the tutors it is shared with.
 *
 * The per-tutor "allow all students" flag is the part that matters: it decides
 * whether a tutor may hand the whole folder to a class or only individual files
 * from it, and it is set per person, so it belongs in a row per person rather
 * than as one switch on the folder.
 */
export function BookletDriveModal({
  map,
  tutors,
  purposeOf,
  title,
  onClose,
  onSave,
}: {
  /** Absent when mapping a new folder. */
  map?: BookletDriveMap;
  tutors: { name: string; email: string; initials: string; colour?: string }[];
  /** Drive access labels each folder with what it is for; booklet maps do not. */
  purposeOf?: boolean;
  title?: { add: string; edit: string; sub: string };
  onClose: () => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const [purpose, setPurpose] = useState(map?.purpose ?? "");
  const [folder, setFolder] = useState(map?.folder ?? "");
  const [status, setStatus] = useState(map ? (map.active ? "Active" : "Inactive") : "Active");
  const [rows, setRows] = useState<BookletDriveMap["tutors"]>(map?.tutors ?? []);

  const chosen = rows.map((r) => r.name);
  const options: PickerOption[] = tutors.map((t) => ({ id: t.name, label: t.name, meta: t.email, initials: t.initials, colour: t.colour }));

  // Picking in the chip field and the rows below are the same list, so adding a
  // tutor gives them a row and removing one takes their permission with it.
  const setChosen = (next: string[]) =>
    setRows((prev) =>
      next.map((name) => prev.find((r) => r.name === name) ?? { name, email: tutors.find((t) => t.name === name)?.email ?? "", allowAllStudents: true })
    );

  const valid = folder.trim().length > 0 && rows.length > 0 && (!purposeOf || purpose.trim().length > 0);
  const save = () =>
    valid &&
    onSave(map?.id ?? (purposeOf ? "dd-" : "bd-") + Date.now().toString(36), {
      folder: folder.trim(),
      tutors: rows,
      active: status === "Active",
      ...(purposeOf ? { purpose: purpose.trim() } : {}),
    });

  return (
    <Modal onClose={onClose} labelledBy="masteredit-title" panelStyle={{ width: "min(720px, calc(100vw - 32px))", maxHeight: "min(90vh, 860px)", overflowY: "auto" }}>
      <div className="ev-modal-pad" style={{ padding: "20px 22px" }}>
        <Head
          title={map ? (title?.edit ?? "Edit booklet Drive map") : (title?.add ?? "Map a booklet folder")}
          sub={title?.sub ?? "Extra booklets for online tutors, beyond what their subject already gives them."}
          onClose={onClose}
        />
        {purposeOf && (
          <Row cols="1fr">
            <span>
              <Label required>What the folder is for</Label>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="For example: Chemistry booklets" aria-label="What the folder is for" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} />
            </span>
          </Row>
        )}
        <Row>
          <span>
            <Label required>Drive link</Label>
            <input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." aria-label="Drive link" className="field" style={{ width: "100%", height: 44, boxSizing: "border-box" }} autoFocus />
          </span>
          {sel("Status", status, STATUS, setStatus)}
        </Row>

        <Row cols="1fr">
          <PeoplePicker
            label="Tutors"
            required
            options={options}
            value={chosen}
            onChange={setChosen}
            placeholder="Choose who may take booklets from this folder"
            emptyHint="A folder shared with nobody is not shared."
          />
        </Row>

        {rows.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8 }}>What each of them may do</div>
            <div style={{ border: "1px solid rgba(0,32,63,.08)", borderRadius: 14, background: "rgba(255,255,255,.66)", padding: "6px 14px 10px" }}>
              {rows.map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderTop: "1px solid rgba(0,32,63,.06)" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 700 }}>{r.name}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--fg4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</span>
                  </span>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none", cursor: "pointer", fontSize: 11.5, color: "var(--fg3)" }}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={r.allowAllStudents}
                      aria-label={"Let " + r.name + " give this folder to all their students"}
                      onClick={() => setRows((v) => v.map((x) => (x.name === r.name ? { ...x, allowAllStudents: !x.allowAllStudents } : x)))}
                      className="press"
                      style={{ width: 22, height: 22, borderRadius: 6, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: r.allowAllStudents ? "none" : "1.5px solid rgba(0,32,63,.18)", background: r.allowAllStudents ? "var(--brand-500)" : "transparent", color: "#fff" }}
                    >
                      {r.allowAllStudents && <Icon path={IC4.tick} size={13} />}
                    </button>
                    <span className="ev-only-desktop">All their students</span>
                  </label>
                  <button
                    onClick={() => setRows((v) => v.filter((x) => x.name !== r.name))}
                    aria-label={"Remove " + r.name}
                    className="btn-ghost press"
                    style={{ width: 32, height: 32, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--danger-500)", flex: "none" }}
                  >
                    <Icon path={IC4.bin} size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--fg4)", marginTop: 7, lineHeight: 1.5 }}>
              Ticked, a tutor can give the whole folder to a class. Unticked, they hand out single booklets from it.
            </div>
          </div>
        )}

        <Actions
          valid={valid}
          why={purposeOf && !purpose.trim() ? "Say what the folder is for." : "Paste the folder link and share it with at least one tutor."}
          onSave={save}
          onClose={onClose}
          label={map ? "Save changes" : purposeOf ? "Grant access" : "Map the folder"}
        />
      </div>
    </Modal>
  );
}
