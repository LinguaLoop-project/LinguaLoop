import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { buttonClasses } from "@/components/common/buttonStyles";
import { useAuthStore } from "@/features/auth";
import { useStatsOverview } from "@/features/stats";
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

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border bg-bg-elevated px-4 py-3">
      <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-[13px] text-text-muted">{label}</span>
    </div>
  );
}

/** Thành tích học tập toàn thời gian lấy từ thống kê (UC-TH-01); lỗi ở đây không chặn phần còn lại của hồ sơ. */
function Snapshot() {
  const { t } = useTranslation("auth");
  const query = useStatsOverview("all");
  const data = query.data;
  return (
    <section className={CARD} aria-busy={query.isFetching}>
      <h2 className={OVERLINE}>{t("profile.snapshot.title")}</h2>
      <p className="mt-1 text-[13px] text-text-muted">{t("profile.snapshot.hint")}</p>
      {query.isError && !data ? (
        <p className="mt-4 text-sm text-text-muted">
          {t("profile.snapshot.error")}{" "}
          <button type="button" className="cursor-pointer font-semibold text-primary hover:underline" onClick={() => void query.refetch()}>
            {t("profile.snapshot.retry")}
          </button>
        </p>
      ) : !data ? (
        <Skeleton className="mt-4 h-20 w-full" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label={t("profile.snapshot.streak")} value={t("profile.snapshot.days", { count: data.streak.current })} />
          <Figure label={t("profile.snapshot.longest")} value={t("profile.snapshot.days", { count: data.streak.longest })} />
          <Figure label={t("profile.snapshot.sentences")} value={String(data.sentences.total)} />
          <Figure label={t("profile.snapshot.mastered")} value={String(data.vocab.cards.mastered)} />
        </div>
      )}
    </section>
  );
}

/** Trang Hồ sơ của học viên (UC-TK-10): thông tin tài khoản, mục tiêu học và thành tích; chỉnh sửa ở Cài đặt. */
export default function ProfilePage() {
  const { t, i18n } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const plan = useMyPlan();
  if (!user) return null;

  const name = user.displayName?.trim() || user.email;
  const pro = plan.data?.plan === "pro";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6" id="v-profile">
      <header>
        <span className="block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.12em] text-primary-text">{t("profile.overline")}</span>
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-[-0.02em]">{t("profile.title")}</h1>
        <p className="mt-1 text-text-muted">{t("profile.sub")}</p>
      </header>

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
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${pro ? "border-primary/40 bg-primary-soft text-primary-text" : "border-border bg-bg-elevated text-text-muted"}`}>
                {pro && <Icon name="crown" className="size-3.5" />}
                {pro ? t("profile.planPro") : t("profile.planFree")}
              </span>
            )}
          </div>
        </div>
        <Link to="/student/settings?tab=learning" className={buttonClasses({ variant: "secondary", size: "sm" })}>
          <Icon name="pencil" />
          {t("profile.edit")}
        </Link>
      </div>

      <Snapshot />

      <div className="grid gap-6 md:grid-cols-2">
        <section className={CARD}>
          <h2 className={OVERLINE}>{t("profile.goal.title")}</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <Row label={t("profile.goal.daily")} value={t("profile.goal.minutes", { count: user.dailyMinutes })} />
            <Row label={t("profile.goal.language")} value={i18n.language === "en" ? "English" : "Tiếng Việt"} />
            <Row label={t("profile.goal.timezone")} value={user.timezone} />
          </dl>
          <Link to="/student/settings?tab=learning" className="mt-4 inline-block text-[13px] font-semibold text-primary-text hover:underline">
            {t("profile.goal.change")}
          </Link>
        </section>

        <section className={CARD}>
          <h2 className={OVERLINE}>{t("profile.signin.title")}</h2>
          <dl className="mt-4 flex flex-col gap-3">
            <Row label={t("profile.signin.password")} value={user.hasPassword ? t("profile.signin.set") : t("profile.signin.notSet")} />
            <Row label={t("profile.signin.google")} value={user.googleLinked ? t("profile.signin.linked") : t("profile.signin.notLinked")} />
          </dl>
          <Link to="/student/settings?tab=security" className="mt-4 inline-block text-[13px] font-semibold text-primary-text hover:underline">
            {t("profile.signin.manage")}
          </Link>
        </section>
      </div>
    </section>
  );
}
