import { Outlet } from "react-router-dom";
import { AdminProvider } from "@/lib/admin-store";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout() {
  return (
    <AdminProvider>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminProvider>
  );
}
