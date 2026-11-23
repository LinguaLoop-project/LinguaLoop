import { describe, expect, it } from "vitest";
import type { DictationErrorRow, HistoryItem, PhonemeCell, WeekPoint } from "./types";
import {
  errorSegments,
  dictationPracticeHref,
  hasTrend,
  signedDelta,
  weeksWithData,
  historyHref,
  parseHistoryMode,
  parsePage,
  parseRange,
  percentOf,
  phonemeTone,
  practiceHref,
  practiceKind,
  scorePoints,
  splitPhonemes,
  trendPoints,
} from "./utils";

const week = (weekStart: string, errorPercent: number | null): WeekPoint => ({
  weekStart,
  total: errorPercent === null ? 0 : 10,
  errors: 0,
  errorPercent,
});

const row = (over: Partial<DictationErrorRow>): DictationErrorRow => ({
  wordClass: "function",
  opportunities: 10,
  errors: 0,
  errorPercent: 0,
  omitted: 0,
  substituted: 0,
  misspelled: 0,
  revealed: 0,
  lastWrongWord: null,
  practiceLessonId: null,
  ...over,
});

const cell = (over: Partial<PhonemeCell>): PhonemeCell => ({
  symbol: "p",
  kind: "consonant",
  exampleWord: "pen",
  total: 0,
  errors: 0,
  errorPercent: null,
  level: "insufficient",
  ...over,
});

const item = (over: Partial<HistoryItem>): HistoryItem => ({
  type: "practice",
  mode: "dictation",
  at: "2026-11-23T10:00:00Z",
  title: "Bài A",
  available: true,
  lessonId: "lesson-1",
  deckId: null,
  deckKind: null,
  day: "2026-11-23",
  sentences: 3,
  averageScore: 76.7,
  retries: 1,
  gaveUps: 0,
  answered: null,
  correct: null,
  ...over,
});

describe("parseRange (AC-TH-03)", () => {
  it("nhận ba khoảng hợp lệ", () => {
    expect(parseRange("7d")).toBe("7d");
    expect(parseRange("30d")).toBe("30d");
    expect(parseRange("all")).toBe("all");
  });

  it("thiếu hoặc lạ thì về 30 ngày", () => {
    expect(parseRange(null)).toBe("30d");
    expect(parseRange("1d")).toBe("30d");
    expect(parseRange("ALL")).toBe("30d");
  });
});

describe("parseHistoryMode (AC-TH-09)", () => {
  it("nhận năm chế độ, lạ thì về Tất cả", () => {
    for (const mode of ["all", "dictation", "shadowing", "vocab", "ai"]) expect(parseHistoryMode(mode)).toBe(mode);
    expect(parseHistoryMode("karaoke")).toBe("all");
    expect(parseHistoryMode(null)).toBe("all");
  });
});

describe("parsePage (AC-TH-10)", () => {
  it("địa chỉ đếm từ 1, trong code đếm từ 0", () => {
    expect(parsePage("3")).toBe(2);
    expect(parsePage("2")).toBe(1);
  });

  it("thiếu, 1, 0, âm hoặc không phải số thì về trang đầu", () => {
    for (const raw of [null, "1", "0", "-4", "abc"]) expect(parsePage(raw)).toBe(0);
  });
});

describe("phonemeTone (AC-TH-14)", () => {
  it("mỗi mức một màu riêng, chưa đủ dữ liệu là màu trung tính", () => {
    const tones = new Set((["good", "attention", "bad", "insufficient"] as const).map(phonemeTone));
    expect(tones.size).toBe(4);
    expect(phonemeTone("good")).toContain("success");
    expect(phonemeTone("attention")).toContain("warning");
    expect(phonemeTone("bad")).toContain("danger");
    expect(phonemeTone("insufficient")).not.toMatch(/success|warning|danger/);
  });
});

describe("splitPhonemes (AC-TH-14)", () => {
  it("nguyên âm đơn và đôi vào một nhóm, phụ âm vào nhóm kia, giữ thứ tự", () => {
    const cells = [
      cell({ symbol: "p", kind: "consonant" }),
      cell({ symbol: "i", kind: "vowel" }),
      cell({ symbol: "eɪ", kind: "diphthong" }),
      cell({ symbol: "θ", kind: "consonant" }),
    ];
    const { vowels, consonants } = splitPhonemes(cells);
    expect(vowels.map((c) => c.symbol)).toEqual(["i", "eɪ"]);
    expect(consonants.map((c) => c.symbol)).toEqual(["p", "θ"]);
  });
});

describe("errorSegments (AC-TH-04)", () => {
  it("ba đoạn cộng lại bằng tỷ lệ lỗi của nhóm", () => {
    // 10 từ: 2 bỏ sót, 1 nhầm từ, 1 sai chính tả → 40%
    const s = errorSegments(row({ omitted: 2, substituted: 1, misspelled: 1, errors: 4 }));
    expect(s).toEqual({ omitted: 20, substituted: 10, misspelled: 10 });
    expect(s.omitted + s.substituted + s.misspelled).toBe(40);
  });

  it("từ đã lộ do xin gợi ý được gộp vào Bỏ sót", () => {
    expect(errorSegments(row({ omitted: 1, revealed: 2, errors: 3 })).omitted).toBe(30);
  });

  it("nhóm chưa gặp từ nào thì ba đoạn bằng 0", () => {
    expect(errorSegments(row({ opportunities: 0 }))).toEqual({ omitted: 0, substituted: 0, misspelled: 0 });
  });
});

describe("trendPoints (AC-TH-16)", () => {
  it("tỷ lệ lỗi càng cao thì điểm càng cao trên màn hình (y nhỏ)", () => {
    const [low, high] = trendPoints([week("a", 0), week("b", 100)], 100, 60, 0).split(" ");
    expect(low).toBe("0.0,60.0");
    expect(high).toBe("100.0,0.0");
  });

  it("bỏ qua tuần không có dữ liệu nhưng giữ vị trí ngang của các tuần còn lại", () => {
    const points = trendPoints([week("a", 50), week("b", null), week("c", 50)], 100, 60, 0).split(" ");
    expect(points).toEqual(["0.0,30.0", "100.0,30.0"]);
  });

  it("không có tuần nào thì không có điểm", () => {
    expect(trendPoints([], 100, 60)).toBe("");
  });

  it("chỉ vẽ đường khi có từ hai tuần có dữ liệu", () => {
    expect(hasTrend([week("a", 10)])).toBe(false);
    expect(hasTrend([week("a", 10), week("b", null)])).toBe(false);
    expect(hasTrend([week("a", 10), week("b", 20)])).toBe(true);
  });
});

describe("scorePoints (AC-TH-18)", () => {
  it("điểm cao hơn thì y nhỏ hơn; một mốc duy nhất nằm giữa", () => {
    const [a, b] = scorePoints(
      [
        { from: "a", averageScore: 0, attempts: 1 },
        { from: "b", averageScore: 100, attempts: 1 },
      ],
      100,
      60,
      0,
    ).split(" ");
    expect(a).toBe("0.0,60.0");
    expect(b).toBe("100.0,0.0");
    expect(scorePoints([{ from: "a", averageScore: 50, attempts: 1 }], 100, 60, 0)).toBe("50.0,30.0");
    expect(scorePoints([], 100, 60)).toBe("");
  });
});

describe("weeksWithData (AC-TH-30)", () => {
  it("đếm các tuần có dữ liệu để báo học viên còn thiếu bao nhiêu tuần", () => {
    expect(weeksWithData([])).toBe(0);
    expect(weeksWithData([week("a", 10), week("b", null), week("c", null)])).toBe(1);
    expect(weeksWithData([week("a", 10), week("b", 0), week("c", 20)])).toBe(3);
  });
});

describe("dictationPracticeHref (AC-TH-29)", () => {
  it("có bài thì mở Nghe chép của bài đó", () => {
    expect(dictationPracticeHref({ practiceLessonId: "abc" })).toBe("/student/dictation/abc");
  });

  it("không có bài phù hợp thì mở thư viện Nghe chép", () => {
    expect(dictationPracticeHref({ practiceLessonId: null })).toBe("/student/dictation");
  });
});

describe("signedDelta (AC-TH-27, AC-TH-28)", () => {
  it("tăng có dấu cộng, giảm có dấu trừ, bằng nhau là 0", () => {
    expect(signedDelta(12)).toBe("+12");
    expect(signedDelta(-3)).toBe("-3");
    expect(signedDelta(0)).toBe("0");
  });
});

describe("practiceHref (AC-TH-25, AC-TH-26)", () => {
  it("có bài thì mở Shadowing của bài đó", () => {
    expect(practiceHref({ practiceLessonId: "abc" })).toBe("/student/shadowing/abc");
  });

  it("không có bài phù hợp thì mở thư viện Shadowing", () => {
    expect(practiceHref({ practiceLessonId: null })).toBe("/student/shadowing");
  });
});

describe("historyHref (AC-TH-11)", () => {
  it("Buổi luyện mở bài ở đúng chế độ", () => {
    expect(historyHref(item({ mode: "dictation" }))).toBe("/student/dictation/lesson-1");
    expect(historyHref(item({ mode: "shadowing" }))).toBe("/student/shadowing/lesson-1");
  });

  it("phiên AI mở trang Thực hành với AI của bài", () => {
    expect(historyHref(item({ type: "ai", mode: "live" }))).toBe("/student/lessons/lesson-1/ai");
  });

  it("phiên từ vựng mở đúng loại bộ", () => {
    const vocab = { type: "vocab" as const, mode: "review", lessonId: null, deckId: "d1" };
    expect(historyHref(item({ ...vocab, deckKind: "library" }))).toBe("/student/vocab/d1");
    expect(historyHref(item({ ...vocab, deckKind: "personal" }))).toBe("/student/vocab/mine/d1");
    expect(historyHref(item({ ...vocab, deckKind: "saved" }))).toBe("/student/mywords");
  });

  it("nội dung gốc không còn khả dụng thì không có đường dẫn", () => {
    expect(historyHref(item({ available: false }))).toBeNull();
  });

  it("phiên ôn chung nhiều bộ không có nơi để mở", () => {
    expect(historyHref(item({ type: "vocab", mode: "review", lessonId: null, deckId: null }))).toBeNull();
  });
});

describe("practiceKind (AC-TH-24)", () => {
  it("chỉ Buổi luyện Nghe chép và Shadowing mới mở ra từng lượt", () => {
    expect(practiceKind(item({ mode: "dictation" }))).toBe("dictation");
    expect(practiceKind(item({ mode: "shadowing" }))).toBe("shadowing");
    expect(practiceKind(item({ type: "vocab", mode: "learn" }))).toBeNull();
    expect(practiceKind(item({ type: "ai", mode: "live" }))).toBeNull();
  });
});

describe("percentOf", () => {
  it("làm tròn và an toàn khi mẫu số bằng 0", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(5, 0)).toBe(0);
  });
});
