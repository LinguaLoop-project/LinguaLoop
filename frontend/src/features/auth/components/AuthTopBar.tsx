import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Logo from "@/components/common/Logo";
import { useTheme } from "@/hooks/useTheme";

/** Hàng trên của cột phải màn auth (`.auth-top`): thương hiệu (chỉ khi cột trái ẩn), đổi ngôn ngữ, đổi giao diện. */
export const AuthTopBar: React.FC = () => {
  const { t } = useTranslation(["auth", "layout"]);
  const { isDark, toggleTheme } = useTheme();
  return (
    <div className="flex w-full items-center gap-2">
      <Link to="/" className="flex items-center gap-2 md:hidden" aria-label={t("auth:sidePanel.homeLabel")}>
        <Logo size={28} />
      </Link>

      <div className="flex-1" />

      <LanguageSwitcher heightClass="h-10" />
      <Button variant="ghost" iconOnly onClick={toggleTheme} aria-label={t("layout:theme.toggle")} title={isDark ? t("layout:theme.toLight") : t("layout:theme.toDark")}>
        <Icon name={isDark ? "sun" : "moon"} />
      </Button>
    </div>
  );
};

export default AuthTopBar;
