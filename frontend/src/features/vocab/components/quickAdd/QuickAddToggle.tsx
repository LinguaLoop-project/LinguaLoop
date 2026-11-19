import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { useAuthStore } from "@/features/auth";

export interface QuickAddToggleProps {
  headword: string;
  open: boolean;
  onToggle: () => void;
}

/**
 * Nút "Thêm vào bộ" đặt cạnh nút "Lưu" ở từng nghĩa (UC-HT-10). Chỉ học viên có "Bộ của tôi" nên giáo viên và quản trị
 * viên không thấy nút (BR-HT-28).
 */
export default function QuickAddToggle({ headword, open, onToggle }: Readonly<QuickAddToggleProps>) {
  const { t } = useTranslation("vocab");
  const role = useAuthStore((state) => state.user?.role);
  if (role !== "student") return null;
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={t("quickAdd.toggleAria", { word: headword })}
      onClick={onToggle}
      className={`inline-flex h-7 flex-none cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors ${
        open
          ? "border-primary bg-primary-soft text-primary-text"
          : "border-border-strong bg-transparent text-text-muted hover:border-primary hover:text-text"
      }`}
    >
      <Icon name="plus" className="h-3.5 w-3.5" />
      {t("quickAdd.toggle")}
    </button>
  );
}
