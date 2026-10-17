/** Cấu hình khung chung cho ba vai trò. Khung (AppShell, Sidebar, TopBar) không biết gì về vai trò; mọi khác biệt nằm ở đây. */

/** Màu của mục đang chọn: tím cho chung, còn lại là màu chức năng (DESIGN.v2 §2.2, §7.3). */
export type NavTone = "primary" | "dictation" | "shadowing" | "vocab" | "assessment";

export type NavItem = {
  id: string;
  /** Tên icon Lucide. */
  icon: string;
  /** Khoá đầy đủ trong namespace `layout`, vd "student.sidebar.items.today". */
  labelKey: string;
  to: string;
  tone?: NavTone;
  badge?: number | string;
  badgeType?: "warn" | "bad";
};

export type NavGroup = {
  /** Khoá đầy đủ của tiêu đề nhóm; bỏ trống nếu nhóm không có tiêu đề. */
  titleKey?: string;
  items: NavItem[];
};

export type MenuItem = {
  icon: string;
  labelKey: string;
  /** Đường dẫn đích; bỏ trống nếu là `action`. */
  to?: string;
  action?: "theme";
};

export type ShellConfig = {
  role: "student" | "instructor" | "admin";
  homePath: string;
  /** Tiền tố khoá i18n của vai trò: "student" | "instructor" | "admin". */
  ns: string;
  /** "comfortable" cho học viên; "dense" cho giáo viên/admin (DESIGN.v2 §4). */
  density: "comfortable" | "dense";
  groups: NavGroup[];
  /** Nút hành động đầu thanh bên, vd "Xem như học viên". */
  sidebarAction?: { icon: string; labelKey: string; to: string };
  /** Thẻ mời nâng cấp Pro ở chân thanh bên. */
  showProUpsell?: boolean;
  topBar:
    /** Học viên: ô tìm nhanh, chuỗi ngày, hạn mức, gói. */
    | { kind: "learner" }
    /** Giáo viên/admin: đường dẫn (breadcrumb) tên trang. */
    | { kind: "workspace" };
  accountAriaKey: string;
  /** Mục trong menu tài khoản, trước nút đăng xuất. */
  menu: MenuItem[];
  /** Hiện dòng gói Free và nút nâng cấp ở đầu menu tài khoản. */
  menuPlanRow?: boolean;
};
