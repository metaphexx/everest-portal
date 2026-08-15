// Notification items, shared so the desktop header and the phone account menu
// show the same list from one place rather than two drifting copies.

export interface NotifItem {
  id: string;
  dot: string;
  title: string;
  meta: string;
  href: string;
  read: boolean;
}

export const STUDENT_NOTIFS: NotifItem[] = [
  { id: "classroom", dot: "var(--accent-violet)", title: "Priya Rao replied to your post in the Chemistry classroom", meta: "Classroom · 1 hour ago", href: "/classroom/chem11", read: false },
  { id: "grade", dot: "var(--success-500)", title: "Stoichiometry Set 5 was graded: A", meta: "My Grades · yesterday", href: "/grades", read: false },
  { id: "worksheet", dot: "var(--danger-500)", title: "Whole Numbers Topic Test is due Saturday", meta: "Worksheets · 2 days away", href: "/courses", read: false },
  { id: "library", dot: "var(--brand-500)", title: "New notes added to Chemistry", meta: "Library · yesterday", href: "/library", read: false },
];

export const TUTOR_NOTIFS: NotifItem[] = [
  { id: "safeguard", dot: "var(--danger-500)", title: "Safeguarding alert: a message from Ruby Chen needs care", meta: "Messages · this morning", href: "/tutor/messages", read: false },
  { id: "classroom", dot: "var(--accent-violet)", title: "Ravi Shah posted a question in the Chemistry classroom", meta: "Classroom · 20 min ago", href: "/tutor/classroom/chem11", read: false },
  { id: "request", dot: "var(--success-500)", title: "REQ1782365660 was approved for printing", meta: "My Requests · 25 Jun", href: "/tutor/requests", read: false },
  { id: "outline", dot: "var(--brand-500)", title: "Maya Kapoor shared a Chemistry ATAR outline", meta: "Student Outlines · 28 Jun", href: "/tutor/outlines", read: false },
];

/** Office notifications. Each one is something a person has to act on. */
export const ADMIN_NOTIFS: NotifItem[] = [
  { id: "a-safeguard", dot: "var(--danger-500)", title: "Ruby Chen's message was flagged for wellbeing", meta: "Safeguarding · this morning", href: "/admin/safeguarding", read: false },
  { id: "a-request", dot: "var(--warn-500)", title: "Priya Rao requested booklets for Year 9 Science", meta: "Approvals · 1 Jul", href: "/admin/approvals", read: false },
  { id: "a-print", dot: "var(--brand-500)", title: "A Year 10 Foundations job failed at the Piara Waters printer", meta: "Print Queue · 30 Jun", href: "/admin/printing", read: false },
  { id: "a-trial", dot: "var(--success-500)", title: "Cooper Hall is on a trial that ends this week", meta: "Students · 29 Jun", href: "/admin/students", read: true },
];
