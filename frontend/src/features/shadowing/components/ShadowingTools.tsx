import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import type { SentenceResponse } from "@/features/lesson/types";
import NotePanel from "@/features/practice/components/NotePanel";
import ReviewPinButton from "@/features/practice/components/ReviewPinButton";
import { useDeleteNote, useSaveNote, useSetReview } from "@/features/practice/hooks";
import HistoryPanel from "./HistoryPanel";

const K = "student.shadowingPractice";

export type ToolPanel = "note" | "history";

export interface ShadowingToolsProps {
  sentence: SentenceResponse;
  /** Câu đang trong Câu cần ôn của Shadowing. */
  pinned: boolean;
  /** Ghi chú của câu; null nếu chưa có. */
  note: string | null;
  panel: ToolPanel | null;
  onPanelChange: (panel: ToolPanel | null) => void;
}

/**
 * Công cụ của một câu đã đọc: ghim vào Câu cần ôn, ghi chú riêng của Shadowing (độc lập với nghe chép) và lịch sử các lượt đọc.
 * Backend chỉ nhận ghim và ghi chú cho câu đã có lượt đọc nên thanh này chỉ hiện ở câu đã đọc.
 */
export default function ShadowingTools({ sentence, pinned, note, panel, onPanelChange }: ShadowingToolsProps) {
  const { t } = useTranslation(["pages", "practice"]);
  const setReview = useSetReview("shadowing");
  const saveNote = useSaveNote("shadowing");
  const deleteNote = useDeleteNote("shadowing");
  const toggle = (next: ToolPanel) => onPanelChange(panel === next ? null : next);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <ReviewPinButton sentenceId={sentence.id} pinned={pinned} setReview={setReview} />
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={panel === "note"}
          aria-keyshortcuts="N"
          leftIcon={<Icon name="sticky-note" />}
          onClick={() => toggle("note")}
        >
          {t(note ? "practice:note.edit" : "practice:note.add")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={panel === "history"}
          leftIcon={<Icon name="history" />}
          onClick={() => toggle("history")}
        >
          {t(`pages:${K}.tools.history`)}
        </Button>
      </div>
      {panel === "note" && (
        <NotePanel key={sentence.id} sentenceId={sentence.id} note={note} save={saveNote} remove={deleteNote} />
      )}
      {panel === "history" && <HistoryPanel key={sentence.id} sentenceId={sentence.id} sentenceText={sentence.text} />}
    </div>
  );
}
