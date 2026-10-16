import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import type { ShellConfig } from "./shellConfig";

type FooterLink = { key: string; to?: string };

/** Cột liên kết của chân trang học viên (`.foot-col` trong mockup v2). Liên kết chưa có trang thì để `to` trống và hiện thông báo. */
const COLUMNS: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: "learn",
    links: [
      { key: "lessons", to: "/student/lessons" },
      { key: "dictation", to: "/student/dictation" },
      { key: "shadowing", to: "/student/shadowing" },
      { key: "vocab", to: "/student/vocab" },
      { key: "test", to: "/student/test" },
    ],
  },
  {
    titleKey: "mine",
    links: [
      { key: "mywords", to: "/student/mywords" },
      { key: "weakness", to: "/student/weakness" },
      { key: "settings", to: "/student/settings" },
      { key: "pro", to: "/student/settings?tab=plan" },
    ],
  },
  { titleKey: "support", links: [{ key: "guide" }, { key: "faq" }, { key: "report" }, { key: "contact" }] },
  { titleKey: "about", links: [{ key: "brand" }, { key: "terms" }, { key: "privacy" }, { key: "voiceData" }] },
];

const SOCIALS = [
  { icon: "facebook", key: "facebook" },
  { icon: "youtube", key: "youtube" },
  { icon: "music-2", key: "tiktok" },
  { icon: "mail", key: "mail" },
];

const LINK = "cursor-pointer border-0 bg-transparent p-0 text-left text-sm text-text-muted no-underline transition-colors hover:text-text";

/** Chân trang của khung (`.foot`): học viên có đủ 4 cột liên kết; giáo viên/admin chỉ có dải dưới. */
export default function AppFooter({ config }: { config: ShellConfig }) {
  const { t } = useTranslation("layout");
  const full = config.role === "student";

  const bottom = (
    <div className={`flex flex-wrap items-center gap-4 ${full ? "mt-8 border-t border-border pt-4" : ""}`}>
      <span className="text-[13px] leading-normal text-text-muted">{t("shell.footer.copyright")}</span>
      <span className="flex-1" />
      <span className="inline-flex items-center gap-2 text-[13px] text-text-muted">
        <i aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
        {t("shell.footer.status")}
      </span>
      <LanguageSwitcher variant="chip" />
    </div>
  );

  if (!full) {
    return <footer className="border-t border-border px-6 py-4">{bottom}</footer>;
  }

  return (
    <footer className="mt-6 border-t border-border bg-bg-elevated px-6 pb-6 pt-10 text-left">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
          <div className="flex flex-col items-start gap-3">
            <Link to={config.homePath} className="flex items-center gap-2.5 font-display text-xl font-bold leading-none text-text no-underline" aria-label={t("student.sidebar.homeLabel")}>
              <img src="/app-icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
              <span className="tracking-[-0.03em]">
                Lingua<b className="font-bold text-primary-text">Loop</b>
              </span>
            </Link>
            <p className="text-[13px] leading-normal text-text-muted">{t("shell.footer.tagline")}</p>
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <Button key={s.key} variant="ghost" iconOnly aria-label={t(`shell.footer.social.${s.key}`)} title={t(`shell.footer.social.${s.key}`)}>
                  <Icon name={s.icon} />
                </Button>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.titleKey} aria-label={t(`shell.footer.cols.${col.titleKey}`)} className="flex flex-col items-start gap-2">
              <h4 className="mb-1 text-sm font-bold">{t(`shell.footer.cols.${col.titleKey}`)}</h4>
              {col.links.map((l) =>
                l.to ? (
                  <Link key={l.key} to={l.to} className={LINK}>
                    {t(`shell.footer.links.${l.key}`)}
                  </Link>
                ) : (
                  <button key={l.key} type="button" className={LINK} disabled title={t("shell.footer.soon")}>
                    {t(`shell.footer.links.${l.key}`)}
                  </button>
                ),
              )}
            </nav>
          ))}
        </div>
        {bottom}
      </div>
    </footer>
  );
}
