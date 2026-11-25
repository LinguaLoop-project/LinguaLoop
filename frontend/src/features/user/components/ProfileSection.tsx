import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useAuthStore } from "@/features/auth";
import { useMyPlan } from "@/features/subscription/hooks/useMyPlan";

const CARD = "rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]";
const OVERLINE = "text-[13px] font-bold uppercase tracking-wider text-primary-text";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

/**
 * Tab Hồ sơ trong Cài đặt của học viên (UC-TK-10, BR-TK-19): thông tin tài khoản, gói, mục tiêu học và cách đăng nhập, chỉ để
 * xem. Chỉnh sửa ở các tab Học tập và Bảo mật nên `onSelectTab` chuyển tab ngay trong trang, không tải lại.
 */
export default function ProfileSection({ onSelectTab }: { onSelectTab: (tab: "learning" | "security") => void }) {
  const { t, i18n } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const plan = useMyPlan();
  if (!user) return null;

  const name = user.displayName?.trim() || user.email;
  const pro = plan.data?.plan === "pro";

  return (
    <section className="flex w-full flex-col gap-6" id="v-profile">
      <div className={`${CARD} flex flex-wrap items-center gap-5`}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-20 shrink-0 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-2xl font-bold text-primary-text">
            {initialsOf(name)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="truncate font-display text-2xl font-bold">{name}</h2>
          <p className="truncate text-sm text-text-muted">{user.email}</p>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className={`rounded-full border px-2.5 py-0.5 ${user.emailVerified ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>
              {user.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}
            </span>
            {plan.data && (
              <Link
                to="/student/subscription"
                title={t("profile.planManage")}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 transition-colors hover:border-primary/60 ${pro ? "border-primary/40 bg-primary-soft text-primary-text" : "border-border bg-bg-elevated text-text-muted"}`}
              >
                {pro && <Icon name="crown" className="size-3.5" />}
                {pro ? t("profile.planPro") : t("profile.planFree")}
                <Icon name="arrow-right" className="size-3" />
              </Link>
            )}
          </div>
        </div>
        <button type="button" onClick={() => onSelectTab("learning")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          <Icon name="pencil" />
          {t("profile.edit")}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={CARD}>
          <h2 className={OVERLINE}>{t("profile.goal.title")}</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <Row label={t("profile.goal.daily")} value={t("profile.goal.minutes", { count: user.dailyMinutes })} />
            <Row label={t("profile.goal.language")} value={i18n.language === "en" ? "English" : "Tiếng Việt"} />
            <Row label={t("profile.goal.timezone")} value={user.timezone} />
          </dl>
          <button type="button" onClick={() => onSelectTab("learning")} className="mt-4 inline-block cursor-pointer text-[13px] font-semibold text-primary-text hover:underline">
            {t("profile.goal.change")}
          </button>
        </section>

        <section className={CARD}>
          <h2 className={OVERLINE}>{t("profile.signin.title")}</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <Row label={t("profile.signin.password")} value={user.hasPassword ? t("profile.signin.set") : t("profile.signin.notSet")} />
            <Row label={t("profile.signin.google")} value={user.googleLinked ? t("profile.signin.linked") : t("profile.signin.notLinked")} />
          </dl>
          <button type="button" onClick={() => onSelectTab("security")} className="mt-4 inline-block cursor-pointer text-[13px] font-semibold text-primary-text hover:underline">
            {t("profile.signin.manage")}
          </button>
        </section>
      </div>
    </section>
  );
}
