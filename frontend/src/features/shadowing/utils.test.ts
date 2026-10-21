import { describe, expect, it } from "vitest";
import type { SentenceRecord, WordResult } from "./types";
import {
  alignWords,
  fmtClock,
  fmtDuration,
  litTokenIndex,
  maskText,
  recordFromAttempt,
  sentenceAt,
  toneOf,
  weakPhonemes,
  wordIpa,
  youtubeId,
} from "./utils";

const word = (position: number, text: string, extra: Partial<WordResult> = {}): WordResult => ({
  position,
  word: text,
  accuracy: 90,
  outcome: "correct",
  phonemes: [],
  ...extra,
});

describe("toneOf", () => {
  it.each([
    [100, "good"],
    [80, "good"],
    [79.9, "mid"],
    [60, "mid"],
    [59.9, "bad"],
    [0, "bad"],
  ])("điểm %s thuộc nhóm %s", (score, tone) => {
    expect(toneOf(score)).toBe(tone);
  });
});

describe("alignWords", () => {
  it("câu chưa chấm: trả từng từ của câu, chưa có kết quả", () => {
    const out = alignWords("If things don't work", []);
    expect(out.map((d) => d.text)).toEqual(["If", "things", "don't", "work"]);
    expect(out.every((d) => d.result === null)).toBe(true);
    expect(out.map((d) => d.tokenIndex)).toEqual([0, 1, 2, 3]);
  });

  it("số từ khớp: hiện lại chữ gốc (hoa thường, dấu câu) thay cho chữ của Azure", () => {
    const out = alignWords("Hello, World.", [word(0, "hello"), word(1, "world")]);
    expect(out.map((d) => d.text)).toEqual(["Hello,", "World."]);
    expect(out.map((d) => d.tokenIndex)).toEqual([0, 1]);
  });

  it("từ thừa không ghép với từ nào của câu và không làm lệch các từ sau", () => {
    const out = alignWords("go home", [
      word(0, "go"),
      word(1, "um", { outcome: "inserted" }),
      word(2, "home"),
    ]);
    expect(out.map((d) => d.text)).toEqual(["go", "um", "home"]);
    expect(out.map((d) => d.tokenIndex)).toEqual([0, -1, 1]);
  });

  it("từ bỏ sót vẫn nằm đúng chỗ của nó trong câu", () => {
    const out = alignWords("I really like it", [
      word(0, "i"),
      word(1, "really", { outcome: "omitted", accuracy: 0 }),
      word(2, "like"),
      word(3, "it"),
    ]);
    expect(out.map((d) => d.text)).toEqual(["I", "really", "like", "it"]);
    expect(out[1].result?.outcome).toBe("omitted");
  });

  it("số từ lệch (vd số, o'clock): giữ chữ của Azure và không gán phiên âm", () => {
    const out = alignWords("It is 5 o'clock", [word(0, "it"), word(1, "is"), word(2, "five")]);
    expect(out.map((d) => d.text)).toEqual(["it", "is", "five"]);
    expect(out.every((d) => d.tokenIndex === -1)).toBe(true);
  });

  it("khoá của mỗi từ lấy theo vị trí nên duy nhất", () => {
    const out = alignWords("a a a", [word(0, "a"), word(1, "a"), word(2, "a")]);
    expect(new Set(out.map((d) => d.key)).size).toBe(3);
  });
});

describe("wordIpa", () => {
  it("tách phiên âm theo từng từ và bỏ dấu gạch chéo, dấu câu ở cuối", () => {
    expect(wordIpa("Hello world", "/həˈləʊ/ /wɜːld/")).toEqual(["həˈləʊ", "wɜːld"]);
    expect(wordIpa("Hello, world.", "həˈləʊ, wɜːld.")).toEqual(["həˈləʊ", "wɜːld"]);
  });

  it("số từ phiên âm lệch số từ của câu thì trả null", () => {
    expect(wordIpa("Are you ready", "ju redi")).toBeNull();
  });

  it("không có phiên âm thì trả null", () => {
    expect(wordIpa("Hello", null)).toBeNull();
    expect(wordIpa("Hello", undefined)).toBeNull();
    expect(wordIpa("Hello", "")).toBeNull();
  });
});

describe("litTokenIndex", () => {
  const text = "a bb ccc";

  it("đầu câu là từ đầu, cuối câu là từ cuối", () => {
    expect(litTokenIndex(text, 0)).toBe(0);
    expect(litTokenIndex(text, 1)).toBe(2);
  });

  it("đi theo độ dài từ: từ dài chiếm nhiều thời gian hơn", () => {
    // tổng 2 + 3 + 4 = 9 đơn vị: từ 1 tới 2/9, từ 2 tới 5/9, từ 3 tới hết
    expect(litTokenIndex(text, 0.2)).toBe(0);
    expect(litTokenIndex(text, 0.4)).toBe(1);
    expect(litTokenIndex(text, 0.7)).toBe(2);
  });

  it("vượt quá 1 vẫn trả từ cuối", () => {
    expect(litTokenIndex(text, 5)).toBe(2);
  });
});

describe("sentenceAt", () => {
  const segments = [
    { startMs: 0, endMs: 3000 },
    { startMs: 4000, endMs: 7000 },
    { startMs: 9000, endMs: 12000 },
  ];

  it("mốc nằm trong câu thì trả câu đó, kể cả hai đầu mút", () => {
    expect(sentenceAt(segments, 1500)).toBe(0);
    expect(sentenceAt(segments, 4000)).toBe(1);
    expect(sentenceAt(segments, 7000)).toBe(1);
    expect(sentenceAt(segments, 11000)).toBe(2);
  });

  it("mốc trong khoảng lặng thì lấy câu gần nhất", () => {
    expect(sentenceAt(segments, 3200)).toBe(0);
    expect(sentenceAt(segments, 3800)).toBe(1);
    expect(sentenceAt(segments, 7900)).toBe(1);
    expect(sentenceAt(segments, 8200)).toBe(2);
  });

  it("trước câu đầu và sau câu cuối", () => {
    expect(sentenceAt(segments, 0)).toBe(0);
    expect(sentenceAt(segments, 60_000)).toBe(2);
  });

  it("danh sách rỗng thì trả 0", () => {
    expect(sentenceAt([], 1000)).toBe(0);
  });
});

describe("weakPhonemes", () => {
  const rec = (words: WordResult[]): SentenceRecord => ({
    score: 70,
    best: 70,
    count: 1,
    accuracy: null,
    fluency: null,
    completeness: null,
    prosody: null,
    words,
  });
  const ph = (symbol: string, accuracy: number) => ({ symbol, accuracy });

  it("chỉ tính âm dưới 60 điểm, sắp theo số lần sai giảm dần", () => {
    const records = {
      a: rec([word(0, "think", { phonemes: [ph("θ", 30), ph("ɪ", 90), ph("ŋ", 59)] })]),
      b: rec([word(0, "three", { phonemes: [ph("θ", 40), ph("r", 20)] })]),
      c: rec([word(0, "ok", { phonemes: [ph("k", 60)] })]),
    };
    // θ sai 2 lần; ŋ và r mỗi âm 1 lần (giữ thứ tự gặp)
    expect(weakPhonemes(records)).toEqual(["θ", "ŋ", "r"]);
  });

  it("giới hạn số âm trả về", () => {
    const records = {
      a: rec([word(0, "x", { phonemes: [ph("a", 1), ph("b", 1), ph("c", 1), ph("d", 1)] })]),
    };
    expect(weakPhonemes(records, 2)).toHaveLength(2);
  });

  it("lượt khôi phục từ lịch sử không có âm vị thì không trả gì", () => {
    expect(weakPhonemes({ a: rec([word(0, "hello")]) })).toEqual([]);
  });
});

describe("recordFromAttempt", () => {
  const attempt = {
    score: 70,
    accuracy: 71,
    fluency: 72,
    completeness: 73,
    prosody: null,
    words: [],
  };

  it("lượt đầu: điểm cao nhất bằng điểm lượt, số lần là 1", () => {
    expect(recordFromAttempt(undefined, attempt)).toMatchObject({ score: 70, best: 70, count: 1, prosody: null });
  });

  it("lượt sau thấp hơn: giữ điểm cao nhất cũ, cộng số lần", () => {
    const first = recordFromAttempt(undefined, { ...attempt, score: 90 });
    expect(recordFromAttempt(first, attempt)).toMatchObject({ score: 70, best: 90, count: 2 });
  });

  it("lượt sau cao hơn: điểm cao nhất được nâng lên", () => {
    const first = recordFromAttempt(undefined, attempt);
    expect(recordFromAttempt(first, { ...attempt, score: 95 })).toMatchObject({ best: 95, count: 2 });
  });
});

describe("maskText", () => {
  it("thay chữ và số bằng dấu sao, giữ dấu câu và khoảng trắng", () => {
    expect(maskText("Don't stop, ok?")).toBe("***** ****, **?");
  });
});

describe("youtubeId", () => {
  const id = "dQw4w9WgXcQ";

  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?feature=share&v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
  ])("lấy được ID từ %s", (url) => {
    expect(youtubeId(url)).toBe(id);
  });

  it("không phải YouTube thì trả null", () => {
    expect(youtubeId("https://example.com/video.mp4")).toBeNull();
    expect(youtubeId(null)).toBeNull();
    expect(youtubeId(undefined)).toBeNull();
    expect(youtubeId("")).toBeNull();
  });
});

describe("fmtClock / fmtDuration", () => {
  it("đồng hồ có một chữ số thập phân", () => {
    expect(fmtClock(0)).toBe("00:00.0");
    expect(fmtClock(2000)).toBe("00:02.0");
    expect(fmtClock(65_400)).toBe("01:05.4");
  });

  it("số âm coi như 0", () => {
    expect(fmtClock(-500)).toBe("00:00.0");
    expect(fmtDuration(-500)).toBe("00:00");
  });

  it("gần chạm phút tiếp theo không hiện 60 giây", () => {
    expect(fmtClock(59_960)).toBe("01:00.0");
  });

  it("tổng thời lượng làm tròn tới giây", () => {
    expect(fmtDuration(50_000)).toBe("00:50");
    expect(fmtDuration(59_600)).toBe("01:00");
    expect(fmtDuration(3_725_000)).toBe("62:05");
  });
});
