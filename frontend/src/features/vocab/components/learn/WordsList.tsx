import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { LearnCard } from "../../types";
import { ListenButton } from "./shared";

/** "Xem từ vựng": các thẻ của lượt vừa học dưới dạng bảng từ, phiên âm, nghĩa và nút nghe. */
export default function WordsList({ cards, round, onBack }: { cards: LearnCard[]; round: number; onBack: () => void }) {
  const { t } = useTranslation("vocab");
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{t("learn.words.title", { round })}</h3>
        <Button variant="ghost" size="sm" leftIcon={<Icon name="arrow-left" />} onClick={onBack}>
          {t("learn.words.back")}
        </Button>
      </div>
      <table className="w-full text-left">
        <thead className="text-xs uppercase tracking-wider text-text-muted">
          <tr>
            <th className="py-1.5 font-bold">{t("learn.words.word")}</th>
            <th className="py-1.5 font-bold">{t("learn.words.meaning")}</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.id} className="border-t border-border align-top">
              <td className="py-2 pr-3">
                <b lang="en">{card.word}</b>
                {card.ipaUs && <div className="text-xs text-text-muted">{card.ipaUs}</div>}
              </td>
              <td className="py-2 pr-3 text-sm">{card.translationVi}</td>
              <td className="py-1 text-right">
                <ListenButton card={card} label={t("learn.words.listen", { word: card.word })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
