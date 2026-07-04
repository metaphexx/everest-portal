import { Outlet } from "react-router-dom";
import { TutorProvider } from "@/lib/tutor-store";
import { MessagingProvider } from "@/lib/messaging";
import { ClassroomProvider } from "@/lib/classroom";
import { TutorShell } from "@/components/tutor/TutorShell";

export default function TutorLayout() {
  return (
    <TutorProvider>
      <MessagingProvider>
        <ClassroomProvider>
          <TutorShell>
            <Outlet />
          </TutorShell>
        </ClassroomProvider>
      </MessagingProvider>
    </TutorProvider>
  );
}
