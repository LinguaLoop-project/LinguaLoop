import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import ThemeToggle from "@/components/common/ThemeToggle";

export const AuthTopBar: React.FC = () => {
  const { t } = useTranslation("auth");
  return (
    <div className="auth-top mb-4">
      {/* Mobile brand */}
      <Link to="/" className="flex items-center gap-2 md:hidden" aria-label={t("sidePanel.homeLabel")}>
        <svg className="ll-brand-mark" viewBox="0 0 100 100" aria-hidden="true">
          <use href="#logo-mark" />
        </svg>
        <span className="ll-wordmark">
          Lingua<b className="ll-loop">Loop</b>
        </span>
      </Link>

      <div className="flex-1" />

      <ThemeToggle />

      <LanguageSwitcher />
    </div>
  );
};

export default AuthTopBar;
