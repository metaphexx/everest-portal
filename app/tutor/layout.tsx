import type { Metadata } from "next";
import { TutorProvider } from "@/lib/tutor-store";
import { MessagingProvider } from "@/lib/messaging";
import { ClassroomProvider } from "@/lib/classroom";
import { TutorShell } from "@/components/tutor/TutorShell";

export const metadata: Metadata = {
  title: "Everest Tutor Portal",
  description: "Everest Tutoring tutor portal",
};

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TutorProvider>
      <MessagingProvider>
        <ClassroomProvider>
          <TutorShell>{children}</TutorShell>
        </ClassroomProvider>
      </MessagingProvider>
    </TutorProvider>
  );
}
