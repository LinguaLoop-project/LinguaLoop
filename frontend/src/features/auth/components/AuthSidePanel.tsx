import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/components/common/Logo";
import { useSpotlight } from "@/hooks/useSpotlight";

export const AuthSidePanel: React.FC = () => {
  const { t } = useTranslation("auth");
  const { spotlightProps } = useSpotlight();

  return (
    <aside className="relative hidden md:flex flex-col justify-between p-8 lg:p-10 bg-surface border-r border-border overflow-hidden min-h-screen">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 w-fit" aria-label={t("sidePanel.homeLabel")}>
        <Logo size={34} />
      </Link>

      {/* Hero card */}
      <div className="relative max-w-[460px] my-auto py-6">
        {/* Floating 3D Objects */}
        <svg
          className="absolute -top-12 -right-7 z-10 w-[104px] h-[104px] overflow-visible pointer-events-none drop-shadow-[0_18px_24px_rgba(139,92,246,0.35)] animate-[float_7s_ease-in-out_-2s_infinite]"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <use href="#o-orb" />
        </svg>
        <svg
          className="absolute -bottom-9 -left-7 z-10 w-[80px] h-[80px] overflow-visible pointer-events-none drop-shadow-[0_18px_24px_rgba(139,92,246,0.35)] animate-[float_9s_ease-in-out_-5s_infinite]"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <use href="#o-torus" />
        </svg>

        {/* Glass card with spotlight */}
        <div
          {...spotlightProps}
          className="relative p-7 sm:p-8 rounded-2xl bg-surface-glass backdrop-blur-xl border border-border-strong shadow-[var(--shadow-card)]"
        >
          <img
            src="/loopi-hello.svg"
            width={120}
            height={120}
            alt={t("sidePanel.loopiAlt")}
            draggable={false}
            className="-mt-3 mb-2 -ml-2.5 select-none pointer-events-none"
          />
          <h2 className="text-2xl sm:text-[32px] leading-[1.15] font-display font-bold text-text mb-6">
            {t("sidePanel.headline")}<br />
            {t("sidePanel.headlineSub")}
          </h2>
          <ul className="flex flex-col gap-4 list-none p-0 m-0">
            <li className="flex gap-3.5 items-start">
              <span className="w-9 h-9 rounded-md grid place-items-center bg-primary-soft text-accent text-lg shrink-0 mt-0.5">
                <i className="ph-duotone ph-headphones" />
              </span>
              <div>
                <b className="block text-[15px] font-semibold text-text mb-0.5">{t("sidePanel.features.dictation.title")}</b>
                <span className="text-[13px] leading-snug text-text-muted">
                  {t("sidePanel.features.dictation.desc")}
                </span>
              </div>
            </li>
            <li className="flex gap-3.5 items-start">
              <span className="w-9 h-9 rounded-md grid place-items-center bg-primary-soft text-accent text-lg shrink-0 mt-0.5">
                <i className="ph-duotone ph-microphone" />
              </span>
              <div>
                <b className="block text-[15px] font-semibold text-text mb-0.5">{t("sidePanel.features.pronunciation.title")}</b>
                <span className="text-[13px] leading-snug text-text-muted">
                  {t("sidePanel.features.pronunciation.desc")}
                </span>
              </div>
            </li>
            <li className="flex gap-3.5 items-start">
              <span className="w-9 h-9 rounded-md grid place-items-center bg-primary-soft text-accent text-lg shrink-0 mt-0.5">
                <i className="ph-duotone ph-cards" />
              </span>
              <div>
                <b className="block text-[15px] font-semibold text-text mb-0.5">{t("sidePanel.features.srs.title")}</b>
                <span className="text-[13px] leading-snug text-text-muted">
                  {t("sidePanel.features.srs.desc")}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer tagline */}
      <p className="text-[13px] leading-relaxed text-text-muted">
        {t("sidePanel.tagline")}
      </p>
    </aside>
  );
};

export default AuthSidePanel;
