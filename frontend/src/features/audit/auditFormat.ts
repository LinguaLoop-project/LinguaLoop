import type { AuditAction, AuditActorRole, AuditEntityType, AuditFilter, AuditLink, AuditPeriod } from "./types";

/** Hàm thuần cho màn nhật ký: lựa chọn lọc, đường dẫn, cách hiển thị thay đổi (BR-NK-03). */

/** Hành động gom theo chủ đề cho ô lọc, theo thứ tự hiển thị. */
export const AUDIT_ACTION_GROUPS: readonly { key: string; actions: readonly AuditAction[] }[] = [
  { key: "content", actions: ["CREATE", "UPDATE", "DELETE", "PUBLISH", "UNPUBLISH", "RESTORE", "IMPORT"] },
  { key: "report", actions: ["RESOLVE", "REJECT"] },
  { key: "account", actions: ["LOCK", "UNLOCK", "CHANGE_ROLE", "TRANSFER", "GRANT_CREDIT"] },
  { key: "security", actions: ["PASSWORD_RESET", "PASSWORD_CHANGE", "LOGIN_LOCKED"] },
];

/** Loại đối tượng còn được ghi nhật ký (BR-NK-18); mục cũ về câu, thẻ vẫn hiển thị được nhưng không còn trong ô lọc. */
export const AUDIT_ENTITY_TYPES: readonly AuditEntityType[] = ["LESSON", "DECK", "REPORT", "USER", "PLAN", "SETTINGS", "TOPIC", "CATEGORY"];

export const AUDIT_ACTOR_ROLES: readonly AuditActorRole[] = ["student", "teacher", "admin", "system"];

export const AUDIT_PERIODS: readonly AuditPeriod[] = ["D7", "D30", "D90", "ALL"];

/** Mặc định 7 ngày gần nhất, không lọc gì thêm (BR-NK-04). */
export const DEFAULT_AUDIT_FILTER: AuditFilter = { action: "", targetType: "", actorRole: "", period: "D7", q: "" };

/** Có điều kiện nào ngoài khoảng thời gian không: phân biệt "không có mục phù hợp" với "chưa có nhật ký". */
export function hasAuditFilters(filter: AuditFilter): boolean {
  return filter.action !== "" || filter.targetType !== "" || filter.actorRole !== "" || filter.q.trim() !== "";
}

/** Khoảng rộng hơn kế tiếp để gợi ý khi khoảng đang chọn chưa có nhật ký (UC-NK-01 nhánh 2a). */
export function widerPeriod(period: AuditPeriod): AuditPeriod | null {
  const index = AUDIT_PERIODS.indexOf(period);
  return index >= 0 && index < AUDIT_PERIODS.length - 1 ? AUDIT_PERIODS[index + 1] : null;
}

/** Trang quản trị cho "Mở đối tượng" (BR-NK-17); backend chỉ trả liên kết khi đối tượng còn tồn tại. */
export function auditObjectPath(link: AuditLink): string | null {
  switch (link.type) {
    case "LESSON":
      return link.id ? `/admin/lessons/${link.id}` : null;
    case "DECK":
      return link.id ? `/admin/decks/${link.id}` : null;
    case "USER":
      return link.id ? `/admin/users/${link.id}` : null;
    case "PLAN":
      return "/admin/plans";
    case "SETTINGS":
      return "/admin/credit";
    case "TOPIC":
      return "/admin/topics";
    case "CATEGORY":
      return "/admin/categories";
    default:
      return null;
  }
}

/** Thời điểm dạng `dd/mm/yyyy hh:mm` theo giờ máy, giống nhau ở mọi ngôn ngữ. */
export function formatAuditTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Một mục bị đổi. */
export interface ChangeLine {
  field: string;
  old: unknown;
  new: unknown;
}

function isPair(value: unknown): value is { old?: unknown; new?: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value) && ("old" in value || "new" in value);
}

/** Đổi `changes` của backend thành danh sách dòng; mục cũ chỉ có một giá trị được coi là giá trị mới. */
export function changeLines(changes: Record<string, unknown> | null): ChangeLine[] {
  if (!changes) return [];
  return Object.entries(changes).map(([field, value]) =>
    isPair(value) ? { field, old: value.old ?? null, new: value.new ?? null } : { field, old: null, new: value },
  );
}

/** Tạo chỉ hiện "Thông tin lúc tạo" (giá trị mới); hành động khác hiện bảng Trước / Sau (BR-NK-03). */
export function changeMode(action: AuditAction): "snapshot" | "diff" {
  return action === "CREATE" ? "snapshot" : "diff";
}

/** Trường lưu mã, giao diện dịch qua `values.<trường>.<mã>`. */
const CODE_FIELDS = new Set(["status", "role", "reason", "cefrLevel"]);

export type ValueText =
  | { kind: "empty" }
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "code"; field: string; code: string }
  | { kind: "money"; amount: number }
  | { kind: "number"; value: number }
  | { kind: "text"; text: string };

/** Một giá trị thành chữ theo trường: mã dịch qua i18n, số tiền theo đồng, đúng/sai thành Có/Không. */
export function valueText(field: string, value: unknown): ValueText {
  if (value === null || value === undefined || value === "") return { kind: "empty" };
  if (value === true) return { kind: "yes" };
  if (value === false) return { kind: "no" };
  if (typeof value === "string" && CODE_FIELDS.has(field)) return { kind: "code", field, code: value };
  if (typeof value === "number" && field.endsWith("Vnd")) return { kind: "money", amount: value };
  if (typeof value === "string") return { kind: "text", text: value };
  if (typeof value === "number") return { kind: "number", value };
  return { kind: "text", text: JSON.stringify(value) };
}
