import { useTranslation } from "react-i18next";
import Badge from "@/components/common/Badge";
import Icon from "@/components/common/Icon";
import { changeLines, changeMode, valueText } from "../auditFormat";
import type { AuditAction, AuditActorRole, AuditRow } from "../types";

/** Thành phần nhỏ dùng chung giữa danh sách nhật ký và chi tiết một mục. */

const ACTION_TONE: Partial<Record<AuditAction, string>> = {
  CREATE: "success",
  PUBLISH: "success",
  RESTORE: "success",
  UNLOCK: "success",
  RESOLVE: "success",
  DELETE: "danger",
  LOCK: "danger",
  LOGIN_LOCKED: "danger",
  UNPUBLISH: "warning",
  REJECT: "warning",
};

export function ActionBadge({ action }: Readonly<{ action: AuditAction }>) {
  const { t } = useTranslation("auditAdmin");
  return <Badge variant={ACTION_TONE[action] ?? "default"}>{t(`actions.${action}`)}</Badge>;
}

/** Người thực hiện kèm vai trò; thao tác tự động ghi "Hệ thống" (BR-NK-03). */
export function ActorCell({ name, role }: Readonly<{ name: string; role: AuditActorRole }>) {
  const { t } = useTranslation("auditAdmin");
  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex items-center gap-1.5 truncate font-medium text-text">
        {role === "system" && <Icon name="bot" className="size-3.5 shrink-0 text-text-subtle" />}
        {name}
      </span>
      {role !== "system" && <span className="text-xs text-text-muted">{t(`roles.${role}`)}</span>}
    </div>
  );
}

/** Loại và tên đối tượng; đối tượng con ghi thêm đối tượng chứa (câu thuộc bài học, thẻ thuộc bộ thẻ). */
export function TargetCell({ row }: Readonly<{ row: AuditRow }>) {
  const { t } = useTranslation("auditAdmin");
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-text">{row.targetName ?? t("list.unnamed")}</span>
      <span className="text-xs text-text-muted">
        {t(`entities.${row.targetType}`)}
        {row.parentType && ` · ${t("list.inParent", { type: t(`entities.${row.parentType}`).toLowerCase() })}`}
      </span>
    </div>
  );
}

function Value({ field, value }: Readonly<{ field: string; value: unknown }>) {
  const { t, i18n } = useTranslation("auditAdmin");
  const text = valueText(field, value);
  const locale = i18n.language.startsWith("en") ? "en-GB" : "vi-VN";
  switch (text.kind) {
    case "empty":
      return <span className="text-text-subtle">{t("values.empty")}</span>;
    case "yes":
    case "no":
      return <span className="text-text">{t(`values.${text.kind}`)}</span>;
    case "code":
      return <span className="text-text">{t(`values.${text.field}.${text.code}`, { defaultValue: text.code })}</span>;
    case "money":
      return <span className="text-text">{`${new Intl.NumberFormat(locale).format(text.amount)} đ`}</span>;
    case "number":
      return <span className="text-text">{new Intl.NumberFormat(locale).format(text.value)}</span>;
    default:
      return <span className="break-words text-text">{text.text}</span>;
  }
}

/**
 * Phần thay đổi của một mục (BR-NK-03): thao tác tạo hiện "Thông tin lúc tạo" một cột giá trị; thao
 * tác khác hiện bảng Trước / Sau (AC-NK-03).
 */
export function ChangeList({ action, changes }: Readonly<{ action: AuditAction; changes: Record<string, unknown> | null }>) {
  const { t, i18n } = useTranslation("auditAdmin");
  const lines = changeLines(changes);
  if (lines.length === 0) return null;
  const label = (field: string) => (i18n.exists(`fields.${field}`, { ns: "auditAdmin" }) ? t(`fields.${field}`) : field);
  const snapshot = changeMode(action) === "snapshot";
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text">{t(snapshot ? "detail.createdInfo" : "detail.changes")}</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          {!snapshot && (
            <thead className="border-b border-border bg-surface-hover/40 text-xs text-text-subtle">
              <tr>
                <th className="px-3 py-2 font-semibold">{t("detail.field")}</th>
                <th className="px-3 py-2 font-semibold">{t("detail.before")}</th>
                <th className="px-3 py-2 font-semibold">{t("detail.after")}</th>
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-border align-top">
            {lines.map((line) => (
              <tr key={line.field}>
                <th scope="row" className="w-40 px-3 py-2 font-medium text-text-muted">
                  {label(line.field)}
                </th>
                {!snapshot && (
                  <td className="px-3 py-2">
                    <Value field={line.field} value={line.old} />
                  </td>
                )}
                <td className="px-3 py-2">
                  <Value field={line.field} value={line.new} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
