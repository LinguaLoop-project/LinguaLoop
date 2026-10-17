import type { NavGroup, ShellConfig } from "./shellConfig";

const k = (ns: string, part: string, key: string) => `${ns}.${part}.${key}`;

const studentGroups: NavGroup[] = [
  {
    items: [{ id: "today", icon: "sun", labelKey: k("student", "sidebar.items", "today"), to: "/student" }],
  },
  {
    titleKey: "student.sidebar.groups.learn",
    items: [
      { id: "lessons", icon: "library", labelKey: k("student", "sidebar.items", "lessons"), to: "/student/lessons" },
      { id: "dictation", icon: "headphones", labelKey: k("student", "sidebar.items", "dictation"), to: "/student/dictation", tone: "dictation" },
      { id: "shadowing", icon: "mic", labelKey: k("student", "sidebar.items", "shadowing"), to: "/student/shadowing", tone: "shadowing" },
      { id: "vocab", icon: "layers", labelKey: k("student", "sidebar.items", "vocab"), to: "/student/vocab", tone: "vocab" },
    ],
  },
  {
    titleKey: "student.sidebar.groups.mine",
    items: [
      { id: "mywords", icon: "bookmark", labelKey: k("student", "sidebar.items", "mywords"), to: "/student/mywords", tone: "vocab", badge: 8 },
      { id: "weakness", icon: "target", labelKey: k("student", "sidebar.items", "weakness"), to: "/student/weakness", tone: "assessment" },
      { id: "test", icon: "file-check", labelKey: k("student", "sidebar.items", "test"), to: "/student/test", tone: "assessment" },
    ],
  },
];

const instructorGroups: NavGroup[] = [
  {
    items: [{ id: "dashboard", icon: "layout-grid", labelKey: k("instructor", "sidebar.items", "dashboard"), to: "/instructor" }],
  },
  {
    titleKey: "instructor.sidebar.groups.content",
    items: [
      { id: "topics", icon: "folders", labelKey: k("instructor", "sidebar.items", "topics"), to: "/instructor/topics" },
      { id: "lessons", icon: "film", labelKey: k("instructor", "sidebar.items", "lessons"), to: "/instructor/lessons" },
      { id: "decks", icon: "layers", labelKey: k("instructor", "sidebar.items", "decks"), to: "/instructor/decks" },
    ],
  },
  {
    titleKey: "instructor.sidebar.groups.language",
    items: [
      { id: "cefr", icon: "bot", labelKey: k("instructor", "sidebar.items", "cefr"), to: "/instructor/cefr", badge: "12", badgeType: "warn" },
      { id: "dict", icon: "book-open-text", labelKey: k("instructor", "sidebar.items", "dict"), to: "/instructor/dict" },
      { id: "phoneme", icon: "audio-lines", labelKey: k("instructor", "sidebar.items", "phoneme"), to: "/instructor/phoneme" },
      { id: "qbank", icon: "file-check", labelKey: k("instructor", "sidebar.items", "qbank"), to: "/instructor/qbank" },
    ],
  },
  {
    titleKey: "instructor.sidebar.groups.tracking",
    items: [
      { id: "reports", icon: "flag", labelKey: k("instructor", "sidebar.items", "reports"), to: "/instructor/reports", badge: "3", badgeType: "bad" },
      { id: "audit", icon: "history", labelKey: k("instructor", "sidebar.items", "audit"), to: "/instructor/audit" },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    items: [{ id: "dashboard", icon: "layout-grid", labelKey: k("admin", "sidebar.items", "dashboard"), to: "/admin" }],
  },
  {
    titleKey: "admin.sidebar.groups.system",
    items: [{ id: "users", icon: "users", labelKey: k("admin", "sidebar.items", "users"), to: "/admin/users" }],
  },
  {
    titleKey: "admin.sidebar.groups.moderation",
    items: [
      { id: "reports", icon: "flag", labelKey: k("admin", "sidebar.items", "reports"), to: "/admin/reports", badge: "5", badgeType: "bad" },
      { id: "decks", icon: "layers", labelKey: k("admin", "sidebar.items", "decks"), to: "/admin/decks", badge: "8", badgeType: "warn" },
      { id: "audit", icon: "history", labelKey: k("admin", "sidebar.items", "audit"), to: "/admin/audit" },
    ],
  },
  {
    titleKey: "admin.sidebar.groups.config",
    items: [
      { id: "limits", icon: "sliders-horizontal", labelKey: k("admin", "sidebar.items", "limits"), to: "/admin/limits" },
      { id: "subs", icon: "credit-card", labelKey: k("admin", "sidebar.items", "subs"), to: "/admin/subs" },
      { id: "errors", icon: "circle-alert", labelKey: k("admin", "sidebar.items", "errors"), to: "/admin/errors" },
    ],
  },
];

export const STUDENT_SHELL: ShellConfig = {
  role: "student",
  homePath: "/student",
  ns: "student",
  density: "comfortable",
  groups: studentGroups,
  showProUpsell: true,
  topBar: { kind: "learner" },
  accountAriaKey: "student.topbar.account",
  menuPlanRow: true,
  menu: [
    { icon: "circle-user", labelKey: "student.topbar.profile", to: "/student/settings?tab=profile" },
    { icon: "target", labelKey: "student.topbar.learning", to: "/student/settings?tab=learning" },
    { icon: "shield-check", labelKey: "student.topbar.security", to: "/student/settings?tab=security" },
    { icon: "lock-keyhole", labelKey: "student.topbar.privacy", to: "/student/settings?tab=privacy" },
    { icon: "contrast", labelKey: "theme.toggle", action: "theme" },
  ],
};

export const INSTRUCTOR_SHELL: ShellConfig = {
  role: "instructor",
  homePath: "/instructor",
  ns: "instructor",
  density: "dense",
  groups: instructorGroups,
  sidebarAction: { icon: "graduation-cap", labelKey: "instructor.sidebar.viewAsStudent", to: "/student" },
  topBar: { kind: "workspace" },
  accountAriaKey: "instructor.topbar.accountAria",
  menu: [
    { icon: "history", labelKey: "instructor.topbar.myHistory", to: "/instructor/audit" },
    { icon: "graduation-cap", labelKey: "instructor.topbar.viewAsStudent", to: "/student" },
  ],
};

export const ADMIN_SHELL: ShellConfig = {
  role: "admin",
  homePath: "/admin",
  ns: "admin",
  density: "dense",
  groups: adminGroups,
  topBar: { kind: "workspace" },
  accountAriaKey: "admin.topbar.accountAria",
  menu: [{ icon: "settings", labelKey: "admin.topbar.systemSettings", to: "/admin/settings" }],
};
