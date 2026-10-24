import { useMemo } from "react";
import { splitWords } from "../utils";
import LookupWord from "./LookupWord";

export interface ClickableTextProps {
  text: string;
  /** Class thêm cho từng chữ bấm được. */
  wordClassName?: string;
}

/** Hiện một đoạn tiếng Anh, mỗi chữ bấm vào là tra từ; dấu câu và khoảng trắng giữ nguyên. */
export default function ClickableText({ text, wordClassName }: ClickableTextProps) {
  const parts = useMemo(() => splitWords(text), [text]);
  return (
    <>
      {parts.map((part, i) =>
        part.isWord ? (
          <LookupWord key={i} word={part.text} className={wordClassName} />
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
