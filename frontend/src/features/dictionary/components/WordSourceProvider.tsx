import type { ReactNode } from "react";
import { WordSourceContext } from "./wordSource";

export interface WordSourceProviderProps {
  /** Câu đang hiện; các chữ bấm tra từ bên trong sẽ lưu từ kèm câu này. */
  sentenceId: string | undefined;
  children: ReactNode;
}

/** Bọc quanh phần hiện chữ của một câu để từ lưu từ đó nhớ nguồn là câu này. */
export default function WordSourceProvider({ sentenceId, children }: WordSourceProviderProps) {
  return <WordSourceContext.Provider value={sentenceId || undefined}>{children}</WordSourceContext.Provider>;
}
