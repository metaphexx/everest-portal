import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { AdminProvider } from "@/lib/admin-store";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleProvider } from "@/lib/admin-role";

export default function AdminLayout() {
  return (
    <RoleProvider role="office">
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
