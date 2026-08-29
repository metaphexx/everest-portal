// The print room's portal.
//
// Same shell, same components, a strict subset of the routes. Staff who only
// print never see tutor records, student records, shared files, safeguarding or
// the master data - not hidden behind a permission check in the UI, but absent
// from the route table for this layout entirely.

import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { AdminProvider } from "@/lib/admin-store";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleProvider } from "@/lib/admin-role";

export default function StaffLayout() {
  return (
    <RoleProvider role="print">
      <AdminProvider>
        <AdminShell>
          <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
        </AdminShell>
      </AdminProvider>
    </RoleProvider>
  );
}
