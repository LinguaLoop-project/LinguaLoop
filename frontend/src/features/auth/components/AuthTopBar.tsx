import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Logo from "@/components/common/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";

export const AuthTopBar: React.FC = () => {
  const { t } = useTranslation("auth");
  return (
    <div className="flex items-center gap-2 mb-4 w-full">
      {/* Mobile brand */}
      <Link to="/" className="flex items-center gap-2 md:hidden" aria-label={t("sidePanel.homeLabel")}>
        <Logo size={28} />
      </Link>

      <div className="flex-1" />

      <ThemeToggle />

      <LanguageSwitcher />
    </div>
  );
};

export default AuthTopBar;
