import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";

/** Thẻ mời nâng cấp Pro chèn vào luồng khi học viên gói Free có video Pro bị ẩn (AC-TC-32). */
export default function UpsellSlide() {
  const { t } = useTranslation("watch");
  const navigate = useNavigate();
  return (
    <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-[#2a2140] to-[#14121c] px-6 py-8 text-center text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
      <span className="grid size-14 place-items-center rounded-full bg-[#fcd34d]/15 text-[#fcd34d]">
        <Icon name="crown" className="size-7" />
      </span>
      <h2 className="text-xl font-bold">{t("upsell.title")}</h2>
      <p className="text-sm leading-relaxed text-white/75">{t("upsell.desc")}</p>
      <Button leftIcon={<Icon name="sparkles" />} onClick={() => navigate("/pricing")}>
        {t("upsell.cta")}
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-white/55">
        <Icon name="chevron-down" className="size-3.5" />
        {t("upsell.next")}
      </p>
    </div>
  );
}
