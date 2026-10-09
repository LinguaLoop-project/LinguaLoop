import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth";
import PasswordForm from "./PasswordForm";

/** Tab "Bảo mật & đăng nhập": tạo/đổi mật khẩu và trạng thái liên kết Google (chỉ xem). */
export default function SecuritySection() {
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const googleLinked = user?.googleLinked ?? false;

  return (
    <div className="flex flex-col gap-6">
      <PasswordForm />

      <section className="ll-card">
        <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {t("settings.google.title")}
        </h3>
        <div className="mt-4 flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0" aria-hidden="true">
            <use href="#g-google" />
          </svg>
          <div className="min-w-0 grow">
            <b className="block text-[15px]">{t("settings.google.name")}</b>
            <span className="block truncate text-[13px]" style={{ color: "var(--text-muted)" }}>
              {googleLinked ? t("settings.google.linked", { email: user?.email }) : t("settings.google.notLinked")}
            </span>
          </div>
          <span className={`badge ${googleLinked ? "t-ok" : ""}`}>{googleLinked ? "✓" : "—"}</span>
        </div>
      </section>
    </div>
  );
}
