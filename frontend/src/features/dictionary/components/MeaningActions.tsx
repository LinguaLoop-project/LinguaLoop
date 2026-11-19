import { useState } from "react";
import { QuickAddPanel, QuickAddToggle } from "@/features/vocab";
import SaveWordButton from "./SaveWordButton";
import { useWordSourceSentence } from "./wordSource";

export interface MeaningActionsProps {
  headword: string;
  /** Số thứ tự nghĩa trong mục từ (`Meaning.no`). */
  meaningNo: number;
}

/**
 * Các nút ở dòng của một nghĩa: "Lưu" (UC-HT-06) và "Thêm vào bộ" (UC-HT-10). Khung chọn bộ và nhóm mở ngay dưới dòng
 * nghĩa; bấm trong câu của bài học thì thẻ thêm vào nhớ câu đó (BR-HT-28). Render trong dòng có `flex-wrap`.
 */
export default function MeaningActions({ headword, meaningNo }: Readonly<MeaningActionsProps>) {
  const sentenceId = useWordSourceSentence();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-none items-center gap-1.5">
        <SaveWordButton headword={headword} meaningNo={meaningNo} />
        <QuickAddToggle headword={headword} open={open} onToggle={() => setOpen((value) => !value)} />
      </div>
      {open && (
        <div className="basis-full">
          <QuickAddPanel headword={headword} meaningNo={meaningNo} sentenceId={sentenceId} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
