import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";

export interface ThemeToggleProps {
  /** Kích thước nút, mặc định `size-9` như Header trang chủ. */
  sizeClass?: string;
}

/** Nút đổi giao diện sáng/tối, dùng chung cho Header trang chủ, các topbar và trang đăng nhập. */
export default function ThemeToggle({ sizeClass = "size-9" }: ThemeToggleProps) {
  const { t } = useTranslation("layout");
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? t("theme.toLight") : t("theme.toDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("theme.toggle")}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-muted)] transition-all hover:bg-[var(--surface-hover)] hover:text-[var(--text)] cursor-pointer ${sizeClass}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-purple-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
