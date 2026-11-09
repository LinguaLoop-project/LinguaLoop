import type { LearnCard, LearnMode } from "./types";

/** Số thẻ mỗi lượt học: phần có 20 đến 50 thẻ được chia thành các lượt ngắn. */
export const ROUND_SIZE = 10;

/** Chia thẻ của phần thành các lượt theo thứ tự trong phần. */
export function roundsOf<T>(cards: T[], size = ROUND_SIZE): T[][] {
  const rounds: T[][] = [];
  for (let i = 0; i < cards.length; i += size) rounds.push(cards.slice(i, i + size));
  return rounds;
}

/** Lượt đầu tiên còn thẻ Mới (nơi "Học từ mới" mở); không còn thẻ Mới thì lượt đầu. */
export function firstOpenRound(cards: LearnCard[], size = ROUND_SIZE): number {
  const index = roundsOf(cards, size).findIndex((round) => round.some((card) => card.status === "new"));
  return Math.max(index, 0);
}

const isLetter = (char: string) => /\p{L}/u.test(char);
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Số chữ cái của từ (cụm từ không tính khoảng trắng, gạch nối, dấu nháy). */
export const letterCount = (word: string) => [...word].filter(isLetter).length;

/**
 * Câu ví dụ có từ cần đoán bị thay bằng dấu `*`, mỗi chữ cái một dấu (BR-HT-17). Che mọi từ trong câu bằng từ của thẻ
 * hoặc từ của thẻ thêm đuôi -s, -es, -d, -ed, -ing, không phân biệt hoa thường. Thẻ không có ví dụ thì trả null.
 */
export function maskExample(example: string | null, word: string): string | null {
  if (!example) return null;
  const phrase = word.trim().split(/\s+/).map(escapeRegExp).join("\\s+");
  if (!phrase) return example;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${phrase})(?:s|es|d|ed|ing)?(?![\\p{L}\\p{N}])`, "giu");
  return example.replace(pattern, (match) => match.replace(/\p{L}/gu, "*"));
}

/**
 * Ô báo của Đoán: `hints` chữ cái đầu hiện ra, các chữ cái còn lại là `*`; khoảng trắng và dấu nối giữ nguyên nên cụm từ
 * vẫn thấy ranh giới giữa các từ.
 */
export function hintMask(word: string, hints: number): string {
  let revealed = 0;
  return [...word]
    .map((char) => {
      if (!isLetter(char)) return char;
      revealed += 1;
      return revealed <= hints ? char : "*";
    })
    .join("");
}

/** Gợi ý đến chữ cái cuối cùng thì coi như "Không biết" (BR-HT-17). */
export const isHintExhausted = (word: string, hints: number) => hints >= letterCount(word);

/** Đúng khi trùng từ của thẻ sau khi bỏ khoảng trắng đầu cuối, không phân biệt hoa thường; sai chính tả là sai. */
export const isGuessCorrect = (input: string, word: string) => input.trim().toLowerCase() === word.trim().toLowerCase();

/** Một đáp án của Trắc nghiệm hoặc Trắc nghiệm đảo. */
export interface ChoiceOption {
  cardId: string;
  label: string;
  correct: boolean;
}

/** Chữ hiện trên đáp án: nghĩa tiếng Việt (Trắc nghiệm) hoặc từ tiếng Anh (Trắc nghiệm đảo). */
export const choiceLabel = (card: LearnCard, mode: Extract<LearnMode, "quiz" | "reverse_quiz">) =>
  (mode === "quiz" ? card.translationVi : card.word)?.trim() ?? "";

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Bốn đáp án cho một thẻ: đáp án đúng và tối đa ba đáp án gây nhiễu lấy từ các thẻ khác của phần, không trùng chữ với
 * đáp án đúng hay nhau. Phần có ít thẻ khác nhau thì có ít đáp án hơn.
 */
export function buildOptions(
  card: LearnCard,
  pool: LearnCard[],
  mode: Extract<LearnMode, "quiz" | "reverse_quiz">,
  random: () => number = Math.random,
): ChoiceOption[] {
  const correct = choiceLabel(card, mode);
  const seen = new Set([correct.toLowerCase()]);
  const distractors: ChoiceOption[] = [];
  for (const other of shuffle(pool, random)) {
    if (distractors.length === 3) break;
    const label = choiceLabel(other, mode);
    if (other.id === card.id || !label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    distractors.push({ cardId: other.id, label, correct: false });
  }
  return shuffle([{ cardId: card.id, label: correct, correct: true }, ...distractors], random);
}

/** Chấm một thẻ Flashcard: điểm dưới 3 (Quên) thì thẻ xuống cuối hàng và hiện lại trong lượt (UC-HT-02, 3b). */
export function advanceQueue<T>(queue: T[], quality: number): T[] {
  const [head, ...rest] = queue;
  return head === undefined || quality >= 3 ? rest : [...rest, head];
}

export type IntervalUnit = "minute" | "hour" | "day" | "month";

/** Khoảng ôn của một nút Flashcard, làm tròn về đơn vị dễ đọc nhất (10 phút, 1 ngày, 15 ngày, 2 tháng). */
export function intervalParts(minutes: number): { unit: IntervalUnit; count: number } {
  if (minutes < 60) return { unit: "minute", count: Math.max(1, Math.round(minutes)) };
  if (minutes < 24 * 60) return { unit: "hour", count: Math.round(minutes / 60) };
  const days = minutes / (24 * 60);
  if (days < 30) return { unit: "day", count: Math.round(days) };
  return { unit: "month", count: Math.round(days / 30) };
}

/** Điểm chất lượng của bốn nút Flashcard theo thứ tự hiện trên màn hình: Quên, Khó, Được, Dễ. */
export const GRADE_QUALITIES = [1, 3, 4, 5] as const;

export const MODE_STORAGE_KEY = "lingualoop.vocab.learnMode";
export const LEARN_MODES: LearnMode[] = ["guess", "flashcard", "quiz", "reverse_quiz", "repeat"];

/** Cách học dùng lần trước, mặc định Đoán; localStorage có thể không dùng được nên mọi lỗi đều quay về mặc định. */
export function loadMode(): LearnMode {
  try {
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
    return LEARN_MODES.includes(stored as LearnMode) ? (stored as LearnMode) : "guess";
  } catch {
    return "guess";
  }
}

export function saveMode(mode: LearnMode) {
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // bỏ qua: chỉ mất việc nhớ cách học
  }
}
