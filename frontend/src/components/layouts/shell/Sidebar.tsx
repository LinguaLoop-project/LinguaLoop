import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Mascot from "@/components/common/Mascot";
import { useReviewEntries } from "@/features/practice";
import { type ReportBadgeKind, useReportBadge } from "@/features/report";
import { useSavedWords } from "@/features/vocab";
import { useAiEnergy } from "@/hooks/useAiEnergy";
import type { NavItem, NavTone, ShellConfig } from "./shellConfig";

/**
 * Thanh bên theo mockup v2 (`.rail`, `.nav`).
 * - ≥1024px: đầy đủ 248px, người dùng có thể thu thành icon (76px).
 * - 768–1023px: luôn thu thành icon.
 * - <768px: ẩn, mở thành ngăn kéo bằng nút menu ở thanh trên.
 * Tailwind cần class viết nguyên văn nên các biến thể "thu gọn" nằm trong bảng tĩnh bên dưới.
 */

const HIDE_WHEN_COMPACT = { true: "md:hidden", false: "md:max-lg:hidden" } as const;
const CENTER_WHEN_COMPACT = {
  true: "md:w-12 md:justify-center md:px-0",
  false: "md:max-lg:w-12 md:max-lg:justify-center md:max-lg:px-0",
} as const;
const BAR_WHEN_COMPACT = { true: "md:before:-left-2.5", false: "md:max-lg:before:-left-2.5" } as const;
const PAD_WHEN_COMPACT = { true: "md:items-center md:px-2.5", false: "md:max-lg:items-center md:max-lg:px-2.5" } as const;
const DOT_WHEN_COMPACT = { true: "md:block", false: "md:max-lg:block" } as const;

/** Màu chức năng của mục: icon luôn có màu, mục đang chọn nền `--fn-soft` + viền mảnh đồng màu + vạch 4px sát mép thanh bên. */
/** Viền mảnh và vệt sáng phía trên của mục đang chọn; màu viền đặt riêng theo từng chức năng. */
const ACTIVE_RING = "ring-1 ring-inset shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

/** Màu chức năng của mục: icon luôn có màu, mục đang chọn nền `--fn-soft` + viền mảnh đồng màu + vạch 4px sát mép thanh bên. */
const TONE: Record<NavTone, { icon: string; on: string; tag: string }> = {
  primary: {
    icon: "text-primary",
    on: `bg-primary-soft ${ACTIVE_RING} ring-primary/30 before:bg-primary`,
    tag: "bg-primary-soft text-primary",
  },
  dictation: {
    icon: "text-fn-dictation",
    on: `bg-fn-dictation-soft ${ACTIVE_RING} ring-fn-dictation/30 before:bg-fn-dictation`,
    tag: "bg-fn-dictation-soft text-fn-dictation",
  },
  shadowing: {
    icon: "text-fn-shadowing",
    on: `bg-fn-shadowing-soft ${ACTIVE_RING} ring-fn-shadowing/30 before:bg-fn-shadowing`,
    tag: "bg-fn-shadowing-soft text-fn-shadowing",
  },
  vocab: {
    icon: "text-fn-vocab",
    on: `bg-fn-vocab-soft ${ACTIVE_RING} ring-fn-vocab/30 before:bg-fn-vocab`,
    tag: "bg-fn-vocab-soft text-fn-vocab",
  },
  watch: {
    icon: "text-fn-watch",
    on: `bg-fn-watch-soft ${ACTIVE_RING} ring-fn-watch/30 before:bg-fn-watch`,
    tag: "bg-fn-watch-soft text-fn-watch",
  },
  weakness: {
    icon: "text-fn-weakness",
    on: `bg-fn-weakness-soft ${ACTIVE_RING} ring-fn-weakness/30 before:bg-fn-weakness`,
    tag: "bg-fn-weakness-soft text-fn-weakness",
  },
  assessment: {
    icon: "text-fn-assessment",
    on: `bg-fn-assessment-soft ${ACTIVE_RING} ring-fn-assessment/30 before:bg-fn-assessment`,
    tag: "bg-fn-assessment-soft text-fn-assessment",
  },
};
const ON_BAR =
  "text-text font-semibold before:content-[''] before:absolute before:-left-3.5 before:top-2 before:bottom-2 before:w-1 before:rounded-r-[4px]";

/** Mục menu có số đếm từ feature báo cáo; null với các mục khác. */
function reportBadgeKind(item: NavItem, config: ShellConfig): ReportBadgeKind | null {
  if (item.id === "republish" && config.homePath.startsWith("/admin")) return "republish";
  if (item.id !== "reports") return null;
  if (config.homePath.startsWith("/admin")) return "admin";
  return config.homePath.startsWith("/teacher") ? "teacher" : null;
}

function Item({ item, config, collapsed, onNavigate }: { item: NavItem; config: ShellConfig; collapsed: boolean; onNavigate: () => void }) {
  const { t } = useTranslation("layout");
  const label = t(item.labelKey);
  const tone = TONE[item.tone ?? "primary"];
  const hide = HIDE_WHEN_COMPACT[`${collapsed}`];
  // "Từ & câu đã lưu": tổng số từ đã lưu và số câu đang chờ ôn của học viên (lấy từ cùng truy vấn với trang đó nên luôn khớp).
  const isMyWords = item.id === "mywords" && config.homePath.startsWith("/student");
  const reviewCount = useReviewEntries(undefined, undefined, isMyWords).data?.length;
  const savedWordsCount = useSavedWords(isMyWords).data?.length;
  const myWordsCount =
    reviewCount == null && savedWordsCount == null ? undefined : (savedWordsCount ?? 0) + (reviewCount ?? 0);
  // "Báo cáo nội dung": số báo cáo đang chờ chính vai trò xử lý; "Duyệt xuất bản lại": số yêu cầu đang chờ duyệt.
  const reportCount = useReportBadge(reportBadgeKind(item, config));
  const count = isMyWords ? myWordsCount : reportCount;
  const badge = count == null ? item.badge : count > 99 ? "99+" : count;
  const hasBadge = badge != null && badge !== 0;

  return (
    <NavLink
      to={item.to}
      end={item.to === config.homePath}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `group relative flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-[14.5px] font-medium transition-all duration-150 ${CENTER_WHEN_COMPACT[`${collapsed}`]} ${BAR_WHEN_COMPACT[`${collapsed}`]} ${
          isActive ? `${ON_BAR} ${tone.on}` : "text-text-muted hover:bg-surface-hover/80 hover:text-text"
        }`
      }
    >
      <Icon
        name={item.icon}
        className={`text-[21px] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:scale-105 ${tone.icon}`}
      />
      <span className={`truncate ${hide}`}>{label}</span>
      {hasBadge && (
        <>
          <span
            className={`ml-auto grid h-[22px] min-w-6 place-items-center rounded-full px-[7px] text-xs font-bold ${
              item.badgeType === "warn" ? "bg-warning/15 text-warning" : tone.tag
            } ${hide}`}
          >
            {badge}
          </span>
          <span aria-hidden="true" className={`absolute right-1 top-1 hidden h-2 w-2 rounded-full bg-danger ${DOT_WHEN_COMPACT[`${collapsed}`]}`} />
        </>
      )}
    </NavLink>
  );
}

function ProCard({ hide }: { hide: string }) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const { isPro } = useAiEnergy();
  if (isPro) return null;
  return (
    <div
      className={`mb-2 rounded-xl border border-primary/30 bg-[linear-gradient(145deg,var(--surface),var(--primary-soft))] p-3 shadow-[var(--shadow-card)] ${hide}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="pro">
          <Icon name="crown" />
          PRO
        </Badge>
        <b className="text-sm font-bold text-text">{t("student.sidebar.pro.price")}</b>
      </div>
      <p className="my-1.5 line-clamp-2 text-xs leading-snug text-text-muted">{t("student.sidebar.pro.desc")}</p>
      <Button size="sm" fullWidth onClick={() => navigate("/pricing")}>
        {t("student.sidebar.pro.cta")}
      </Button>
    </div>
  );
}

export interface SidebarProps {
  config: ShellConfig;
  collapsed: boolean;
  drawerOpen: boolean;
  onToggleCollapsed: () => void;
  /** Đóng ngăn kéo (mobile) sau khi chọn mục. */
  onNavigate: () => void;
}

export default function Sidebar({ config, collapsed, drawerOpen, onToggleCollapsed, onNavigate }: SidebarProps) {
  const { t } = useTranslation("layout");
  const navigate = useNavigate();
  const key = `${collapsed}` as "true" | "false";
  const hide = HIDE_WHEN_COMPACT[key];
  const drawer = drawerOpen ? "max-md:flex max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:h-dvh max-md:w-[248px]" : "";

  return (
    <aside
      id="app-sidebar"
      aria-label={t(`${config.ns}.sidebar.aria`)}
      className={`hidden flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-border bg-bg-elevated px-3.5 py-5 [scrollbar-width:none] md:sticky md:top-0 md:flex md:h-screen [&::-webkit-scrollbar]:hidden ${PAD_WHEN_COMPACT[key]} ${drawer}`}
    >
      <div className={`flex items-center justify-between gap-2 pb-3 ${collapsed ? "md:flex-col" : "md:max-lg:flex-col md:max-lg:justify-center"}`}>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2.5 border-0 bg-transparent px-1.5 py-1 text-left text-text"
          onClick={() => {
            navigate(config.homePath);
            onNavigate();
          }}
          aria-label={t(`${config.ns}.sidebar.homeLabel`)}
        >
          <img src="/app-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className={`font-display text-xl font-bold leading-none tracking-[-0.03em] ${hide}`}>
            Lingua<b className="font-bold text-primary-text">Loop</b>
          </span>
        </button>
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          className="hidden lg:inline-flex"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
          title={collapsed ? t("shell.expand") : t("shell.collapse")}
        >
          <Icon name={collapsed ? "panel-left-open" : "panel-left-close"} />
        </Button>
      </div>

      {config.sidebarAction && (
        <button
          type="button"
          title={t(config.sidebarAction.labelKey)}
          onClick={() => {
            navigate(config.sidebarAction!.to);
            onNavigate();
          }}
          className={`mb-1 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-primary-soft px-3 text-[15px] font-semibold text-text transition-colors hover:bg-surface-hover ${CENTER_WHEN_COMPACT[key]}`}
        >
          <Icon name={config.sidebarAction.icon} className="text-2xl text-primary" />
          <span className={hide}>{t(config.sidebarAction.labelKey)}</span>
        </button>
      )}

      {config.groups.map((group, index) => (
        <div
          key={group.titleKey ?? `g${index}`}
          className={`flex flex-col gap-0.5 ${index > 0 ? "mt-1.5 border-t border-border/60 pt-2" : ""}`}
        >
          {group.titleKey && (
            <div className={`px-3 pb-1 pt-1.5 text-[10.5px] font-bold uppercase leading-[1.4] tracking-[0.14em] text-primary-text/85 ${hide}`}>
              {t(group.titleKey)}
            </div>
          )}
          {group.items.map((item) => (
            <Item key={item.id} item={item} config={config} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}

      <div className="flex-1" />

      {config.showProUpsell && <ProCard hide={hide} />}

      {config.showProUpsell && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border border-border bg-primary-soft/75 px-3 py-2.5 ${
            collapsed ? "md:p-2" : "md:max-lg:p-2"
          }`}
        >
          <Mascot mood="hello" size={36} alt="" />
          <div className={`min-w-0 ${hide}`}>
            <b className="block text-xs font-bold text-text">Loopi</b>
            <div className="truncate text-xs leading-snug text-text-muted">{t("student.sidebar.loopi")}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
