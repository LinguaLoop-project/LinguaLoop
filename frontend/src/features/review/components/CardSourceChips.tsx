import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import { cardSourceParts, hasFilledCards } from "../flow";
import type { CardSources } from "../types";

const TONE = { due: "danger", newWords: "info", reinforce: "warning" } as const;

/**
 * Ghi rõ phần thẻ của phiên hôm nay gồm những nguồn nào (BR-HT-29), vd "8 đến hạn · 5 từ mới · 7 củng cố", để học viên
 * biết vì sao bài hôm nay nhiều hay ít. Chỉ hiện khi phiên có từ mới hoặc thẻ củng cố.
 */
export default function CardSourceChips({ sources }: Readonly<{ sources: CardSources | null | undefined }>) {
  const { t } = useTranslation("review");
  if (!hasFilledCards(sources)) return null;
  return (
    <ul aria-label={t("source.chipsLabel")} className="flex flex-wrap items-center gap-1.5">
      {cardSourceParts(sources).map(({ key, count }) => (
        <li key={key}>
          <Badge variant={TONE[key]}>{t(`source.${key}`, { count })}</Badge>
        </li>
      ))}
    </ul>
  );
}
