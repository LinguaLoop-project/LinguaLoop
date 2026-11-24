import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { LearnCard } from "../../types";
import { ListenButton } from "./shared";

/** "Xem từ vựng": các thẻ của lượt vừa học dưới dạng bảng từ, phiên âm, nghĩa và nút nghe. */
export default function WordsList({ cards, round, onBack }: { cards: LearnCard[]; round: number; onBack: () => void }) {
  const { t } = useTranslation("vocab");
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
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
            <tr key={card.id} className="border-t border-border align-top transition-colors hover:bg-surface-hover/50">
              <td className="py-2.5 pr-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    to={`/student/dictionary/${encodeURIComponent(card.word)}`}
                    lang="en"
                    className="font-bold text-text transition-colors hover:text-primary-text"
                  >
                    {card.word}
                  </Link>
                  {card.pos && <Badge variant="default">{card.pos}</Badge>}
                </div>
                {card.ipaUs && <div className="font-mono text-xs text-text-muted">{card.ipaUs}</div>}
              </td>
              <td className="py-2.5 pr-3 text-sm">{card.meaningVi}</td>
              <td className="py-1.5 text-right">
                <ListenButton card={card} label={t("learn.words.listen", { word: card.word })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
