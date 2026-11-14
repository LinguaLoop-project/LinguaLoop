import { describe, expect, it, vi } from "vitest";
import {
  DECK_IMAGE_MAX_BYTES,
  EMPTY_CREATE_DECK,
  cancelCreateDeck,
  submitCreateDeck,
  validateDeckImage,
  validateDeckName,
  type CreateDeckValues,
} from "./createDeckForm";
import type { DeckApiError, TeacherDeckItem } from "./deckManageTypes";

const jpg = (size: number) => new File([new Uint8Array(size)], "anh.jpg", { type: "image/jpeg" });

const created: TeacherDeckItem = {
  id: "d1",
  name: "TOEIC 1",
  imageUrl: null,
  categoryId: null,
  categoryName: null,
  groupCount: 0,
  cardCount: 0,
  pro: false,
  status: "draft",
  updatedAt: "2026-11-13T03:00:00Z",
  deletedAt: null,
};

const networkError: DeckApiError = { kind: "network", status: null, message: null, fieldErrors: [] };

describe("createDeckForm (UC-BT-02)", () => {
  it("Hủy không gọi API và đặt lại biểu mẫu (AC-BT-09, dương)", () => {
    const create = vi.fn();

    const values = cancelCreateDeck();

    expect(create).not.toHaveBeenCalled();
    expect(values).toEqual(EMPTY_CREATE_DECK);
  });

  it("tên trống: lỗi 'Tên bộ là bắt buộc' và giữ ảnh đã chọn (AC-BT-10, âm)", async () => {
    const image = jpg(1000);
    const create = vi.fn();
    const values: CreateDeckValues = { ...EMPTY_CREATE_DECK, name: "   ", image };

    const result = await submitCreateDeck(values, create);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBe("NotBlank");
      expect(result.values.image).toBe(image);
    }
    expect(create).not.toHaveBeenCalled();
  });

  it("ảnh sai: lỗi cạnh ô ảnh và giữ tên đã nhập (AC-BT-12, âm)", async () => {
    const pdf = new File([new Uint8Array(10)], "tai-lieu.pdf", { type: "application/pdf" });
    const big = new File([new Uint8Array(5 * 1024 * 1024)], "lon.png", { type: "image/png" });
    const create = vi.fn();

    for (const image of [pdf, big]) {
      const result = await submitCreateDeck({ ...EMPTY_CREATE_DECK, name: "TOEIC 1", image }, create);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.image).toBe(image === pdf ? "ImageType" : "MaxBytes");
        expect(result.values.name).toBe("TOEIC 1");
      }
    }
    expect(create).not.toHaveBeenCalled();
    expect(validateDeckImage(jpg(DECK_IMAGE_MAX_BYTES))).toBeNull();
    expect(validateDeckImage(jpg(DECK_IMAGE_MAX_BYTES + 1))).toBe("MaxBytes");
  });

  it("mất kết nối khi tạo: giữ nguyên dữ liệu và cho tạo lại (AC-BT-13, âm)", async () => {
    const values: CreateDeckValues = { name: "TOEIC 1", categoryId: "c1", pro: true, image: jpg(500) };
    const create = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValueOnce(created);

    const first = await submitCreateDeck(values, create);
    expect(first.ok).toBe(false);
    if (!first.ok) {
      expect(first.errors.form).toBe("failed");
      expect(first.values).toEqual(values);
    }

    const retry = await submitCreateDeck(values, create);
    expect(retry).toEqual({ ok: true, deck: created });
    expect(create).toHaveBeenLastCalledWith({ name: "TOEIC 1", categoryId: "c1", pro: true }, values.image);
  });

  it("tên 100 hợp lệ, 101 bị lỗi (AC-BT-65, biên)", () => {
    expect(validateDeckName("a".repeat(100))).toBeNull();
    expect(validateDeckName("a".repeat(101))).toBe("Size");
    expect(validateDeckName(`  ${"a".repeat(100)}  `)).toBeNull();
  });

  it("lỗi xin URL tải ảnh (contentType, size) gắn vào ô ảnh (AC-BT-12, âm)", async () => {
    for (const [field, code, expected] of [
      ["contentType", "UploadType", "ImageType"],
      ["size", "MaxBytes", "MaxBytes"],
    ] as const) {
      const error: DeckApiError = { kind: "validation", status: 400, message: null, fieldErrors: [{ field, code }] };
      const result = await submitCreateDeck({ ...EMPTY_CREATE_DECK, name: "Bộ 1", image: jpg(10) }, vi.fn().mockRejectedValue(error));

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.image).toBe(expected);
    }
  });

  it("trùng tên (409) gắn lỗi vào ô tên (AC-BT-11, âm)", async () => {
    const conflict: DeckApiError = { kind: "conflict", status: 409, message: "Bạn đã có bộ thẻ cùng tên", fieldErrors: [] };
    const result = await submitCreateDeck({ ...EMPTY_CREATE_DECK, name: "toeic 1" }, vi.fn().mockRejectedValue(conflict));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBe("Duplicate");
  });
});
