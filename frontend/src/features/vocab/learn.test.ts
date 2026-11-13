import { describe, expect, it } from "vitest";
import {
  ROUND_SIZE,
  answerCard,
  buildOptions,
  firstOpenRound,
  hintMask,
  intervalParts,
  isGuessCorrect,
  isRoundDone,
  isHintExhausted,
  letterCount,
  maskExample,
  nextCard,
  roundScore,
  roundsOf,
  startRound,
} from "./learn";
import type { CardStatus, LearnCard } from "./types";

const card = (id: string, over: Partial<LearnCard> = {}): LearnCard => ({
  id,
  word: id,
  pos: "noun",
  meaningVi: `nghĩa ${id}`,
  definitionEn: null,
  definitionVi: null,
  exampleEn: null,
  exampleVi: null,
  ipaUk: null,
  ipaUs: null,
  audioUk: null,
  audioUs: null,
  status: "new",
  previews: [],
  contextEn: null,
  contextVi: null,
  lesson: null,
  ...over,
});

/** Bộ sinh số cố định để test không phụ thuộc may rủi. */
const seeded = (seed = 1) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
};

describe("lượt học", () => {
  const many = (count: number, status: (i: number) => CardStatus = () => "new") =>
    Array.from({ length: count }, (_, i) => card(`c${i}`, { status: status(i) }));

  it("chia phần thành các lượt 10 thẻ, lượt cuối có thể ít hơn", () => {
    const rounds = roundsOf(many(23));
    expect(rounds.map((round) => round.length)).toEqual([10, 10, 3]);
    expect(rounds[1][0].id).toBe("c10");
    expect(ROUND_SIZE).toBe(10);
    expect(roundsOf([])).toEqual([]);
  });

  it("mở lượt đầu tiên còn thẻ Mới", () => {
    expect(firstOpenRound(many(25))).toBe(0);
    expect(firstOpenRound(many(25, (i) => (i < 10 ? "learning" : "new")))).toBe(1);
    expect(firstOpenRound(many(25, (i) => (i < 22 ? "reviewing" : "new")))).toBe(2);
  });

  it("không còn thẻ Mới thì về lượt đầu", () => {
    expect(firstOpenRound(many(25, () => "mastered"))).toBe(0);
    expect(firstOpenRound([])).toBe(0);
  });
});

describe("che từ trong ví dụ của Đoán (BR-HT-17)", () => {
  it("thay mỗi chữ cái bằng một dấu *", () => {
    expect(maskExample("I bought him a present.", "present")).toBe("I bought him a *******.");
  });

  it("che cả từ thêm đuôi -s, -es, -d, -ed, -ing, không phân biệt hoa thường", () => {
    expect(maskExample("Presents are nice. He presented it. Presenting is hard.", "present")).toBe(
      "******** are nice. He ********* it. ********** is hard.",
    );
    expect(maskExample("She likes it. They liked it. Wishes come true.", "like")).toBe("She ***** it. They ***** it. Wishes come true.");
    expect(maskExample("Fix the box. Boxes are full.", "box")).toBe("Fix the ***. ***** are full.");
  });

  it("không che chữ chỉ chứa từ ở trong một từ khác", () => {
    expect(maskExample("The presentation is ready.", "present")).toBe("The presentation is ready.");
    expect(maskExample("An art class.", "art")).toBe("An *** class.");
    expect(maskExample("A party.", "art")).toBe("A party.");
  });

  it("che cụm từ, giữ khoảng trắng", () => {
    expect(maskExample("Check the time zone first.", "time zone")).toBe("Check the **** **** first.");
  });

  it("thẻ không có ví dụ thì không có câu che", () => {
    expect(maskExample(null, "present")).toBeNull();
    expect(maskExample("", "present")).toBeNull();
  });

  it("từ có ký tự đặc biệt không làm hỏng biểu thức", () => {
    expect(maskExample("Use a (fast) car.", "(fast)")).toBe("Use a (****) car.");
    expect(maskExample("It's fine.", "it's")).toBe("**'* fine.");
  });
});

describe("gợi ý và chấm Đoán (BR-HT-17, AC-HT-13)", () => {
  it("ô báo hiện số chữ cái và mỗi gợi ý thêm một chữ từ trái sang", () => {
    expect(letterCount("present")).toBe(7);
    expect(hintMask("present", 0)).toBe("*******");
    expect(hintMask("present", 2)).toBe("pr*****");
    expect(hintMask("present", 7)).toBe("present");
  });

  it("cụm từ giữ khoảng trắng và gợi ý bỏ qua khoảng trắng", () => {
    expect(letterCount("time zone")).toBe(8);
    expect(hintMask("time zone", 0)).toBe("**** ****");
    expect(hintMask("time zone", 5)).toBe("time z***");
  });

  it("gợi ý đến chữ cuối cùng thì coi như Không biết", () => {
    expect(isHintExhausted("present", 6)).toBe(false);
    expect(isHintExhausted("present", 7)).toBe(true);
    expect(isHintExhausted("go", 2)).toBe(true);
  });

  it("đúng khi trùng từ sau khi bỏ khoảng trắng hai đầu, không phân biệt hoa thường", () => {
    expect(isGuessCorrect(" Present ", "present")).toBe(true);
    expect(isGuessCorrect("PRESENT", "present")).toBe(true);
    expect(isGuessCorrect("presant", "present")).toBe(false);
    expect(isGuessCorrect("pre sent", "present")).toBe(false);
    expect(isGuessCorrect("", "present")).toBe(false);
  });
});

describe("đáp án Trắc nghiệm", () => {
  const pool = ["a", "b", "c", "d", "e", "f"].map((id) => card(id));

  it("có bốn đáp án, đúng một đáp án đúng và không trùng chữ", () => {
    const options = buildOptions(pool[0], pool, "quiz", seeded());
    expect(options).toHaveLength(4);
    expect(options.filter((option) => option.correct)).toEqual([{ cardId: "a", label: "nghĩa a", correct: true }]);
    expect(new Set(options.map((option) => option.label)).size).toBe(4);
  });

  it("Trắc nghiệm đảo hiện từ tiếng Anh", () => {
    const options = buildOptions(pool[2], pool, "reverse_quiz", seeded(7));
    expect(options.find((option) => option.correct)?.label).toBe("c");
    expect(options.every((option) => pool.some((p) => p.word === option.label))).toBe(true);
  });

  it("bỏ đáp án nhiễu trùng chữ hoặc trống, nên phần ít thẻ có ít đáp án hơn", () => {
    const dup = [card("a", { meaningVi: "chung" }), card("b", { meaningVi: "Chung" }), card("c", { meaningVi: null }), card("d")];
    const options = buildOptions(dup[0], dup, "quiz", seeded());
    expect(options.map((option) => option.label).sort()).toEqual(["chung", "nghĩa d"]);
    expect(buildOptions(dup[0], [dup[0]], "quiz", seeded())).toHaveLength(1);
  });

  it("vị trí đáp án đúng không cố định", () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 40; seed += 1) {
      positions.add(buildOptions(pool[0], pool, "quiz", seeded(seed)).findIndex((option) => option.correct));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("khoảng ôn trên nút Flashcard (BR-HT-10, BR-HT-11)", () => {
  it("hiện theo phút, giờ, ngày, tháng", () => {
    expect(intervalParts(10)).toEqual({ unit: "minute", count: 10 });
    expect(intervalParts(0)).toEqual({ unit: "minute", count: 1 });
    expect(intervalParts(180)).toEqual({ unit: "hour", count: 3 });
    expect(intervalParts(24 * 60)).toEqual({ unit: "day", count: 1 });
    expect(intervalParts(15 * 24 * 60)).toEqual({ unit: "day", count: 15 });
    expect(intervalParts(60 * 24 * 60)).toEqual({ unit: "month", count: 2 });
  });
});

describe("trạng thái lượt học (UC-HT-02, BR-HT-14, BR-HT-19)", () => {
  const cards = ["a", "b", "c"].map((id) => card(id));
  const ids = (state: ReturnType<typeof startRound>) => state.queue.map((c) => c.id);

  it("trả lời đúng thì thẻ rời hàng sau khi bấm Tiếp", () => {
    let state = startRound(cards);
    state = answerCard(state, true);
    expect(state.answered).toBe(true);
    expect(ids(state)).toEqual(["a", "b", "c"]);
    state = nextCard(state);
    expect(ids(state)).toEqual(["b", "c"]);
    expect(state.answered).toBe(false);
    expect(state.turn).toBe(1);
  });

  it("trả lời sai, Không biết hoặc Quên thì thẻ xuống cuối lượt", () => {
    let state = answerCard(startRound(cards), false);
    expect(state.redo).toBe(true);
    state = nextCard(state);
    expect(ids(state)).toEqual(["b", "c", "a"]);
  });

  it("thẻ làm lại không tính lại vào kết quả; lượt xong khi hết hàng", () => {
    let state = startRound(cards);
    state = nextCard(answerCard(state, false)); // a sai
    state = nextCard(answerCard(state, true)); // b đúng
    state = nextCard(answerCard(state, true)); // c đúng
    expect(ids(state)).toEqual(["a"]);
    state = nextCard(answerCard(state, true)); // a làm lại và đúng
    expect(isRoundDone(state)).toBe(true);
    expect(roundScore(state)).toEqual({ right: 2, redone: 1, total: 3 });
  });

  it("chưa trả lời thì không sang thẻ tiếp; trả lời hai lần chỉ tính một lần", () => {
    const state = startRound(cards);
    expect(nextCard(state)).toBe(state);
    const answered = answerCard(state, false);
    expect(answerCard(answered, true)).toBe(answered);
  });

  it("đổi cách học giữa chừng không làm mất tiến độ: hàng đợi và kết quả đi theo trạng thái, không theo cách học", () => {
    let state = startRound(cards);
    state = nextCard(answerCard(state, true)); // xong thẻ a bằng cách học này
    state = nextCard(answerCard(state, false)); // thẻ b sai, xuống cuối
    expect(ids(state)).toEqual(["c", "b"]);
    expect(state.firstTry).toEqual({ a: true, b: false });
  });

  it("lượt rỗng đã xong", () => {
    expect(isRoundDone(startRound([]))).toBe(true);
  });
});
