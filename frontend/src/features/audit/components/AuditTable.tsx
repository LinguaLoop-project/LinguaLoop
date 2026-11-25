import { useTranslation } from "react-i18next";
import { formatAuditTime } from "../auditFormat";
import type { AuditRow } from "../types";
import { ActionBadge, ActorCell, TargetCell } from "./AuditBits";

export interface AuditTableProps {
  rows: AuditRow[];
  onOpen: (id: number) => void;
  /** Tiêu đề cột đối tượng: "Đối tượng" ở danh sách, "Đối tượng bị tác động" ở lịch sử. */
  targetHeader: string;
  /** Mờ đi khi đang tải trang hoặc bộ lọc mới, giữ khung cũ để không nháy. */
  stale?: boolean;
}

/** Bảng mục nhật ký, mới nhất trước; chọn một dòng để xem chi tiết. */
export default function AuditTable({ rows, onOpen, targetHeader, stale = false }: Readonly<AuditTableProps>) {
  const { t } = useTranslation("auditAdmin");
  return (
    <div className={`overflow-x-auto rounded-xl border border-border bg-surface transition-opacity ${stale ? "opacity-60" : ""}`}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-text-subtle">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("list.colAction")}</th>
            <th className="px-4 py-3 font-semibold">{targetHeader}</th>
            <th className="px-4 py-3 font-semibold">{t("list.colActor")}</th>
            <th className="px-4 py-3 font-semibold">{t("list.colTime")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="relative border-b border-border last:border-0 hover:bg-surface-hover">
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpen(row.id)}
                  className="cursor-pointer after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
                >
                  <ActionBadge action={row.action} />
                  <span className="sr-only">{t("list.openDetail")}</span>
                </button>
              </td>
              <td className="max-w-80 px-4 py-3">
                <TargetCell row={row} />
              </td>
              <td className="px-4 py-3">
                <ActorCell name={row.actorName} role={row.actorRole} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-text-muted">{formatAuditTime(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
