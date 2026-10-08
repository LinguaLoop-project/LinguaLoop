import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const AuthSidePanel: React.FC = () => {
  const { t } = useTranslation("auth");

  return (
    <aside className="auth-side">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 w-fit" aria-label={t("sidePanel.homeLabel")}>
        <svg className="ll-brand-mark" viewBox="0 0 100 100" aria-hidden="true">
          <use href="#logo-mark" />
        </svg>
        <span className="ll-wordmark">
          Lingua<b className="ll-loop">Loop</b>
        </span>
      </Link>

      {/* Hero card */}
      <div className="auth-hero relative max-w-[460px]">
        {/* Glass card */}
        <div className="auth-hero-card ll-glass ll-spotlight">
          <img
            src="/loopi-hello.svg"
            width={120}
            height={120}
            alt={t("sidePanel.loopiAlt")}
            draggable={false}
            style={{ margin: "-12px 0 8px -10px" }}
          />
          <h2
            style={{
              fontSize: 32,
              lineHeight: 1.15,
              marginBottom: 24,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            {t("sidePanel.headline")}<br />
            {t("sidePanel.headlineSub")}
          </h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
            <li className="flex gap-[14px] items-start">
              <span className="ll-sec-ic">
                <i className="ph-duotone ph-headphones" />
              </span>
              <div>
                <b className="block text-[15px] mb-0.5">{t("sidePanel.features.dictation.title")}</b>
                <span className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  {t("sidePanel.features.dictation.desc")}
                </span>
              </div>
            </li>
            <li className="flex gap-[14px] items-start">
              <span className="ll-sec-ic">
                <i className="ph-duotone ph-microphone" />
              </span>
              <div>
                <b className="block text-[15px] mb-0.5">{t("sidePanel.features.pronunciation.title")}</b>
                <span className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  {t("sidePanel.features.pronunciation.desc")}
                </span>
              </div>
            </li>
            <li className="flex gap-[14px] items-start">
              <span className="ll-sec-ic">
                <i className="ph-duotone ph-cards" />
              </span>
              <div>
                <b className="block text-[15px] mb-0.5">{t("sidePanel.features.srs.title")}</b>
                <span className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  {t("sidePanel.features.srs.desc")}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer tagline */}
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {t("sidePanel.tagline")}
      </p>
    </aside>
  );
};

export default AuthSidePanel;
