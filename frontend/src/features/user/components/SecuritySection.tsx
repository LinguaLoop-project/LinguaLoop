import { useTranslation } from "react-i18next";
import GoogleLogo from "@/features/auth/components/GoogleLogo";
import { useAuthStore } from "@/features/auth";
import PasswordForm from "./PasswordForm";
import Badge from "@/components/common/Badge";

/** Tab "Bảo mật & đăng nhập": tạo/đổi mật khẩu và trạng thái liên kết Google (chỉ xem). */
export default function SecuritySection() {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const googleLinked = user?.googleLinked ?? false;

  return (
    <div className="flex flex-col gap-6">
      <PasswordForm />

      <section className="p-6 rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold font-display text-text">
          {t("settings.google.title")}
        </h3>
        <div className="mt-4 flex items-center gap-3">
          <GoogleLogo className="h-5 w-5" />
          <div className="min-w-0 grow">
            <b className="block text-[15px] font-semibold text-text">{t("settings.google.name")}</b>
            <span className="block truncate text-[13px] text-text-muted mt-0.5">
              {googleLinked ? t("settings.google.linked", { email: user?.email }) : t("settings.google.notLinked")}
            </span>
          </div>
          <Badge variant={googleLinked ? "success" : "default"}>
            {googleLinked ? "✓" : "—"}
          </Badge>
        </div>
      </section>
    </div>
  );
}
