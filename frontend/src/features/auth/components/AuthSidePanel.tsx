import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import Logo from "@/components/common/Logo";
import Mascot from "@/components/common/Mascot";

const POINTS = [
  { icon: "headphones", key: "dictation" },
  { icon: "mic", key: "pronunciation" },
  { icon: "layers", key: "srs" },
] as const;

/** Cột trái của màn đăng nhập/đăng ký (`.auth-side`): dính theo chiều cao màn hình, thương hiệu, thẻ giới thiệu có Loopi, câu chốt. */
export const AuthSidePanel: React.FC = () => {
  const { t } = useTranslation("auth");

  return (
    <aside className="sticky top-0 hidden h-screen flex-col justify-between gap-8 overflow-hidden border-r border-border bg-bg-elevated px-8 py-8 md:flex xl:px-12">
      <Link to="/" className="flex w-fit items-center gap-2" aria-label={t("sidePanel.homeLabel")}>
        <Logo size={32} />
      </Link>

      <div className="relative max-w-[460px]">
        <div className="rounded-xl border border-border-strong bg-surface-glass p-8 backdrop-blur-[20px]">
          <Mascot mood="hello" size={120} alt={t("sidePanel.loopiAlt")} className="-ml-2.5 -mt-3 mb-2" />
          <h2 className="mb-6 text-[32px] font-bold leading-[1.15]">
            {t("sidePanel.headline")}
            <br />
            {t("sidePanel.headlineSub")}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {POINTS.map((p) => (
              <li key={p.key} className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-primary-soft text-[22px] text-accent">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <b className="block text-[15px]">{t(`sidePanel.features.${p.key}.title`)}</b>
                  <span className="text-[13px] leading-normal text-text-muted">{t(`sidePanel.features.${p.key}.desc`)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[13px] leading-normal text-text-muted">{t("sidePanel.tagline")}</p>
    </aside>
  );
};

export default AuthSidePanel;
