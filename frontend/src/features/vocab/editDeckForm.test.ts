import { describe, expect, it, vi } from "vitest";

import type { DeckApiError, DeckDetail } from "./deckManageTypes";
import {
  editValuesFromDetail,
  isEditDirty,
  submitEditDeck,
  toUpdateDeckInput,
  type EditDeckValues,
} from "./editDeckForm";

const detail: DeckDetail = {
  id: "d1",
  name: "TOEIC 1",
  imageUrl: "https://cdn.test/a.jpg",
  categoryId: "c1",
  categoryName: "Học thuật",
  pro: false,
  status: "draft",
  updatedAt: "2026-11-13T03:00:00Z",
  ownerId: "t1",
  ownerName: "GV A",
  unpublishReason: null,
  cardCount: 2,
  groups: [],
};

function err(patch: Partial<DeckApiError>): DeckApiError {
  return { kind: "unknown", status: null, message: null, fieldErrors: [], ...patch };
}

describe("editDeckForm (UC-BT-03)", () => {
  it("Biểu mẫu nạp sẵn dữ liệu hiện có của bộ (bước 2)", () => {
    expect(editValuesFromDetail(detail)).toEqual({
      name: "TOEIC 1",
      categoryId: "c1",
      pro: false,
      image: null,
      removeImage: false,
    });
  });

  it("Chỉ hiện thanh Lưu khi có thay đổi thật (bước 3)", () => {
    const base = editValuesFromDetail(detail);
    expect(isEditDirty(base, detail)).toBe(false);
    expect(isEditDirty({ ...base, name: " TOEIC 1 " }, detail)).toBe(false);
    expect(isEditDirty({ ...base, name: "TOEIC 2" }, detail)).toBe(true);
    expect(isEditDirty({ ...base, pro: true }, detail)).toBe(true);
    expect(isEditDirty({ ...base, removeImage: true }, detail)).toBe(true);
    expect(isEditDirty({ ...base, removeImage: true }, { ...detail, imageUrl: null })).toBe(false);
  });

  it("Sửa hợp lệ thì gửi tên đã cắt khoảng trắng (AC-BT-14, dương)", async () => {
    const update = vi.fn().mockResolvedValue(detail);
    const values: EditDeckValues = { ...editValuesFromDetail(detail), name: "  TOEIC 2 ", categoryId: "c2" };
    const result = await submitEditDeck(values, update);
    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ name: "TOEIC 2", categoryId: "c2", pro: false, removeImage: false }, null);
  });

  it("Xóa ảnh thì gửi removeImage, chọn ảnh mới thì bỏ cờ xóa (AC-BT-16)", () => {
    const base = editValuesFromDetail(detail);
    expect(toUpdateDeckInput({ ...base, removeImage: true }).removeImage).toBe(true);
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    expect(toUpdateDeckInput({ ...base, removeImage: true, image: file }).removeImage).toBe(false);
  });

  it("Tên trống thì không gọi API và giữ thay đổi (AC-BT-19, âm)", async () => {
    const update = vi.fn();
    const values: EditDeckValues = { ...editValuesFromDetail(detail), name: "  ", pro: true };
    const result = await submitEditDeck(values, update);
    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, values, errors: { name: "NotBlank" } });
  });

  it("Trùng tên, không có quyền, bộ đã xóa, mất kết nối (AC-BT-20, 17, 18, 21)", async () => {
    const values = editValuesFromDetail(detail);
    const run = async (error: DeckApiError) => {
      const result = await submitEditDeck(values, vi.fn().mockRejectedValue(error));
      return result.ok ? null : result.errors;
    };
    expect(await run(err({ kind: "conflict", status: 409 }))).toEqual({ name: "Duplicate" });
    expect(await run(err({ kind: "forbidden", status: 403 }))).toEqual({ form: "forbidden" });
    expect(await run(err({ kind: "notFound", status: 404 }))).toEqual({ form: "notFound" });
    expect(await run(err({ kind: "network" }))).toEqual({ form: "failed" });
  });
});
