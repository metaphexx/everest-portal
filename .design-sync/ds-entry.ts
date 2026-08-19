// Explicit design-system entry.
//
// everest-portal is an application, not a library, so it has no dist/ entry to
// point the converter at. Synthesising one by globbing src/ pulled in all 95
// files including every app page, and `export *` across modules that share a
// name (Icon, ICON) silently drops the ambiguous ones - ESM excludes them.
//
// This entry names exactly the components that render without app state:
// no providers, no router, no localStorage stores.

export { MasterTable, PILL } from "../components/admin/MasterTable";
export { MonthCalendar, DayList } from "../components/admin/MonthCalendar";
export { RequestDetail } from "../components/admin/RequestDetail";
export { ScheduleClassModal } from "../components/admin/ScheduleClassModal";
export { AssessmentTable, AverageChip, UpcomingAssessments } from "../components/portal/AssessmentTable";
export { Background } from "../components/portal/Background";
export { PdfPreviewModal } from "../components/portal/PdfPreviewModal";
export { BookletStatsPanel } from "../components/tutor/BookletStatsPanel";
export { OfficeVisibilityNotice } from "../components/tutor/OfficeVisibilityNotice";
export { ElliotMark } from "../components/ui/ElliotMark";
export { Icon } from "../components/ui/Icon";
export { ImageSlot } from "../components/ui/ImageSlot";
export { LineChart } from "../components/ui/LineChart";
export { Loader } from "../components/ui/Loader";
export { Modal } from "../components/ui/Modal";

// Seed data helpers. camelCase, so component discovery skips them - they exist
// so previews can compose from the repo's OWN data instead of inlining copies
// that silently rot when the source changes.
export { seedRequests } from "../lib/tutor-data";
export { allSessions } from "../lib/admin-schedule";
