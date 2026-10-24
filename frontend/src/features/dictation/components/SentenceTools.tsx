import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import { toast } from "@/stores/toastStore";
import { useSetReview } from "../hooks";
import type { DictationSentence } from "../types";
import { isNetworkError } from "../utils";
import HistoryPanel from "./HistoryPanel";
import NotePanel from "./NotePanel";

export type ToolPanel = "note" | "history";

export interface SentenceToolsProps {
  slug: string;
  sentence: DictationSentence;
  panel: ToolPanel | null;
  onPanelChange: (panel: ToolPanel | null) => void;
  showTranslation: boolean;
}

/**
 * Công cụ của một câu đã làm: ghim vào Câu cần ôn, ghi chú riêng và lịch sử các lượt làm. Backend chỉ nhận ghim và
 * ghi chú cho câu đã có lượt làm nên thanh này chỉ hiện ở câu đã làm.
 */
export default function SentenceTools({ slug, sentence, panel, onPanelChange, showTranslation }: SentenceToolsProps) {
  const { t } = useTranslation("dictation");
  const setReview = useSetReview(slug);
  const toggle = (next: ToolPanel) => onPanelChange(panel === next ? null : next);

  const togglePin = () => {
    const pinned = !sentence.inReview;
    setReview.mutate(
      { sentenceId: sentence.id, pinned },
      {
        onSuccess: () =>
          toast(t(pinned ? "tools.pinned" : "tools.unpinned"), { icon: pinned ? "pin" : "pin-off" }),
        onError: (error) => toast(isNetworkError(error) ? t("note.offline") : t("tools.pinFailed"), { icon: "circle-alert" }),
      },
    );
  };

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={sentence.inReview}
          disabled={setReview.isPending}
          leftIcon={<Icon name={sentence.inReview ? "pin-off" : "pin"} />}
          onClick={togglePin}
        >
          {t(sentence.inReview ? "tools.unpin" : "tools.pin")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={panel === "note"}
          aria-keyshortcuts="N"
          leftIcon={<Icon name="sticky-note" />}
          onClick={() => toggle("note")}
        >
          {t(sentence.note ? "tools.noteEdit" : "tools.noteAdd")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={panel === "history"}
          leftIcon={<Icon name="history" />}
          onClick={() => toggle("history")}
        >
          {t("tools.history")}
        </Button>
      </div>
      {panel === "note" && <NotePanel key={sentence.id} slug={slug} sentenceId={sentence.id} note={sentence.note} />}
      {panel === "history" && (
        <HistoryPanel key={sentence.id} sentenceId={sentence.id} showTranslation={showTranslation} />
      )}
    </div>
  );
}
