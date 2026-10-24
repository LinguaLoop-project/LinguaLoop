import type { Accent, Pronunciation } from "./types";

/** Một từ: chữ hoặc số, cho phép nối bằng dấu nháy hoặc gạch ngang giữa từ (don't, well-known). */
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’‘-][\p{L}\p{N}]+)*/gu;

export interface TextPart {
  text: string;
  isWord: boolean;
}

/** Tách câu thành các đoạn từ và không-từ (dấu câu, khoảng trắng), ghép lại đúng bằng câu gốc. */
export function splitWords(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(WORD_PATTERN)) {
    const start = match.index;
    if (start > last) parts.push({ text: text.slice(last, start), isWord: false });
    parts.push({ text: match[0], isWord: true });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), isWord: false });
  return parts;
}

/** Dạng gửi lên backend: chữ thường, dấu nháy thẳng, bỏ dấu câu hai đầu. Rỗng nếu không còn chữ hay số. */
export function normalizeWord(raw: string): string {
  const s = raw.replace(/[’‘`´]/g, "'").trim().toLowerCase().replace(/\s+/g, " ");
  return s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

export const ipaOf = (p: Pronunciation, accent: Accent) => (accent === "uk" ? p.ipaUk : p.ipaUs);
export const audioOf = (p: Pronunciation, accent: Accent) => (accent === "uk" ? p.audioUk : p.audioUs);

export const samePronunciation = (a: Pronunciation, b: Pronunciation) =>
  a.ipaUk === b.ipaUk && a.ipaUs === b.ipaUs && a.audioUk === b.audioUk && a.audioUs === b.audioUs;

/** Backend lưu đường dẫn tương đối (audio/hello-us.mp3); đường dẫn đầy đủ thì dùng nguyên. */
export const resolveAudioUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `/${path.replace(/^\/+/, "")}`;

function speak(text: string, accent: Accent) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent === "uk" ? "en-GB" : "en-US";
  window.speechSynthesis.speak(utterance);
}

/** Phát audio của từ; không có audio hoặc file hỏng thì đọc bằng giọng của trình duyệt. */
export function playPronunciation(text: string, accent: Accent, audio: string | null) {
  if (!audio) {
    speak(text, accent);
    return;
  }
  const player = new Audio(resolveAudioUrl(audio));
  player.addEventListener("error", () => speak(text, accent), { once: true });
  player.play().catch(() => speak(text, accent));
}
