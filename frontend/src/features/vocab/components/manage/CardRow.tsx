import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { playPronunciation, type Accent } from "@/features/dictionary";
import { formatIpa, splitByWord } from "../../deckContentForm";
import type { DeckCard } from "../../deckManageTypes";

export interface CardRowActions {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export interface CardRowProps {
  card: DeckCard;
  posLabel: string | null;
  actions?: CardRowActions;
}

/** Câu ví dụ với từ vựng được tô đậm để giáo viên thấy từ được dùng ở đâu. */
function Highlighted({ sentence, word }: Readonly<{ sentence: string; word: string }>) {
  return (
    <>
      {splitByWord(sentence, word).map((part, i) =>
        part.match ? (
          <strong key={`${i}-${part.text}`} className="font-semibold not-italic text-fn-vocab">
            {part.text}
          </strong>
        ) : (
          <span key={`${i}-${part.text}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

function Pronunciation({ word, accent, ipa, audio }: Readonly<{ word: string; accent: Accent; ipa: string | null; audio: string | null }>) {
  const { t } = useTranslation("vocab");
  const label = accent.toUpperCase();
  return (
    <button
      type="button"
      onClick={() => playPronunciation(word, accent, audio)}
      aria-label={t("content.card.view.listen", { accent: label })}
      title={t("content.card.view.listen", { accent: label })}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-fn-vocab hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
    >
      <Icon name="volume-2" className="text-sm text-fn-vocab" />
      <span className="font-semibold text-text">{label}</span>
      {ipa && <span className="font-mono">{formatIpa(ipa)}</span>}
    </button>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <>
      <dt className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="min-w-0 text-sm leading-relaxed text-text">{children}</dd>
    </>
  );
}

function LangTag({ children }: Readonly<{ children: string }>) {
  return (
    <span className="mr-1.5 inline-block rounded bg-surface-hover px-1 py-px align-[1px] text-[10px] font-semibold not-italic text-text-muted">
      {children}
    </span>
  );
}

/**
 * Một thẻ trong danh sách thẻ của nhóm: ảnh, từ vựng, loại từ, phát âm UK/US (bấm để nghe), rồi từng trường có nhãn
 * (nghĩa, định nghĩa, ví dụ). Trường trống không hiện. Nút sửa/xóa luôn hiện cho giáo viên.
 */
export default function CardRow({ card, posLabel, actions }: Readonly<CardRowProps>) {
  const { t } = useTranslation("vocab");
  const hasDefinition = Boolean(card.definitionEn ?? card.definitionVi);
  const hasExample = Boolean(card.exampleEn ?? card.exampleVi);

  return (
    <li className="flex gap-4 p-4">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-[linear-gradient(135deg,var(--fn-vocab-soft),transparent)]">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.word} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span role="img" aria-label={t("content.card.view.noImage")} className="text-2xl text-text-muted opacity-50">
            <Icon name="image" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="break-words text-lg font-bold leading-tight text-text">{card.word}</h3>
            {posLabel && (
              <span className="rounded-full bg-fn-vocab-soft px-2 py-0.5 text-xs font-medium text-fn-vocab">
                {posLabel}
              </span>
            )}
          </div>
          {actions && (
            <div className="-mr-1 -mt-1 flex shrink-0 gap-0.5">
              <Button
                size="sm"
                variant="text"
                iconOnly
                aria-label={actions.editLabel}
                title={actions.editLabel}
                onClick={actions.onEdit}
              >
                <Icon name="pencil-line" />
              </Button>
              <Button
                size="sm"
                variant="text"
                iconOnly
                aria-label={actions.deleteLabel}
                title={actions.deleteLabel}
                onClick={actions.onDelete}
                className="hover:text-danger"
              >
                <Icon name="trash-2" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Pronunciation word={card.word} accent="uk" ipa={card.ipaUk} audio={card.audioUk} />
          <Pronunciation word={card.word} accent="us" ipa={card.ipaUs} audio={card.audioUs} />
        </div>

        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2">
          <Field label={t("content.card.view.meaning")}>
            <span className="font-medium">{card.meaningVi}</span>
          </Field>
          {hasDefinition && (
            <Field label={t("content.card.view.definition")}>
              {card.definitionEn && (
                <p>
                  <LangTag>EN</LangTag>
                  {card.definitionEn}
                </p>
              )}
              {card.definitionVi && (
                <p className="text-text-muted">
                  <LangTag>VI</LangTag>
                  {card.definitionVi}
                </p>
              )}
            </Field>
          )}
          {hasExample && (
            <Field label={t("content.card.view.example")}>
              {card.exampleEn && (
                <p className="italic">
                  <LangTag>EN</LangTag>
                  <Highlighted sentence={card.exampleEn} word={card.word} />
                </p>
              )}
              {card.exampleVi && (
                <p className="italic text-text-muted">
                  <LangTag>VI</LangTag>
                  {card.exampleVi}
                </p>
              )}
            </Field>
          )}
        </dl>
      </div>
    </li>
  );
}
