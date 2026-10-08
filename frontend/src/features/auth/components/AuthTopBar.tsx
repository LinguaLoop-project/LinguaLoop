import React, { useState, useEffect } from "react";

export const AuthTopBar: React.FC = () => {
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
      <div className="flex items-center gap-2 md:hidden">
        <svg className="ll-brand-mark" viewBox="0 0 100 100" aria-hidden="true">
          <use href="#logo-mark" />
        </svg>
        <span className="ll-wordmark">
          Lingua<b className="ll-loop">Loop</b>
        </span>
      </div>

      <div className="flex-1" />

      {/* UX notes hint */}
      <button
        type="button"
        className="ll-ux-btn"
        title="Ghi chú UX"
        onClick={() => {
          alert("LinguaLoop UX: Giao diện tối ưu hoá cho việc học ngoại ngữ tập trung, tự động lưu tiến trình và hỗ trợ phím tắt tiện lợi.");
        }}
      >
        <i className="ph ph-lightbulb" />
        <span className="hidden sm:inline">Ghi chú UX</span>
      </button>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="ll-icon-btn"
        aria-label="Đổi giao diện sáng/tối"
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
