import { describe, expect, it } from "vitest";

import { actionFailure, canPublish, publishIssues, validateUnpublishReason } from "./deckLifecycle";
import type { DeckApiError } from "./deckManageTypes";

function apiError(patch: Partial<DeckApiError>): DeckApiError {
  return { kind: "unknown", status: null, message: null, fieldErrors: [], code: null, details: {}, ...patch };
}

describe("deckLifecycle (UC-BT-05 đến UC-BT-08)", () => {
  it("Bộ có nhóm, mỗi nhóm có thẻ thì đủ điều kiện xuất bản (AC-BT-26, dương)", () => {
    const issues = publishIssues([
      { id: "g1", name: "Nhóm 1", cardCount: 3 },
      { id: "g2", name: "Nhóm 2", cardCount: 1 },
    ]);
    expect(canPublish(issues)).toBe(true);
  });

  it("Nhóm chưa có thẻ hoặc bộ chưa có nhóm thì chưa đủ điều kiện (AC-BT-29, âm)", () => {
    const empty = publishIssues([
      { id: "g1", name: "Nhóm 1", cardCount: 3 },
      { id: "g2", name: "Nhóm trống", cardCount: 0 },
    ]);
    expect(empty).toEqual({ noGroups: false, emptyGroups: ["Nhóm trống"] });
    expect(canPublish(empty)).toBe(false);
    expect(publishIssues([])).toEqual({ noGroups: true, emptyGroups: [] });
  });

  it("Lý do gỡ xuất bản bắt buộc và tối đa 500 ký tự (AC-BT-36, biên)", () => {
    expect(validateUnpublishReason("   ")).toBe("NotBlank");
    expect(validateUnpublishReason("a".repeat(500))).toBeNull();
    expect(validateUnpublishReason("a".repeat(501))).toBe("Size");
  });

  it("Lỗi 422 của server trả danh sách nhóm chưa có thẻ (AC-BT-29)", () => {
    const failure = actionFailure(
      "publish",
      apiError({ status: 422, code: "VOCAB_DECK_NOT_PUBLISHABLE", details: { noGroups: false, emptyGroups: ["G2"] } }),
    );
    expect(failure).toEqual({ kind: "issues", issues: { noGroups: false, emptyGroups: ["G2"] } });
  });

  it("Bộ đã đổi trạng thái ở nơi khác thì đóng hộp và báo (AC-BT-28, 35, 47, 56)", () => {
    expect(actionFailure("publish", apiError({ kind: "conflict", code: "VOCAB_DECK_ALREADY_PUBLISHED" }))).toEqual({
      kind: "close",
      messageKey: "manage.feedback.alreadyPublished",
    });
    expect(actionFailure("unpublish", apiError({ kind: "conflict", code: "VOCAB_DECK_NOT_PUBLISHED" })).kind).toBe(
      "close",
    );
    expect(actionFailure("restore", apiError({ status: 410, code: "VOCAB_DECK_RESTORE_EXPIRED" }))).toEqual({
      kind: "close",
      messageKey: "manage.feedback.restoreExpired",
    });
    expect(actionFailure("restore", apiError({ kind: "conflict", code: "VOCAB_DECK_NOT_DELETED" })).kind).toBe("close");
    expect(actionFailure("delete", apiError({ kind: "notFound", status: 404 })).kind).toBe("close");
    expect(actionFailure("delete", apiError({ kind: "forbidden", status: 403 }))).toEqual({
      kind: "close",
      messageKey: "manage.feedback.forbidden",
    });
  });

  it("Tên khôi phục bị trùng thì hỏi tên mới (AC-BT-46)", () => {
    expect(actionFailure("restore", apiError({ kind: "conflict", code: "VOCAB_DECK_NAME_TAKEN" }))).toEqual({
      kind: "needName",
    });
  });

  it("Mất kết nối thì giữ hộp thoại để thử lại (AC-BT-31, 38, 44, 49)", () => {
    for (const action of ["publish", "unpublish", "delete", "restore"] as const) {
      expect(actionFailure(action, apiError({ kind: "network" }))).toEqual({
        kind: "retry",
        messageKey: `manage.feedback.${action}Failed`,
      });
    }
  });

  it("Lỗi ô nhập (lý do trống) gắn vào ô (AC-BT-36)", () => {
    const failure = actionFailure(
      "unpublish",
      apiError({ kind: "validation", fieldErrors: [{ field: "reason", code: "NotBlank" }] }),
    );
    expect(failure).toEqual({ kind: "field", field: "reason", code: "NotBlank" });
  });
});
