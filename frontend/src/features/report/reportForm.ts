import type { ReportFilter, ReportReason, ReportTargetType, SubmitReportInput } from "./types";

/** Độ dài tối đa của bản sửa, mô tả, ghi chú và lý do (BR-BC-06, BR-BC-09, BR-XL-04). */
export const REPORT_TEXT_MAX = 500;

/** Lý do theo loại nội dung, đúng thứ tự hiển thị (BR-BC-05). */
export const REASONS: Record<ReportTargetType, ReportReason[]> = {
  sentence: ["subtitle_en", "ipa", "translation", "timing", "offensive", "other"],
  card: ["word", "phonetic", "meaning", "example", "offensive", "other"],
};

/** Lý do dùng chung cho câu và thẻ, luôn đứng cuối danh sách. */
const COMMON_REASONS: ReportReason[] = ["offensive", "other"];

export type ReasonGroup = ReportTargetType | "common";

/**
 * Lý do trong bộ lọc danh sách báo cáo, chia nhóm Câu, Thẻ, rồi nhóm chung (Phản cảm, Khác). Đã chọn loại nội dung thì
 * chỉ còn nhóm của loại đó và nhóm chung. Giáo viên không thấy Phản cảm (BR-XL-01).
 */
export function reasonFilterGroups(
  type: ReportFilter["type"],
  role: "teacher" | "admin",
): { group: ReasonGroup; reasons: ReportReason[] }[] {
  const types: ReportTargetType[] = type ? [type] : ["sentence", "card"];
  const groups: { group: ReasonGroup; reasons: ReportReason[] }[] = types.map((t) => ({
    group: t,
    reasons: REASONS[t].filter((r) => !COMMON_REASONS.includes(r)),
  }));
  const common = COMMON_REASONS.filter((r) => role === "admin" || r !== "offensive");
  return [...groups, { group: "common", reasons: common }];
}

/** Lý do đang lọc còn hợp với loại nội dung mới chọn không; không thì bộ lọc lý do về "Mọi lý do". */
export function reasonFitsType(reason: ReportFilter["reason"], type: ReportFilter["type"]): boolean {
  return !reason || !type || REASONS[type].includes(reason);
}

/**
 * Các trường bản sửa có thể thay vào, theo lý do (BR-BC-11). Một trường thì chọn sẵn; nhiều trường thì học viên chọn.
 * Lý do vắng ở đây bắt buộc mô tả thay vì bản sửa (BR-BC-05).
 */
const FIX_FIELDS: Partial<Record<ReportReason, string[]>> = {
  subtitle_en: ["text_en"],
  ipa: ["ipa_us", "ipa_uk"],
  translation: ["text_vi"],
  word: ["word"],
  phonetic: ["ipa_us", "ipa_uk"],
  meaning: ["meaning_vi", "definition_en", "definition_vi"],
  example: ["example_en", "example_vi"],
};

/** Lý do bắt buộc bản sửa đúng; các lý do còn lại bắt buộc mô tả (BR-BC-05). */
export function requiresFix(reason: ReportReason): boolean {
  return reason in FIX_FIELDS;
}

export function fixFieldsOf(reason: ReportReason): string[] {
  return FIX_FIELDS[reason] ?? [];
}

/** Trường được chọn sẵn khi đổi lý do: lý do một trường thì là trường đó, nhiều trường thì để học viên chọn. */
export function defaultFixField(reason: ReportReason): string {
  const fields = fixFieldsOf(reason);
  return fields.length === 1 ? fields[0] : "";
}

export interface ReportFormValues {
  reason: ReportReason | "";
  fixField: string;
  suggestedFix: string;
  description: string;
}

export type ReportFormErrors = Partial<
  Record<"reason" | "fixField" | "suggestedFix" | "description", "NotBlank" | "Size" | "Different">
>;

function length(text: string): number {
  return Array.from(text).length;
}

/**
 * Kiểm tra biểu mẫu báo cáo trước khi gửi, cùng quy tắc với backend (BR-BC-05, 06, 09). `current` là giá trị hiện tại
 * của các cột nội dung, để chặn bản sửa giống hệt; vắng thì bỏ qua bước này.
 */
export function validateReportForm(values: ReportFormValues, current?: Record<string, string | null>): ReportFormErrors {
  const errors: ReportFormErrors = {};
  if (!values.reason) {
    errors.reason = "NotBlank";
    return errors;
  }
  const fix = values.suggestedFix.trim();
  const description = values.description.trim();
  if (requiresFix(values.reason)) {
    const field = fixFieldsOf(values.reason).includes(values.fixField) ? values.fixField : "";
    if (!field) errors.fixField = "NotBlank";
    if (!fix) errors.suggestedFix = "NotBlank";
    else if (length(fix) > REPORT_TEXT_MAX) errors.suggestedFix = "Size";
    else if (current && field && (current[field] ?? "").trim() === fix) errors.suggestedFix = "Different";
    if (length(description) > REPORT_TEXT_MAX) errors.description = "Size";
  } else if (!description) {
    errors.description = "NotBlank";
  } else if (length(description) > REPORT_TEXT_MAX) {
    errors.description = "Size";
  }
  return errors;
}

/** Dữ liệu gửi lên: cắt khoảng trắng, bỏ trường không dùng theo lý do. */
export function toSubmitInput(
  targetType: ReportTargetType,
  targetId: string,
  values: ReportFormValues & { reason: ReportReason },
): SubmitReportInput {
  const needsFix = requiresFix(values.reason);
  const fix = needsFix ? values.suggestedFix.trim() : "";
  const description = values.description.trim();
  return {
    targetType,
    targetId,
    reason: values.reason,
    suggestedFix: fix || null,
    fixField: needsFix && values.fixField ? values.fixField : null,
    description: description || null,
  };
}

/** Ghi chú xử lý, lý do từ chối: bắt buộc, 1 đến 500 ký tự (BR-XL-04). */
export function validateNote(note: string): "NotBlank" | "Size" | null {
  const text = note.trim();
  if (!text) return "NotBlank";
  if (length(text) > REPORT_TEXT_MAX) return "Size";
  return null;
}

export const DEFAULT_REPORT_FILTER: ReportFilter = {
  status: "default",
  type: "",
  reason: "",
  overdue: false,
  q: "",
  sort: "newest",
  noHandler: false,
  frequentRejected: false,
  reporterId: null,
  ownerId: null,
};

type Params = Record<string, string | number | boolean>;

/** Tham số query của danh sách; bỏ tham số mặc định để server tự lọc sẵn (BR-XL-03). */
export function listParams(filter: ReportFilter, page: number, role: "teacher" | "admin"): Params {
  const params: Params = { page };
  if (filter.status !== "default") params.status = filter.status;
  if (filter.type) params.type = filter.type;
  if (filter.reason) params.reason = filter.reason;
  if (filter.overdue) params.overdue = true;
  const q = filter.q.trim();
  if (q) params.q = q;
  if (filter.sort === "oldest") params.sort = "oldest";
  if (role === "admin") {
    if (filter.noHandler) params.noHandler = true;
    if (filter.frequentRejected) params.frequentRejected = true;
    if (filter.reporterId) params.reporterId = filter.reporterId;
    if (filter.ownerId) params.ownerId = filter.ownerId;
  }
  return params;
}

/** Bộ lọc có khác mặc định không (để hiện "Xóa bộ lọc" khi không có kết quả). */
export function isFiltered(filter: ReportFilter): boolean {
  return JSON.stringify(filter) !== JSON.stringify(DEFAULT_REPORT_FILTER);
}
