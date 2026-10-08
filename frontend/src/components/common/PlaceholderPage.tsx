import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuota } from "@/hooks/useQuota";

export interface PlaceholderPageProps {
  /** Khoá trong locales `pages` (vd "student.today"): lấy title, description và icon theo ngôn ngữ đang chọn. */
  pageKey?: string;
  /** Dùng khi trang không nằm trong `pages` (vd trang tạm ở app/placeholders). */
  title?: string;
  description?: string;
  badge?: string;
  icon?: string;
}

// Icon theo tên trang (đoạn cuối của pageKey, bỏ hậu tố "Detail")
const PAGE_ICONS: Record<string, string> = {
  today: "sun-horizon",
  lesson: "books",
  lessons: "books",
  topic: "folders",
  topics: "folders",
  vocab: "cards",
  deck: "cards",
  decks: "cards",
  dictation: "headphones",
  shadowing: "microphone",
  phoneme: "microphone",
  users: "users",
  user: "users",
  students: "users",
  instructors: "users",
  reports: "flag",
  report: "flag",
  test: "exam",
  cefr: "exam",
  qbank: "exam",
  audit: "clock-counter-clockwise",
  logs: "clock-counter-clockwise",
  limits: "credit-card",
  subs: "credit-card",
  subscriptions: "credit-card",
  settings: "gear-six",
  profile: "user-circle",
  analytics: "chart-line-up",
  stats: "chart-line-up",
  progress: "chart-line-up",
  classes: "chalkboard-teacher",
  dict: "book-open-text",
  mywords: "bookmarks-simple",
  weakness: "target",
  compose: "pencil-line",
};

function resolveIcon(pageKey?: string, customIcon?: string): string {
  if (customIcon) return customIcon.replace(/^ph-/, "");
  const page = pageKey?.split(".").pop()?.replace(/Detail$/, "") ?? "";
  return PAGE_ICONS[page] ?? "sparkle";
}

export default function PlaceholderPage({
  pageKey,
  title,
  description,
  badge,
  icon,
}: PlaceholderPageProps) {
  const { t } = useTranslation(["common", "pages"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { checkQuota, incrementQuota } = useQuota();
  const iconBase = resolveIcon(pageKey, icon);

  const pageTitle = title ?? (pageKey ? t(`pages:${pageKey}.title`) : "");
  const pageDescription =
    description ?? (pageKey ? t(`pages:${pageKey}.description`) : t("common:placeholder.defaultDescription"));
  const pageBadge = badge ?? t("common:placeholder.badge");

  // Xác định trang chủ theo layout
  const homePath = location.pathname.startsWith("/admin")
    ? "/admin"
    : location.pathname.startsWith("/instructor")
    ? "/instructor"
    : "/student";

  const homeLabel = location.pathname.startsWith("/admin")
    ? t("common:placeholder.homeAdmin")
    : location.pathname.startsWith("/instructor")
    ? t("common:placeholder.homeInstructor")
    : t("common:placeholder.homeStudent");

  return (
    <div className="w-full py-8 md:py-12 px-4 flex justify-center items-center">
      <div className="relative w-full max-w-2xl p-7 md:p-10 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)] overflow-hidden text-center flex flex-col items-center">
        {/* Glow hiệu ứng nền */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)] pointer-events-none"
          aria-hidden="true"
        />

        {/* Icon đại diện */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-soft border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] text-accent text-3xl shadow-[0_0_24px_rgba(139,92,246,0.22)] mb-4 shrink-0">
          <i className={`ph ph-${iconBase}`} aria-hidden="true" />
        </div>

        {/* Badge trạng thái */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-accent border border-[color-mix(in_srgb,var(--primary)_25%,transparent)] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>{pageBadge}</span>
        </div>

        {/* Tiêu đề & Mô tả */}
        <h1 className="text-2xl md:text-3xl font-extrabold font-display text-text tracking-tight mb-2.5">
          {pageTitle}
        </h1>
        <p className="text-text-muted text-sm md:text-base leading-relaxed max-w-lg mb-7">
          {pageDescription}
        </p>

        {/* Khối xem trước tính năng đang chuẩn bị */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <i className="ph ph-layout text-base" aria-hidden="true" />
              <span>{t("common:placeholder.features.ui.title")}</span>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              {t("common:placeholder.features.ui.desc")}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <i className="ph ph-robot text-base" aria-hidden="true" />
              <span>{t("common:placeholder.features.ai.title")}</span>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              {t("common:placeholder.features.ai.desc")}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-accent text-sm font-semibold">
              <i className="ph ph-arrows-clockwise text-base" aria-hidden="true" />
              <span>{t("common:placeholder.features.sync.title")}</span>
            </div>
            <p className="text-xs text-text-muted leading-snug">
              {t("common:placeholder.features.sync.desc")}
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong bg-surface text-text text-sm font-semibold transition-colors duration-150 hover:bg-surface-hover hover:border-text-muted cursor-pointer select-none"
          >
            <i className="ph ph-arrow-left text-base" aria-hidden="true" />
            <span>{t("common:placeholder.back")}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold transition-opacity duration-150 hover:opacity-90 shadow-sm cursor-pointer select-none border-0"
          >
            <i className="ph ph-house text-base" aria-hidden="true" />
            <span>{homeLabel}</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (checkQuota()) {
                incrementQuota();
                alert(t("common:placeholder.quotaSuccess"));
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-sm font-semibold transition-opacity duration-150 hover:opacity-90 shadow-sm cursor-pointer select-none border border-purple-200 dark:border-purple-800"
          >
            <i className="ph-fill ph-lightning text-base" aria-hidden="true" />
            <span>{t("common:placeholder.tryQuota")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
