import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { buttonClasses } from "@/components/common/buttonStyles";
import { myDeckPath } from "../../deckManagePaths";
import type { MyDeck } from "../../myDecks";

export interface MyDeckCardProps {
  deck: MyDeck;
  onRename: (deck: MyDeck) => void;
  onDelete: (deck: MyDeck) => void;
}

/** Một bộ trong "Bộ của tôi": tên, số thẻ, số thẻ đến hạn và hai nút Sửa tên, Xóa (UC-HT-08). */
export default function MyDeckCard({ deck, onRename, onDelete }: Readonly<MyDeckCardProps>) {
  const { t } = useTranslation("vocab");
  return (
    <article
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
      aria-label={deck.name}
      data-my-deck={deck.id}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-md bg-[var(--fn-vocab-soft)] text-fn-vocab">
          <Icon name="layers" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-[17px] font-bold">
            <Link to={myDeckPath(deck.id)} className="hover:underline focus-visible:underline">
              {deck.name}
            </Link>
          </h3>
          <p className="text-[13px] text-text-muted">{t("mine.card.cards", { count: deck.cardCount })}</p>
        </div>
      </div>
      <p className={`text-[13px] ${deck.dueCount > 0 ? "font-semibold text-danger" : "text-text-muted"}`}>
        {deck.dueCount > 0 ? t("mine.card.due", { count: deck.dueCount }) : t("mine.card.noDue")}
      </p>
      <div className="flex flex-wrap justify-end gap-1.5">
        <Link to={myDeckPath(deck.id)} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          <Icon name="layers" />
          {t("mine.card.open")}
        </Link>
        <Button variant="ghost" size="sm" leftIcon={<Icon name="pencil" />} onClick={() => onRename(deck)}>
          {t("mine.card.rename")}
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<Icon name="trash-2" />} onClick={() => onDelete(deck)}>
          {t("mine.card.delete")}
        </Button>
      </div>
    </article>
  );
}
