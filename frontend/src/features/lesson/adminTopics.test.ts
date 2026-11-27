import { describe, expect, it } from "vitest";
import type { AdminApiError } from "@/features/user";
import {
  EMPTY_TOPIC_FILTER,
  topicListParams,
  topicListState,
  topicSaveError,
  type AdminTopic,
} from "./adminTopics";

const TOPIC: AdminTopic = { id: "t1", name: "Du lịch", publishedLessons: 5, visible: true, updatedAt: "2026-11-25T00:00:00Z" };
const TEXTS = { nameTaken: "trùng", invalid: "sai", saveFailed: "lỗi lưu" };

function apiError(partial: Partial<AdminApiError>): AdminApiError {
  return { kind: "conflict", status: 409, code: null, message: null, fieldErrors: [], details: {}, ...partial };
}

describe("topicListParams (UC-CD-01 bước 3)", () => {
  it("không lọc thì không gửi tham số", () => {
    expect(topicListParams(EMPTY_TOPIC_FILTER)).toEqual({});
    expect(topicListParams({ q: "   ", visibility: "" })).toEqual({});
  });

  it("gửi từ khóa đã bỏ khoảng trắng và trạng thái hiển thị (AC-CD-02)", () => {
    expect(topicListParams({ q: " Du ", visibility: "hidden" })).toEqual({ q: "Du", visible: false });
    expect(topicListParams({ q: "", visibility: "visible" })).toEqual({ visible: true });
  });
});

describe("topicListState", () => {
  it("chưa có chủ đề nào khi không lọc mà danh sách rỗng (AC-CD-03)", () => {
    expect(topicListState([], EMPTY_TOPIC_FILTER)).toBe("none");
  });

  it("không có chủ đề phù hợp khi đang tìm hoặc lọc (AC-CD-04)", () => {
    expect(topicListState([], { q: "zzz", visibility: "" })).toBe("noMatch");
    expect(topicListState([], { q: "", visibility: "visible" })).toBe("noMatch");
  });

  it("có dữ liệu", () => {
    expect(topicListState([TOPIC], { q: "Du", visibility: "" })).toBe("items");
  });
});

describe("topicSaveError", () => {
  it("trùng tên hiện cạnh ô tên (AC-CD-08, 13)", () => {
    expect(topicSaveError(apiError({ code: "TOPIC_NAME_TAKEN" }), TEXTS)).toEqual({ ok: false, fieldError: "trùng" });
  });

  it("mất kết nối hiện thông báo lưu không thành công (AC-CD-09, 14)", () => {
    expect(topicSaveError(apiError({ kind: "network", status: null }), TEXTS)).toEqual({ ok: false, notice: "lỗi lưu" });
  });

  it("lỗi kiểm tra tên từ máy chủ hiện cạnh ô tên (AC-CD-07)", () => {
    const error = apiError({
      status: 400,
      code: "VALIDATION_FAILED",
      fieldErrors: [{ field: "name", code: "NotBlank", message: null }],
    });
    expect(topicSaveError(error, TEXTS)).toEqual({ ok: false, fieldError: "sai" });
  });

  it("lỗi khác hiện thông báo chung", () => {
    expect(topicSaveError(apiError({ code: "TOPIC_NOT_FOUND", status: 404 }), TEXTS)).toEqual({
      ok: false,
      notice: "lỗi lưu",
    });
  });
});
