// Two portals, one codebase.
//
// The office manager sees everything. Print room staff see the parts of the job
// that end at a printer: the dashboard, booklet requests, print history, and
// which classes need booklets. They have no reason to open tutor records,
// student records, shared files, safeguarding or the master data, and the
// safest way to keep them out is for those screens not to exist in their nav
// and not to be routed at all.
//
// The role also changes the language: the same request is "waiting on your
// approval" to a manager and "to print" to the print room.

import React, { createContext, useContext } from "react";

export type AdminRole = "office" | "print";

const Ctx = createContext<AdminRole>("office");

export function RoleProvider({ role, children }: { role: AdminRole; children: React.ReactNode }) {
  return <Ctx.Provider value={role}>{children}</Ctx.Provider>;
}

export function useRole(): AdminRole {
  return useContext(Ctx);
}

/** Route prefix for the current role, so shared components link correctly. */
export function useBase(): string {
  return useRole() === "print" ? "/staff" : "/admin";
}

export const ROLE_META: Record<AdminRole, { portal: string; person: string; initials: string; label: string; accent: string }> = {
  office: { portal: "OFFICE PORTAL", person: "Nadia Rahman", initials: "NR", label: "Everest Office", accent: "var(--accent-teal)" },
  print: { portal: "PRINT ROOM", person: "Sam Whitely", initials: "SW", label: "Print room", accent: "var(--accent-navy-blue)" },
};
