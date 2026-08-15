import { Outlet } from "react-router-dom";
import { AdminProvider } from "@/lib/admin-store";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleProvider } from "@/lib/admin-role";

export default function AdminLayout() {
  return (
    <RoleProvider role="office">
      <AdminProvider>
        <AdminShell>
          <Outlet />
        </AdminShell>
      </AdminProvider>
    </RoleProvider>
  );
}
