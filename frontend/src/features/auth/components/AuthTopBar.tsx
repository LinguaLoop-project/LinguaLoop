import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export const AuthTopBar: React.FC = () => {
  const { t } = useTranslation("auth");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const stored = localStorage.getItem("ll3-theme");
      if (stored) return JSON.parse(stored) as "dark" | "light";
    } catch {
      // fallback to dark
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("ll3-theme", JSON.stringify(nextTheme));
  };

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

      <LanguageSwitcher className="ll-icon-btn" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="ll-icon-btn"
        aria-label={t("topBar.toggleTheme")}
      >
        <span className="theme-ic">
          <i className="ph ph-moon" />
          <i className="ph ph-sun" />
        </span>
      </button>
    </div>
  );
};

export default AuthTopBar;
