import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";
import { NETWORK_ERROR, toApiError } from "@/features/auth";
import { findSaved, useSaveWord, useSavedWords, useUnsaveWord } from "@/features/vocab";
import { toast } from "@/stores/toastStore";
import { useWordSourceSentence } from "./wordSource";

export interface SaveWordButtonProps {
  headword: string;
  /** Số thứ tự nghĩa trong mục từ (`Meaning.no`). */
  meaningNo: number;
}

/** Lưu hoặc bỏ lưu một nghĩa của từ (UC-VOCAB-01). Bấm trong một câu của bài học thì từ nhớ câu đó. */
export default function SaveWordButton({ headword, meaningNo }: SaveWordButtonProps) {
  const { t } = useTranslation("dictionary");
  const sentenceId = useWordSourceSentence();
  const saved = useSavedWords();
  const save = useSaveWord();
  const unsave = useUnsaveWord();
  const current = findSaved(saved.data, headword, meaningNo);
  const busy = save.isPending || unsave.isPending;

  const failure = (error: unknown) =>
    toast(toApiError(error).code === NETWORK_ERROR ? t("save.offline") : t("save.failed"), { icon: "circle-alert" });

  const onClick = () => {
    if (current) {
      unsave.mutate(current.id, { onSuccess: () => toast(t("save.removedToast"), { icon: "bookmark" }), onError: failure });
    } else {
      save.mutate(
        { headword, meaningNo, sentenceId },
        { onSuccess: () => toast(t("save.savedToast", { word: headword }), { icon: "bookmark" }), onError: failure },
      );
    }
  };

  const isSaved = current !== undefined;
  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={t(isSaved ? "save.unsaveAria" : "save.saveAria", { word: headword })}
      disabled={busy}
      onClick={onClick}
      className={`inline-flex h-7 flex-none cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
        isSaved
          ? "border-primary bg-primary-soft text-primary-text"
          : "border-border-strong bg-transparent text-text-muted hover:border-primary hover:text-text"
      }`}
    >
      <Icon name="bookmark" className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
      {t(isSaved ? "save.saved" : "save.save")}
    </button>
  );
}
