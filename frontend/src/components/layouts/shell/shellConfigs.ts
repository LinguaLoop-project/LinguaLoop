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
      { id: "watch", icon: "monitor-play", labelKey: k("student", "sidebar.items", "watch"), to: "/watch" },
      { id: "vocab", icon: "layers", labelKey: k("student", "sidebar.items", "vocab"), to: "/student/vocab", tone: "vocab" },
    ],
  },
  {
    titleKey: "student.sidebar.groups.mine",
    items: [
      { id: "saved-lessons", icon: "bookmark-check", labelKey: k("student", "sidebar.items", "savedLessons"), to: "/student/saved-lessons" },
      { id: "mywords", icon: "bookmark", labelKey: k("student", "sidebar.items", "mywords"), to: "/student/mywords", tone: "vocab" },
      { id: "stats", icon: "trending-up", labelKey: k("student", "sidebar.items", "stats"), to: "/student/stats" },
      { id: "weakness", icon: "target", labelKey: k("student", "sidebar.items", "weakness"), to: "/student/weakness", tone: "assessment" },
    ],
  },
];

const teacherGroups: NavGroup[] = [
  {
    items: [{ id: "dashboard", icon: "layout-grid", labelKey: k("teacher", "sidebar.items", "dashboard"), to: "/teacher" }],
  },
  {
    titleKey: "teacher.sidebar.groups.queue",
    items: [
      { id: "reports", icon: "flag", labelKey: k("teacher", "sidebar.items", "reports"), to: "/teacher/reports", badgeType: "bad" },
    ],
  },
  {
    titleKey: "teacher.sidebar.groups.content",
    items: [
      { id: "lessons", icon: "film", labelKey: k("teacher", "sidebar.items", "lessons"), to: "/teacher/lessons" },
      { id: "decks", icon: "layers", labelKey: k("teacher", "sidebar.items", "decks"), to: "/teacher/decks" },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    items: [{ id: "dashboard", icon: "layout-grid", labelKey: k("admin", "sidebar.items", "dashboard"), to: "/admin" }],
  },
  {
    titleKey: "admin.sidebar.groups.accounts",
    items: [
      { id: "users", icon: "users", labelKey: k("admin", "sidebar.items", "users"), to: "/admin/users" },
      { id: "transfers", icon: "arrow-left-right", labelKey: k("admin", "sidebar.items", "transfers"), to: "/admin/transfers" },
    ],
  },
  {
    titleKey: "admin.sidebar.groups.queue",
    items: [
      { id: "reports", icon: "flag", labelKey: k("admin", "sidebar.items", "reports"), to: "/admin/reports", badgeType: "bad" },
      { id: "republish", icon: "send", labelKey: k("admin", "sidebar.items", "republish"), to: "/admin/republish", badgeType: "warn" },
    ],
  },
  {
    titleKey: "admin.sidebar.groups.content",
    items: [
      { id: "lessons", icon: "film", labelKey: k("admin", "sidebar.items", "lessons"), to: "/admin/lessons" },
      { id: "decks", icon: "layers", labelKey: k("admin", "sidebar.items", "decks"), to: "/admin/decks" },
    ],
  },
  {
    titleKey: "admin.sidebar.groups.config",
    items: [
      { id: "credit", icon: "sliders-horizontal", labelKey: k("admin", "sidebar.items", "credit"), to: "/admin/credit" },
      { id: "plans", icon: "crown", labelKey: k("admin", "sidebar.items", "plans"), to: "/admin/plans" },
    ],
  },
  {
    items: [{ id: "audit", icon: "history", labelKey: k("admin", "sidebar.items", "audit"), to: "/admin/audit" }],
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

export const TEACHER_SHELL: ShellConfig = {
  role: "teacher",
  homePath: "/teacher",
  ns: "teacher",
  density: "dense",
  groups: teacherGroups,
  topBar: { kind: "workspace" },
  accountAriaKey: "teacher.topbar.accountAria",
  menu: [{ icon: "settings", labelKey: "teacher.topbar.settings", to: "/teacher/settings" }],
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
