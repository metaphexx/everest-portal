import { Outlet } from "react-router-dom";
import { PortalProvider } from "@/lib/store";
import { MessagingProvider } from "@/lib/messaging";
import { ClassroomProvider } from "@/lib/classroom";
import { PortalShell } from "@/components/portal/PortalShell";

export default function StudentLayout() {
  return (
    <PortalProvider>
      <MessagingProvider>
        <ClassroomProvider>
          <PortalShell>
            <Outlet />
          </PortalShell>
        </ClassroomProvider>
      </MessagingProvider>
    </PortalProvider>
  );
}
