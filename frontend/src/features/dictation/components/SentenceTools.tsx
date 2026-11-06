import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import NotePanel from "@/features/practice/components/NotePanel";
import ReviewPinButton from "@/features/practice/components/ReviewPinButton";
import { useDeleteNote, useSaveNote, useSetReview } from "../hooks";
import type { DictationSentence } from "../types";
import HistoryPanel from "./HistoryPanel";

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
  const { t } = useTranslation(["dictation", "practice"]);
  const setReview = useSetReview(slug);
  const saveNote = useSaveNote(slug);
  const deleteNote = useDeleteNote(slug);
  const toggle = (next: ToolPanel) => onPanelChange(panel === next ? null : next);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <ReviewPinButton sentenceId={sentence.id} pinned={sentence.inReview} setReview={setReview} />
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={panel === "note"}
          aria-keyshortcuts="N"
          leftIcon={<Icon name="sticky-note" />}
          onClick={() => toggle("note")}
        >
          {t(sentence.note ? "practice:note.edit" : "practice:note.add")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={panel === "history"}
          leftIcon={<Icon name="history" />}
          onClick={() => toggle("history")}
        >
          {t("dictation:tools.history")}
        </Button>
      </div>
      {panel === "note" && (
        <NotePanel key={sentence.id} sentenceId={sentence.id} note={sentence.note} save={saveNote} remove={deleteNote} />
      )}
      {panel === "history" && (
        <HistoryPanel key={sentence.id} sentenceId={sentence.id} showTranslation={showTranslation} />
      )}
    </div>
  );
}
