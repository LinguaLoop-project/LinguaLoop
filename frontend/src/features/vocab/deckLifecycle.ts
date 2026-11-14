// Xuất bản, gỡ xuất bản, xóa, khôi phục bộ thẻ (UC-BT-05 đến UC-BT-08): điều kiện xuất bản và cách xử lý lỗi.
import type { DeckApiError, DeckGroup } from "./deckManageTypes";

export type LifecycleAction = "publish" | "unpublish" | "delete" | "restore";

/** Điều kiện xuất bản chưa đạt (BR-BT-05): chưa có nhóm thẻ, hoặc tên các nhóm chưa có thẻ. */
export interface PublishIssues {
  noGroups: boolean;
  emptyGroups: string[];
}

export function publishIssues(groups: DeckGroup[]): PublishIssues {
  return { noGroups: groups.length === 0, emptyGroups: groups.filter((g) => g.cardCount === 0).map((g) => g.name) };
}

export function canPublish(issues: PublishIssues): boolean {
  return !issues.noGroups && issues.emptyGroups.length === 0;
}

/** Lý do quản trị viên gỡ xuất bản: bắt buộc, tối đa 500 ký tự sau khi cắt khoảng trắng (BR-BT-08). */
export const UNPUBLISH_REASON_MAX = 500;

export function validateUnpublishReason(reason: string): "NotBlank" | "Size" | null {
  const trimmed = reason.trim();
  if (trimmed === "") return "NotBlank";
  if ([...trimmed].length > UNPUBLISH_REASON_MAX) return "Size";
  return null;
}

/**
 * Cách giao diện phản ứng khi thao tác thất bại:
 * - `close`: đóng hộp thoại, báo `messageKey` và làm mới danh sách (bộ đã đổi ở nơi khác, không có quyền, quá hạn);
 * - `retry`: giữ hộp thoại, báo `messageKey`, cho thử lại (mất kết nối, lỗi máy chủ; AC-BT-31, 38, 44, 49);
 * - `issues`: bộ chưa đủ điều kiện xuất bản (AC-BT-29);
 * - `needName`: tên bộ khôi phục bị trùng, cần nhập tên mới (AC-BT-46);
 * - `field`: lỗi một ô nhập (lý do gỡ, tên mới).
 */
export type ActionFailure =
  | { kind: "close"; messageKey: string }
  | { kind: "retry"; messageKey: string }
  | { kind: "issues"; issues: PublishIssues }
  | { kind: "needName" }
  | { kind: "field"; field: string; code: string };

const CLOSE_BY_CODE: Record<string, string> = {
  VOCAB_DECK_ALREADY_PUBLISHED: "manage.feedback.alreadyPublished",
  VOCAB_DECK_NOT_PUBLISHED: "manage.feedback.notPublished",
  VOCAB_DECK_NOT_DELETED: "manage.feedback.alreadyRestored",
  VOCAB_DECK_RESTORE_EXPIRED: "manage.feedback.restoreExpired",
  VOCAB_DECK_NOT_FOUND: "manage.feedback.notFound",
};

function issuesFromDetails(details: Record<string, unknown> | undefined): PublishIssues {
  const emptyGroups = Array.isArray(details?.emptyGroups)
    ? details.emptyGroups.filter((name): name is string => typeof name === "string")
    : [];
  return { noGroups: details?.noGroups === true, emptyGroups };
}

export function actionFailure(action: LifecycleAction, error: DeckApiError): ActionFailure {
  const code = error.code ?? "";
  if (code === "VOCAB_DECK_NOT_PUBLISHABLE") return { kind: "issues", issues: issuesFromDetails(error.details) };
  if (code === "VOCAB_DECK_NAME_TAKEN") return { kind: "needName" };
  if (CLOSE_BY_CODE[code]) return { kind: "close", messageKey: CLOSE_BY_CODE[code] };
  if (error.kind === "notFound") return { kind: "close", messageKey: "manage.feedback.notFound" };
  if (error.kind === "forbidden") return { kind: "close", messageKey: "manage.feedback.forbidden" };
  if (error.kind === "validation" && error.fieldErrors.length > 0) {
    const [{ field, code: fieldCode }] = error.fieldErrors;
    return { kind: "field", field, code: fieldCode };
  }
  return { kind: "retry", messageKey: `manage.feedback.${action}Failed` };
}
