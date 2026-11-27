import { useTranslation } from "react-i18next";
import GoogleLogo from "@/features/auth/components/GoogleLogo";
import { useAuthStore } from "@/features/auth";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import PasswordForm from "./PasswordForm";
import { SettingsCard } from "./SettingsCard";

/** Tab "Bảo mật & đăng nhập": tổng quan trạng thái bảo mật, tạo/đổi mật khẩu và trạng thái liên kết Google. */
export default function SecuritySection() {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const googleLinked = user?.googleLinked ?? false;
  const hasPassword = user?.hasPassword ?? false;
  const emailVerified = user?.emailVerified ?? false;

  const summaryItems = [
    {
      key: "password",
      icon: "lock",
      label: t("settings.security.summaryPassword"),
      status: hasPassword ? t("settings.security.passwordSet") : t("settings.security.passwordUnset"),
      ok: hasPassword,
    },
    {
      key: "google",
      icon: "link",
      label: t("settings.google.name"),
      status: googleLinked ? t("settings.google.statusLinked") : t("settings.google.statusNotLinked"),
      ok: googleLinked,
    },
    {
      key: "email",
      icon: "mail",
      label: t("fieldLabels.email"),
      status: emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified"),
      ok: emailVerified,
    },
  ];

  return (
    <div className="flex flex-col gap-6" id="v-security">
      {/* Tóm tắt nhanh trạng thái bảo mật */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summaryItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]"
          >
            <span
              aria-hidden="true"
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md ${
                item.ok ? "bg-success/15 text-success" : "bg-bg-elevated text-text-muted"
              }`}
            >
              <Icon name={item.icon} className="text-base" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs text-text-muted">{item.label}</span>
              <span className={`block truncate text-sm font-semibold ${item.ok ? "text-text" : "text-text-muted"}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <PasswordForm />

      <SettingsCard
        title={t("settings.google.title")}
        description={t("settings.google.desc")}
        icon="link"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-bg-elevated px-4 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface">
              <GoogleLogo className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold text-text">{t("settings.google.name")}</b>
              <span className="mt-0.5 block truncate text-[13px] text-text-muted">
                {googleLinked ? t("settings.google.linked", { email: user?.email }) : t("settings.google.notLinked")}
              </span>
            </div>
          </div>
          <Badge variant={googleLinked ? "success" : "default"}>
            <Icon name={googleLinked ? "circle-check" : "minus"} />
            {googleLinked ? t("settings.google.statusLinked") : t("settings.google.statusNotLinked")}
          </Badge>
        </div>
      </SettingsCard>
    </div>
  );
}
