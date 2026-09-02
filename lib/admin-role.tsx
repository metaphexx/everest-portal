// Two office views, one codebase.
//
// The MANAGER sees everything: schedule, enrolments, master records, messages,
// files, safeguarding. The ADMIN role is the print desk: the dashboard (what is
// running, what is upcoming, what is to print), the booklet request queue (they
// approve and they print), print history, and which classes exist so a copy
// count can be checked. They have no reason to open tutor or student records,
// change an enrolment, answer a message or see the master data, and the safest
// way to keep them out is for those screens not to exist in their nav and not to
// be routed at all - see the route table in src/App.tsx.
//
// Internally the roles keep their original ids ("office" and "print") so the
// route prefixes and stored state stay stable; only the words a person sees
// changed when the views were named Manager and Admin.

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

export const ROLE_META: Record<
  AdminRole,
  {
    portal: string;
    person: string;
    initials: string;
    label: string;
    accent: string;
    email: string;
    phone: string;
    centre: string;
    /** The other view, for the demo's "view as" switch. */
    switchLabel: string;
    switchTo: string;
  }
> = {
  office: {
    portal: "MANAGER PORTAL",
    person: "Nadia Rahman",
    initials: "NR",
    label: "Manager",
    accent: "var(--accent-teal)",
    email: "office@everesttutoring.com.au",
    phone: "0421 118 460",
    centre: "Head office (Willetton)",
    switchLabel: "View as Admin",
    switchTo: "/staff",
  },
  print: {
    portal: "ADMIN PORTAL",
    person: "Sam Whitely",
    initials: "SW",
    label: "Admin",
    accent: "var(--accent-navy-blue)",
    email: "print@everesttutoring.com.au",
    phone: "0421 118 462",
    centre: "Harrisdale SHS",
    switchLabel: "View as Manager",
    switchTo: "/admin",
  },
};
