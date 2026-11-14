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
      { id: "mywords", icon: "bookmark", labelKey: k("student", "sidebar.items", "mywords"), to: "/student/mywords", tone: "vocab" },
      { id: "weakness", icon: "target", labelKey: k("student", "sidebar.items", "weakness"), to: "/student/weakness", tone: "assessment" },
      { id: "test", icon: "file-check", labelKey: k("student", "sidebar.items", "test"), to: "/student/test", tone: "assessment" },
    ],
  },
];

const teacherGroups: NavGroup[] = [
  {
    items: [{ id: "dashboard", icon: "layout-grid", labelKey: k("teacher", "sidebar.items", "dashboard"), to: "/teacher" }],
  },
  {
    titleKey: "teacher.sidebar.groups.content",
    items: [
      { id: "lessons", icon: "film", labelKey: k("teacher", "sidebar.items", "lessons"), to: "/teacher/lessons" },
      { id: "decks", icon: "layers", labelKey: k("teacher", "sidebar.items", "decks"), to: "/teacher/decks" },
    ],
  },
  {
    titleKey: "teacher.sidebar.groups.tracking",
    items: [{ id: "reports", icon: "flag", labelKey: k("teacher", "sidebar.items", "reports"), to: "/teacher/reports" }],
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
