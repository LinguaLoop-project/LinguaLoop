import { describe, expect, it } from "vitest";

import { lessonActions } from "./actions";
import { listParams } from "./listParams";
import {
  changeCount,
  collectChanges,
  isDirty,
  mergeWithNext,
  shiftTime,
  splitRow,
  suggestTargets,
  toDraft,
  validateDraft,
} from "./sentenceDraft";
import { formatMs, parseMs } from "./time";
import { DEFAULT_FILTER, type LessonSentence } from "./types";

function sentence(i: number, patch: Partial<LessonSentence> = {}): LessonSentence {
  return {
    id: `s${i}`,
    position: i + 1,
    startMs: i * 2000,
    endMs: i * 2000 + 1500,
    textEn: `Sentence ${i}`,
    ipaUs: `ipa ${i}`,
    ipaUk: null,
    textVi: `Câu ${i}`,
    ...patch,
  };
}

const VIDEO_MS = 600_000;

describe("time (mốc câu dạng mm:ss.s)", () => {
  it("định dạng và đọc lại mốc thời gian (AC-BH-36)", () => {
    expect(formatMs(12_000)).toBe("00:12.0");
    expect(formatMs(75_500)).toBe("01:15.5");
    expect(parseMs("00:14.0")).toBe(14_000);
    expect(parseMs("1:05")).toBe(65_000);
    expect(parseMs("12,5")).toBe(12_500);
  });

  it("không nhận mốc sai dạng (âm)", () => {
    expect(parseMs("")).toBeNull();
    expect(parseMs("abc")).toBeNull();
    expect(parseMs("-1")).toBeNull();
    expect(parseMs("00:75")).toBeNull();
  });
});

describe("sentenceDraft (UC-BH-05)", () => {
  it("chỉ gửi câu đã đổi và câu đã chọn xóa (AC-BH-34, AC-BH-39)", () => {
    const originals = [sentence(0), sentence(1), sentence(2)];
    const rows = toDraft(originals);
    expect(isDirty(rows, originals)).toBe(false);

    rows[1] = { ...rows[1], textVi: "Bản dịch mới" };
    rows[0] = { ...rows[0], deleted: true };
    const { sentences, deletedIds } = collectChanges(rows, originals);

    expect(isDirty(rows, originals)).toBe(true);
    expect(deletedIds).toEqual(["s0"]);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toMatchObject({ id: "s1", textVi: "Bản dịch mới", startMs: 2000, endMs: 3500 });
  });

  it("bản dịch để trống thì gửi null", () => {
    const originals = [sentence(0)];
    const rows = toDraft(originals);
    rows[0] = { ...rows[0], textVi: "  " };
    expect(collectChanges(rows, originals).sentences[0].textVi).toBeNull();
  });

  it("đổi câu tiếng Anh thì gửi IPA trống để server tạo lại; không đổi chữ thì giữ IPA cũ (BR-BH-13)", () => {
    const originals = [sentence(0), sentence(1)];
    const rows = toDraft(originals);
    rows[0] = { ...rows[0], textEn: "Sentence zero" };
    rows[1] = { ...rows[1], textVi: "Bản dịch mới" };
    const [first, second] = collectChanges(rows, originals).sentences;
    expect(first).toMatchObject({ id: "s0", ipaUs: null, ipaUk: null });
    expect(second).toMatchObject({ id: "s1", ipaUs: "ipa 1" });
  });

  it("báo mốc chồng lấn câu kề bên (AC-BH-37, âm)", () => {
    const rows = toDraft([sentence(0), sentence(1)]);
    rows[0] = { ...rows[0], end: "00:02.5" };
    const errors = validateDraft(rows, VIDEO_MS);
    expect(errors.s0?.endMs).toBe("Overlap");
    expect(errors.s1?.startMs).toBe("Overlap");
  });

  it("báo đoạn ngắn hơn 0,5 giây, bắt đầu không nhỏ hơn kết thúc, vượt độ dài video (AC-BH-37, biên)", () => {
    const rows = toDraft([sentence(0), sentence(1), sentence(2)]);
    rows[0] = { ...rows[0], start: "00:00.0", end: "00:00.4" };
    rows[1] = { ...rows[1], start: "00:03.0", end: "00:03.0" };
    rows[2] = { ...rows[2], start: "09:59.8", end: "10:00.4" };
    const errors = validateDraft(rows, VIDEO_MS);
    expect(errors.s0?.endMs).toBe("MinDuration");
    expect(errors.s1?.endMs).toBe("StartBeforeEnd");
    expect(errors.s2?.endMs).toBe("ExceedsVideo");
  });

  it("đoạn dài đúng 0,5 giây là hợp lệ (biên)", () => {
    const rows = toDraft([sentence(0)]);
    rows[0] = { ...rows[0], start: "00:00.0", end: "00:00.5" };
    expect(validateDraft(rows, VIDEO_MS)).toEqual({});
  });

  it("câu tiếng Anh trống hoặc bản dịch 501 ký tự (AC-BH-38, âm)", () => {
    const rows = toDraft([sentence(0), sentence(1)]);
    rows[0] = { ...rows[0], textEn: " " };
    rows[1] = { ...rows[1], textVi: "v".repeat(501) };
    const errors = validateDraft(rows, VIDEO_MS);
    expect(errors.s0?.textEn).toBe("NotBlank");
    expect(errors.s1?.textVi).toBe("Size");
  });

  it("câu đã chọn xóa không bị kiểm", () => {
    const rows = toDraft([sentence(0)]);
    rows[0] = { ...rows[0], textEn: "", deleted: true };
    expect(validateDraft(rows, VIDEO_MS)).toEqual({});
  });
});

describe("suggestTargets (UC-BH-10)", () => {
  const rows = toDraft([sentence(0), sentence(1, { textVi: null }), sentence(2, { ipaUs: null })]);

  it("chỉ điền ô còn trống: chỉ lấy câu chưa có bản dịch, thiếu IPA không tính (AC-BH-70)", () => {
    expect(suggestTargets(rows, new Set(), "all", "empty").map((r) => r.id)).toEqual(["s1"]);
  });

  it("ghi đè lấy mọi câu trong phạm vi; phạm vi câu đang chọn (AC-BH-69)", () => {
    expect(suggestTargets(rows, new Set(["s0"]), "selected", "overwrite").map((r) => r.id)).toEqual(["s0"]);
    expect(suggestTargets(rows, new Set(), "all", "overwrite")).toHaveLength(3);
  });
});

describe("thao tác và tham số danh sách (UC-BH-01)", () => {
  it("giáo viên thấy thao tác theo trạng thái, quản trị viên chỉ gỡ xuất bản (BR-BH-01, 02)", () => {
    expect(lessonActions({ status: "draft", deletedAt: null }, "teacher")).toEqual(["publish", "delete"]);
    expect(lessonActions({ status: "published", deletedAt: null }, "teacher")).toEqual(["unpublish", "delete"]);
    expect(lessonActions({ status: "draft", deletedAt: "2026-11-10T00:00:00Z" }, "teacher")).toEqual(["restore"]);
    expect(lessonActions({ status: "published", deletedAt: null }, "admin")).toEqual(["unpublish"]);
    expect(lessonActions({ status: "draft", deletedAt: null }, "admin")).toEqual([]);
  });

  it("bỏ tham số rỗng; lọc trạng thái chỉ cho giáo viên, lọc chủ bài chỉ cho quản trị viên", () => {
    expect(listParams("teacher", DEFAULT_FILTER, 0)).toEqual({ page: 0 });
    const filter = { ...DEFAULT_FILTER, q: " travel ", status: "draft" as const, ownerId: "t1", pro: true };
    expect(listParams("teacher", filter, 1)).toEqual({ page: 1, q: "travel", status: "draft", pro: true });
    expect(listParams("admin", filter, 0)).toEqual({ page: 0, q: "travel", ownerId: "t1", pro: true });
  });
});

describe("changeCount and shiftTime", () => {
  const original = [
    { id: "a", position: 1, startMs: 0, endMs: 1000, textEn: "Hi.", ipaUs: null, ipaUk: null, textVi: "Chào." },
    { id: "b", position: 2, startMs: 1000, endMs: 2000, textEn: "Bye.", ipaUs: null, ipaUk: null, textVi: null },
  ];

  it("counts edited and deleted sentences", () => {
    const rows = toDraft(original);
    expect(changeCount(rows, original)).toBe(0);
    rows[0] = { ...rows[0], textVi: "Xin chào." };
    rows[1] = { ...rows[1], deleted: true };
    expect(changeCount(rows, original)).toBe(2);
  });

  it("shifts a time by tenths and never below zero", () => {
    expect(shiftTime("00:01.0", 100)).toBe("00:01.1");
    expect(shiftTime("00:00.0", -100)).toBe("00:00.0");
    expect(shiftTime("abc", 100)).toBe("abc");
  });
});

describe("splitRow and mergeWithNext", () => {
  const original = [
    { id: "a", position: 1, startMs: 0, endMs: 4000, textEn: "Like and share. Subscribe now.", ipaUs: "x", ipaUk: "y", textVi: "Thích và chia sẻ. Đăng ký." },
    { id: "b", position: 2, startMs: 4000, endMs: 6000, textEn: "Bye.", ipaUs: "z", ipaUk: null, textVi: "Tạm biệt." },
  ];

  it("splits at the cursor, leaves the split time empty and sends the new sentence as added", () => {
    const rows = splitRow(toDraft(original), "a", "Like and share.".length, "new-1");
    expect(rows).not.toBeNull();
    const [first, second] = rows ?? [];
    expect(first).toMatchObject({ id: "a", textEn: "Like and share.", start: "00:00.0", end: "", ipaUs: "" });
    expect(first.textVi).toBe("Thích và chia sẻ. Đăng ký.");
    expect(second).toMatchObject({ id: "new-1", isNew: true, textEn: "Subscribe now.", start: "", end: "00:04.0", textVi: "" });
    expect(validateDraft(rows ?? [], 60_000)).toMatchObject({ a: { endMs: "Required" }, "new-1": { startMs: "Required" } });

    const filled = (rows ?? []).map((r) => (r.id === "a" ? { ...r, end: "00:01.5" } : r.id === "new-1" ? { ...r, start: "00:01.5" } : r));
    const { added, sentences } = collectChanges(filled, original);
    expect(added).toEqual([
      { key: "new-1", textEn: "Subscribe now.", ipaUs: null, ipaUk: null, textVi: null, startMs: 1500, endMs: 4000 },
    ]);
    expect(sentences[0]).toMatchObject({ id: "a", endMs: 1500, ipaUs: null });
  });

  it("does not split at the very start or end of the text", () => {
    expect(splitRow(toDraft(original), "a", 0, "n")).toBeNull();
    expect(splitRow(toDraft(original), "a", original[0].textEn.length, "n")).toBeNull();
  });

  it("merges with the next sentence: joins text, keeps outer times, deletes the second", () => {
    const rows = mergeWithNext(toDraft(original), "a") ?? [];
    expect(rows[0]).toMatchObject({
      textEn: "Like and share. Subscribe now. Bye.",
      textVi: "Thích và chia sẻ. Đăng ký. Tạm biệt.",
      start: "00:00.0",
      end: "00:06.0",
      ipaUs: "",
    });
    expect(rows[1].deleted).toBe(true);
    expect(collectChanges(rows, original).deletedIds).toEqual(["b"]);
    expect(mergeWithNext(rows, "a")).toBeNull();
  });

  it("merging an unsaved split part drops it instead of deleting", () => {
    const split = splitRow(toDraft(original), "a", "Like and share.".length, "new-1") ?? [];
    const merged = mergeWithNext(split, "a") ?? [];
    expect(merged.map((r) => r.id)).toEqual(["a", "b"]);
    expect(collectChanges(merged, original).added).toEqual([]);
  });
});

describe("times with milliseconds", () => {
  const original = [
    { id: "a", position: 1, startMs: 412, endMs: 2669, textEn: "Hi.", ipaUs: null, ipaUk: null, textVi: null },
  ];

  it("opening a lesson whose times are not whole tenths is not a change", () => {
    const rows = toDraft(original);
    expect(rows[0].start).toBe("00:00.4");
    expect(changeCount(rows, original)).toBe(0);
  });

  it("saving another field keeps the exact original times", () => {
    const rows = toDraft(original).map((r) => ({ ...r, textVi: "Chào." }));
    expect(collectChanges(rows, original).sentences[0]).toMatchObject({ startMs: 412, endMs: 2669 });
  });
});
