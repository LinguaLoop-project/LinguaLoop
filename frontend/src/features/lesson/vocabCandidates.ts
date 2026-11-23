import { normalizeWord } from "@/features/dictionary";
import type { SentenceResponse } from "./types";

const STOP_WORDS = new Set([
  // Đại từ, từ chỉ định, lượng từ, từ nối, giới từ
  "about", "above", "across", "after", "again", "against", "almost", "alone", "along", "already",
  "although", "always", "among", "another", "anybody", "anyone", "anything", "anyway", "anywhere",
  "around", "became", "because", "become", "becomes", "becoming", "before", "behind", "being",
  "below", "beside", "besides", "better", "between", "beyond", "both", "cannot", "could", "couldn",
  "different", "doing", "during", "either", "enough", "especially", "every", "everybody", "everyone",
  "everything", "everywhere", "except", "finally", "first", "found", "further", "getting", "giving",
  "going", "great", "hardly", "having", "herself", "himself", "however", "inside", "instead", "itself",
  "keeping", "knowing", "later", "least", "leaving", "little", "looking", "making", "maybe", "might",
  "moment", "mostly", "myself", "nearly", "neither", "never", "nobody", "nothing", "number", "often",
  "other", "others", "otherwise", "ourselves", "outside", "people", "perhaps", "person", "place",
  "places", "please", "pretty", "probably", "putting", "quite", "rather", "really", "reason", "right",
  "saying", "second", "seeing", "seemed", "seeming", "several", "should", "shouldn", "simply", "since",
  "somebody", "someone", "something", "sometimes", "somewhere", "still", "taking", "talking", "telling",
  "thank", "thanks", "their", "theirs", "themselves", "there", "therefore", "these", "thing", "things",
  "think", "thinking", "thought", "those", "though", "three", "through", "throughout", "together",
  "today", "tomorrow", "tonight", "toward", "towards", "trying", "turning", "under", "unless", "until",
  "usually", "using", "very", "waiting", "walking", "wanted", "wanting", "watching", "whatever",
  "whenever", "where", "wherever", "whether", "which", "while", "whole", "whose", "within", "without",
  "working", "world", "would", "wouldn", "years", "yesterday", "young", "yourself", "yourselves",
  // Từ quá quen thuộc trong ngữ cảnh học tiếng Anh
  "english", "words", "video", "lesson", "example", "question", "questions", "answer", "answers",
]);

/** Từ loại chức năng, không đáng học riêng. */
export const FUNCTION_POS = new Set(["pronoun", "preposition", "conjunction", "determiner", "article", "interjection"]);

const FALLBACK_WORDS: CandidateWord[] = [
  { word: "spelling", sentenceId: undefined, fallbackMeaning: "chính tả, cách đánh vần" },
  { word: "improve", sentenceId: undefined, fallbackMeaning: "cải thiện, trau dồi" },
  { word: "practice", sentenceId: undefined, fallbackMeaning: "luyện tập, thực hành" },
];

export interface CandidateWord {
  word: string;
  sentenceId?: string;
  fallbackMeaning?: string;
}

/** Rút gọn hậu tố tiếng Anh phổ biến để tránh lấy 2 biến thể chia của cùng một từ gốc. */
export function stemKey(word: string): string {
  if (word.length <= 5) return word;
  if (word.endsWith("ies") && word.length > 6) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ied") && word.length > 6) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ing") && word.length > 6) {
    const base = word.slice(0, -3);
    return base.length >= 4 && base[base.length - 1] === base[base.length - 2] ? base.slice(0, -1) : base;
  }
  if (word.endsWith("ed") && word.length > 6) return word.slice(0, -2);
  if (word.endsWith("ly") && word.length > 6) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 6) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 5) return word.slice(0, -1);
  return word;
}

/**
 * Trích tối đa 5 từ ứng viên đáng học nhất từ bài học:
 * - Loại bỏ tên riêng / thương hiệu (từ viết hoa giữa câu như Emily, hoặc CamelCase như RollTech).
 * - Chấm điểm theo: xuất hiện trong tiêu đề (+12đ), tần suất lặp lại (+2.5đ/lần), độ dài 6–11 ký tự (+3đ).
 * - Khử trùng lặp theo gốc từ (stemKey) và gắn sentenceId câu xuất hiện đầu tiên.
 */
export function extractCandidateWords(
  sentences: SentenceResponse[],
  lessonTitle = "",
  loading = false,
): CandidateWord[] {
  if (loading) return [];
  if (sentences.length === 0) return FALLBACK_WORDS;

  const titleStems = new Set(
    lessonTitle
      .split(/\s+/)
      .map((raw) => normalizeWord(raw))
      .filter((w) => w.length >= 4 && /^[a-z]+$/.test(w) && !STOP_WORDS.has(w))
      .map((w) => stemKey(w)),
  );

  // Ghi nhận các gốc từ xuất hiện viết hoa giữa câu hoặc CamelCase (tên người/công ty như Emily, RollTech)
  const properNounStems = new Set<string>();
  const stats = new Map<
    string,
    {
      word: string;
      sentenceId: string;
      count: number;
      lowercaseCount: number;
      firstIndex: number;
      inTitle: boolean;
    }
  >();

  let order = 0;
  for (const s of sentences) {
    const tokens = s.textEn.trim().split(/\s+/);
    let afterSentenceBoundary = true;

    for (let i = 0; i < tokens.length; i++) {
      const raw = tokens[i];
      const strippedLead = raw.replace(/^[^A-Za-z0-9]+/, "");
      const hasCamelCase = /[a-z][A-Z]/.test(strippedLead);
      const startsUpper = /^[A-Z]/.test(strippedLead);
      const isMidSentenceUpper = startsUpper && !afterSentenceBoundary;

      // Kiểm tra xem token hiện tại có kết thúc câu (. ! ? : ") không để chuẩn bị cho token kế tiếp
      afterSentenceBoundary = /[.!?:"”']$/.test(raw);

      const w = normalizeWord(raw);
      if (w.length < 5 || !/^[a-z]+$/.test(w) || STOP_WORDS.has(w)) continue;
      const stem = stemKey(w);
      if (STOP_WORDS.has(stem)) continue;

      if (hasCamelCase || isMidSentenceUpper) {
        properNounStems.add(stem);
        continue;
      }

      const inTitle = titleStems.has(stem);
      if (w.length === 5 && !inTitle && w.endsWith("s")) continue;

      const existing = stats.get(stem);
      if (existing) {
        existing.count += 1;
        if (!startsUpper) existing.lowercaseCount += 1;
        if (w.length < existing.word.length && w.length >= 5) {
          existing.word = w;
        }
      } else {
        stats.set(stem, {
          word: w,
          sentenceId: s.id,
          count: 1,
          lowercaseCount: startsUpper ? 0 : 1,
          firstIndex: order++,
          inTitle,
        });
      }
    }
  }

  const scored = Array.from(stats.entries())
    .filter(([stem, item]) => {
      if (properNounStems.has(stem)) return false;
      // Nếu từ luôn luôn viết hoa đầu câu (ví dụ tên người ở đầu lời thoại "Emily: ...") và không nằm trong tiêu đề thì bỏ qua
      if (item.lowercaseCount === 0 && !item.inTitle) return false;
      return true;
    })
    .map(([, item]) => item)
    .sort((a, b) => {
      const scoreOf = (item: typeof a) => {
        const titleBonus = item.inTitle ? 12 : 0;
        const freqBonus = Math.min(item.count, 4) * 2.5;
        const lenBonus = item.word.length >= 6 && item.word.length <= 11 ? 3 : 1.5;
        return titleBonus + freqBonus + lenBonus;
      };
      const diff = scoreOf(b) - scoreOf(a);
      return diff !== 0 ? diff : a.firstIndex - b.firstIndex;
    });

  const picked = scored.slice(0, 5).map(({ word, sentenceId }) => ({ word, sentenceId }));
  return picked.length > 0 ? picked : FALLBACK_WORDS;
}

/** Rút gọn chuỗi IPA (chỉ lấy cách đọc chính đầu tiên trước dấu phẩy để không tràn khung 340px). */
export function compactIpa(ipa?: string | null): string | null {
  if (!ipa) return null;
  const primary = ipa.split(",")[0]?.trim().replace(/^\/+|\/+$/g, "");
  return primary ? `/${primary}/` : null;
}
