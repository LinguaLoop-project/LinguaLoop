import { describe, expect, it } from "vitest";
import type { AdminApiError } from "@/features/user";
import { categoryListState, categorySaveError, type AdminCategory } from "./categoryAdmin";

const CATEGORY: AdminCategory = { id: "c1", name: "Học thuật", publishedDecks: 4, updatedAt: "2026-11-25T00:00:00Z" };
const TEXTS = { nameTaken: "trùng", invalid: "sai", saveFailed: "lỗi lưu" };

function apiError(partial: Partial<AdminApiError>): AdminApiError {
  return { kind: "conflict", status: 409, code: null, message: null, fieldErrors: [], details: {}, ...partial };
}

describe("categoryListState", () => {
  it("chưa có danh mục nào khi không tìm mà danh sách rỗng (AC-CD-17)", () => {
    expect(categoryListState([], "")).toBe("none");
    expect(categoryListState([], "  ")).toBe("none");
  });

  it("không có danh mục phù hợp khi đang tìm (AC-CD-18)", () => {
    expect(categoryListState([], "zzz")).toBe("noMatch");
  });

  it("có dữ liệu (AC-CD-15)", () => {
    expect(categoryListState([CATEGORY], "")).toBe("items");
  });
});

describe("categorySaveError", () => {
  it("trùng tên hiện cạnh ô tên (AC-CD-22, 27)", () => {
    expect(categorySaveError(apiError({ code: "DECK_CATEGORY_NAME_TAKEN" }), TEXTS)).toEqual({
      ok: false,
      fieldError: "trùng",
    });
  });

  it("mất kết nối hiện thông báo lưu không thành công (AC-CD-23, 28)", () => {
    expect(categorySaveError(apiError({ kind: "network", status: null }), TEXTS)).toEqual({
      ok: false,
      notice: "lỗi lưu",
    });
  });

  it("lỗi kiểm tra tên từ máy chủ hiện cạnh ô tên (AC-CD-21)", () => {
    const error = apiError({ status: 400, fieldErrors: [{ field: "name", code: "Size", message: null }] });
    expect(categorySaveError(error, TEXTS)).toEqual({ ok: false, fieldError: "sai" });
  });
});
