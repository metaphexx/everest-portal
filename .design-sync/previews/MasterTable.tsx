import React from "react";
import { MasterTable } from "everest-portal";

const PILL = {
  active:   { label: "Active",   color: "var(--success-700)", bg: "rgba(34,160,91,.12)" },
  inactive: { label: "Inactive", color: "var(--fg4)",         bg: "rgba(0,32,63,.07)" },
  pending:  { label: "Waiting",  color: "var(--warn-700)",    bg: "rgba(245,166,35,.16)" },
};

const centres = [
  { id: "c1", name: "Harrisdale SHS", location: "Harrisdale, Western Australia", rooms: 3, active: true },
  { id: "c2", name: "Piara Waters",   location: "Piara Waters, Western Australia", rooms: 2, active: true },
  { id: "c3", name: "Willetton",      location: "Willetton, Western Australia",   rooms: 4, active: true },
  { id: "c4", name: "Canning Vale",   location: "Canning Vale, Western Australia", rooms: 2, active: false },
];

export const Centres = () => (
  <MasterTable
    rows={centres}
    idOf={(r) => r.id}
    statusOf={(r) => (r.active ? PILL.active : PILL.inactive)}
    columns={[
      { key: "n", label: "Centre",   render: (r) => <strong style={{ fontWeight: 700 }}>{r.name}</strong>, text: (r) => r.name },
      { key: "l", label: "Location", render: (r) => r.location, text: (r) => r.location, width: 280 },
      { key: "r", label: "Rooms",    render: (r) => r.rooms,    text: (r) => String(r.rooms) },
    ]}
    searchHint="Search centres by name or suburb"
    addLabel="Add a centre"
    onAdd={() => {}}
    onEdit={() => {}}
    onDelete={() => {}}
    onExport={() => {}}
    emptyTitle="No centres yet"
    emptyBody="A centre is a physical location that runs in-person classes and holds a printer."
  />
);

const systems = [
  { id: "s1", label: "Harrisdale front desk iMac", host: "HARRISDALE-FRONT", centre: "Harrisdale SHS", os: "macOS 15.2", ok: true },
  { id: "s2", label: "Piara Waters office PC",     host: "PIARA-OFFICE-01",  centre: "Piara Waters",  os: "Windows 11", ok: true },
  { id: "s3", label: "Not yet named",              host: "NEW-LAPTOP-04",    centre: null,            os: "Windows 11", ok: false },
];

export const WithoutActions = () => (
  <MasterTable
    rows={systems}
    idOf={(r) => r.id}
    statusOf={(r) => (r.ok ? PILL.active : PILL.pending)}
    columns={[
      { key: "s", label: "System", text: (r) => r.label, render: (r) => (
        <>
          <strong style={{ fontWeight: 700 }}>{r.label}</strong>
          <span style={{ display: "block", fontSize: 11, color: "var(--fg4)" }}>{r.host}</span>
        </>
      ) },
      { key: "c", label: "Centre", text: (r) => r.centre ?? "not mapped",
        render: (r) => r.centre ?? <span style={{ color: "var(--warn-700)" }}>Not mapped</span> },
      { key: "o", label: "Machine", render: (r) => r.os, text: (r) => r.os, minor: true },
    ]}
    searchHint="Search by system, centre or address"
    emptyTitle="No systems paired"
    emptyBody="Pair the front desk machine at each centre so print jobs reach the right printer."
  />
);

export const Empty = () => (
  <MasterTable
    rows={[]}
    idOf={(r: { id: string }) => r.id}
    columns={[{ key: "n", label: "Name", render: () => null }]}
    searchHint="Search printers"
    addLabel="Add a printer"
    onAdd={() => {}}
    emptyTitle="No printers yet"
    emptyBody="Add the printers at each centre so tutors can pick one when they request booklets."
  />
);
