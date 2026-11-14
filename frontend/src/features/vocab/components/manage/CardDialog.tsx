import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import SearchInput from "@/components/common/SearchInput";
import TextField from "@/components/common/TextField";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/stores/toastStore";
import { normalizeWord, useDictionarySearch, type WordView } from "@/features/dictionary";
import {
  EMPTY_CARD,
  IPA_MAX,
  TEXT_MAX,
  WORD_MAX,
  cardValuesFromDictionary,
  cardValuesOf,
  contentFailure,
  hasCardContent,
  toCardInput,
  validateCard,
  type CardErrors,
  type CardField,
  type CardFormValues,
  type ContentFailure,
  type DictionaryChoice,
} from "../../deckContentForm";
import { useSaveCard } from "../../deckContentHooks";
import { validateDeckImage } from "../../createDeckForm";
import { CARD_POS } from "../../deckContentTypes";
import type { DeckApiError, DeckCard } from "../../deckManageTypes";

export interface CardDialogProps {
  deckId: string;
  groupId: string;
  groupName: string;
  /** `null` = thêm thẻ (UC-NT-04); có thẻ = sửa thẻ (UC-NT-05). */
  card: DeckCard | null;
  onClose: () => void;
  onFailure: (failure: ContentFailure) => void;
}

const TITLE_ID = "card-dialog-title";
const DEBOUNCE_MS = 250;
/** Số nghĩa gợi ý tối đa hiện dưới ô tìm, đủ để chọn mà không làm hộp quá dài. */
const MAX_CHOICES = 8;

const MAX_BY_FIELD: Record<CardField, number> = {
  word: WORD_MAX,
  meaningVi: TEXT_MAX,
  ipaUk: IPA_MAX,
  ipaUs: IPA_MAX,
  pos: TEXT_MAX,
  definitionEn: TEXT_MAX,
  definitionVi: TEXT_MAX,
  exampleEn: TEXT_MAX,
  exampleVi: TEXT_MAX,
};

/** Mỗi nghĩa của mỗi loại từ là một gợi ý; phiên âm của loại từ, thiếu thì lấy phiên âm chung của từ. */
function choicesOf(words: WordView[]): DictionaryChoice[] {
  const choices: DictionaryChoice[] = [];
  for (const word of words) {
    for (const group of word.groups) {
      for (const meaning of group.meanings) {
        choices.push({
          headword: word.headword,
          pos: group.pos,
          ipaUk: group.pronunciation.ipaUk ?? word.pronunciation.ipaUk,
          ipaUs: group.pronunciation.ipaUs ?? word.pronunciation.ipaUs,
          translationVi: meaning.translationVi,
          definitionEn: meaning.definitionEn,
          definitionVi: meaning.definitionVi,
          exampleEn: meaning.exampleEn,
          exampleVi: meaning.exampleVi,
        });
      }
    }
  }
  return choices.slice(0, MAX_CHOICES);
}

/**
 * Biểu mẫu thẻ (BR-NT-03) có ô tìm trong từ điển để điền sẵn (luồng 6a, BR-NT-08). Khi sửa thẻ, hoặc biểu mẫu đã có
 * nội dung, chọn một nghĩa phải xác nhận trước vì sẽ thay toàn bộ thông tin (luồng 6c). Lỗi hiện cạnh từng ô và giữ
 * nguyên các ô khác (luồng 8a, 8b); mất kết nối giữ nguyên biểu mẫu để lưu lại (luồng 9a).
 */
export default function CardDialog({ deckId, groupId, groupName, card, onClose, onFailure }: Readonly<CardDialogProps>) {
  const { t } = useTranslation("vocab");
  const save = useSaveCard(deckId, groupId);
  const [values, setValues] = useState<CardFormValues>(card ? cardValuesOf(card) : EMPTY_CARD);
  const [errors, setErrors] = useState<CardErrors>({});
  const [takenAt, setTakenAt] = useState<{ word: string; groupName: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingChoice, setPendingChoice] = useState<DictionaryChoice | null>(null);
  // Ảnh (BR-NT-03): ảnh mới chọn, hoặc bỏ ảnh hiện có; cả hai trống = giữ ảnh.
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  // URL xem trước của ảnh mới chọn; thu hồi khi đổi ảnh hoặc đóng hộp để không giữ tệp trong bộ nhớ.
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);
  const shownImage = preview ?? (removeImage ? null : (card?.imageUrl ?? null));

  const chooseImage = (file: File | null) => {
    if (!file) return;
    const invalid = validateDeckImage(file);
    if (invalid) {
      setImageError(invalid);
      return;
    }
    setImageError(null);
    setImage(file);
    setRemoveImage(false);
  };

  const clearImage = () => {
    setImage(null);
    setRemoveImage(Boolean(card?.imageUrl));
    setImageError(null);
  };
  const query = normalizeWord(useDebounce(search, DEBOUNCE_MS));
  const dictionary = useDictionarySearch(query);
  const choices = query && dictionary.data ? choicesOf(dictionary.data) : [];

  const setField = (field: CardField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "word") setTakenAt(null);
  };

  const applyChoice = (choice: DictionaryChoice) => {
    setValues(cardValuesFromDictionary(choice));
    setErrors({});
    setTakenAt(null);
    setPendingChoice(null);
    setSearch("");
  };

  const pickChoice = (choice: DictionaryChoice) => {
    if (card || hasCardContent(values)) setPendingChoice(choice);
    else applyChoice(choice);
  };

  const errorText = (field: CardField): string | undefined => {
    const code = errors[field];
    if (!code) return undefined;
    if (code === "Duplicate") {
      return takenAt
        ? t("content.card.errors.DuplicateAt", { word: takenAt.word, group: takenAt.groupName })
        : t("content.card.errors.Duplicate");
    }
    return t(`content.card.errors.${code}`, {
      field: t(`content.card.fields.${field}`),
      max: MAX_BY_FIELD[field],
      defaultValue: t("content.card.errors.Pattern"),
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailed(false);
    const invalid = validateCard(values);
    if (Object.keys(invalid).length > 0) {
      setErrors(invalid);
      return;
    }
    const input = toCardInput(values);
    save.mutate(
      { cardId: card?.id ?? null, card: input, image, removeImage },
      {
        onSuccess: (saved) => {
          toast(t(card ? "content.feedback.cardUpdated" : "content.feedback.cardAdded", { word: saved.word }), {
            icon: "circle-check",
          });
          onClose();
        },
        onError: (e: unknown) => {
          const failure = contentFailure(e as DeckApiError);
          if (failure.kind === "fields") {
            const { image: imageCode, ...fieldErrors } = failure.errors;
            setErrors(fieldErrors as CardErrors);
            setImageError(imageCode ?? null);
            setTakenAt(failure.wordTaken ?? null);
          } else if (failure.kind === "retry") {
            setFailed(true);
          } else {
            onFailure(failure);
            onClose();
          }
        },
      },
    );
  };

  const field = (name: CardField, extra?: { autoFocus?: boolean; placeholder?: string }) => (
    <TextField
      id={`card-${name}`}
      label={t(`content.card.fields.${name}`)}
      requiredMark={name === "word" || name === "meaningVi"}
      value={values[name]}
      error={errorText(name)}
      onChange={(e) => setField(name, e.target.value)}
      {...extra}
    />
  );

  const suggestions = () => {
    if (!query) return <p className="text-[13px] text-text-subtle">{t("content.card.dictionary.hint")}</p>;
    if (dictionary.isPending) return <p className="text-[13px] text-text-muted">{t("content.card.dictionary.loading")}</p>;
    if (choices.length === 0) {
      return <p className="text-[13px] text-text-muted">{t("content.card.dictionary.noResult")}</p>;
    }
    return (
      <ul className="flex max-h-56 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
        {choices.map((choice, index) => (
          <li key={`${choice.headword}-${choice.pos ?? ""}-${index}`}>
            <button
              type="button"
              onClick={() => pickChoice(choice)}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-hover"
            >
              <span className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-text">{choice.headword}</span>
                {choice.pos && (
                  <span className="text-xs text-text-muted">
                    {t(`content.pos.${choice.pos}`, { defaultValue: choice.pos })}
                  </span>
                )}
                {choice.translationVi && <span className="text-sm text-text">{choice.translationVi}</span>}
              </span>
              {choice.definitionEn && (
                <span className="line-clamp-1 text-[13px] text-text-muted">{choice.definitionEn}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={TITLE_ID} wide>
      <form onSubmit={submit} noValidate className="flex max-h-[80vh] flex-col gap-4">
        <div>
          <h2 id={TITLE_ID} className="text-lg font-bold text-text">
            {t(card ? "content.card.editTitle" : "content.card.addTitle")}
          </h2>
          <p className="text-sm text-text-muted">{t("content.card.intoGroup", { name: groupName })}</p>
        </div>

        <div className="-mx-1 flex flex-col gap-4 overflow-y-auto px-1">
          <section className="flex flex-col gap-2 rounded-lg bg-surface-hover/40 p-3">
            <label htmlFor="card-dictionary" className="flex items-center gap-1.5 text-sm font-semibold text-text">
              <Icon name="book-open-text" />
              {t("content.card.dictionary.label")}
            </label>
            <SearchInput
              id="card-dictionary"
              value={search}
              onChange={setSearch}
              placeholder={t("content.card.dictionary.placeholder")}
              ariaLabel={t("content.card.dictionary.label")}
              autoComplete="off"
              autoFocus={!card}
            />
            {pendingChoice ? (
              <FormAlert variant="warning" role="alert">
                <p className="font-semibold">{t("content.card.dictionary.replaceTitle")}</p>
                <p>{t("content.card.dictionary.replaceText", { word: pendingChoice.headword })}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => applyChoice(pendingChoice)}>
                    {t("content.card.dictionary.replaceConfirm")}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setPendingChoice(null)}>
                    {t("content.card.dictionary.keep")}
                  </Button>
                </div>
              </FormAlert>
            ) : (
              suggestions()
            )}
          </section>

          {failed && <FormAlert variant="danger">{t("content.feedback.saveFailed")}</FormAlert>}

          <div className="flex items-center gap-4">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border-strong bg-bg-elevated text-3xl text-text-subtle">
              {shownImage ? <img src={shownImage} alt="" className="h-full w-full object-cover" /> : <Icon name="image-plus" />}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-text">{t("content.card.fields.image")}</span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" leftIcon={<Icon name="upload" />} onClick={() => imageInput.current?.click()}>
                  {t(shownImage ? "content.card.image.change" : "content.card.image.choose")}
                </Button>
                {shownImage && (
                  <Button size="sm" variant="ghost" leftIcon={<Icon name="trash-2" />} onClick={clearImage}>
                    {t("content.card.image.remove")}
                  </Button>
                )}
              </div>
              {imageError ? (
                <p className="text-[13px] text-danger">{t(`content.card.image.errors.${imageError}`, { defaultValue: t("content.card.image.errors.ImageType") })}</p>
              ) : (
                <p className="text-[13px] text-text-subtle">{t("content.card.image.hint")}</p>
              )}
              <input
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  chooseImage(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {field("word", { autoFocus: Boolean(card) })}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="card-pos" className="text-sm font-semibold text-text">
                {t("content.card.fields.pos")}
              </label>
              <select
                id="card-pos"
                value={values.pos}
                onChange={(e) => setField("pos", e.target.value)}
                className="h-12 rounded-md border border-border-strong bg-surface px-3 text-[15px] text-text focus:border-primary focus:outline-none"
              >
                <option value="">{t("content.card.fields.posNone")}</option>
                {CARD_POS.map((pos) => (
                  <option key={pos} value={pos}>
                    {t(`content.pos.${pos}`)}
                  </option>
                ))}
              </select>
              {errors.pos && <p className="text-[13px] text-danger">{errorText("pos")}</p>}
            </div>
            {field("ipaUk", { placeholder: "/səˈsteɪn/" })}
            {field("ipaUs", { placeholder: "/səˈsteɪn/" })}
          </div>
          {field("meaningVi")}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("definitionEn")}
            {field("definitionVi")}
            {field("exampleEn")}
            {field("exampleVi")}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            {t("content.card.cancel")}
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            {t("content.card.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
