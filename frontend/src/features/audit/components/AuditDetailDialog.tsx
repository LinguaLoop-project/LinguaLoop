import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "@/components/common/Button";
import { buttonClasses } from "@/components/common/buttonStyles";
import Dialog from "@/components/common/Dialog";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { auditObjectPath, formatAuditTime } from "../auditFormat";
import { useAuditDetail } from "../hooks";
import { ActionBadge, ActorCell, ChangeList } from "./AuditBits";

export interface AuditDetailDialogProps {
  /** Mục đang xem; null là đóng. */
  entryId: number | null;
  onClose: () => void;
}

/**
 * Chi tiết một mục nhật ký (UC-NK-01 Bước 6): hành động, đối tượng và đối tượng chứa, người thực hiện, thời điểm, phần
 * thay đổi theo loại hành động, lý do hoặc ghi chú; kèm "Mở đối tượng" khi đối tượng còn tồn tại (nhánh 6a).
 */
export default function AuditDetailDialog({ entryId, onClose }: Readonly<AuditDetailDialogProps>) {
  const { t } = useTranslation("auditAdmin");
  const titleId = useId();
  const query = useAuditDetail(entryId);
  const detail = query.data;
  const entry = detail?.entry;
  const openPath = detail?.open ? auditObjectPath(detail.open) : null;

  return (
    <Dialog open={entryId !== null} onClose={onClose} labelledBy={titleId} wide>
      <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto">
        <h2 id={titleId} className="text-lg font-bold text-text">
          {t("detail.title")}
        </h2>

        {query.isLoading && <Skeleton className="h-40 w-full" />}
        {query.isError && (
          <div role="alert" className="flex flex-col items-start gap-3 text-sm text-text-muted">
            <p>{t("detail.loadError")}</p>
            <Button variant="secondary" size="sm" leftIcon={<Icon name="rotate-cw" />} onClick={() => void query.refetch()}>
              {t("common:error.retry")}
            </Button>
          </div>
        )}

        {entry && (
          <>
            <dl className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-2.5 text-sm">
              <dt className="text-text-muted">{t("detail.action")}</dt>
              <dd>
                <ActionBadge action={entry.action} />
              </dd>
              <dt className="text-text-muted">{t("detail.target")}</dt>
              <dd className="text-text">
                <span className="font-semibold">{entry.targetName ?? t("list.unnamed")}</span>
                <span className="text-text-muted"> · {t(`entities.${entry.targetType}`)}</span>
              </dd>
              {entry.parentType && (
                <>
                  <dt className="text-text-muted">{t("detail.parent")}</dt>
                  <dd className="text-text">
                    {detail.parentName && <span className="font-semibold">{detail.parentName}</span>}
                    <span className={detail.parentName ? "text-text-muted" : ""}>
                      {detail.parentName ? " · " : ""}
                      {t(`entities.${entry.parentType}`)}
                    </span>
                  </dd>
                </>
              )}
              <dt className="text-text-muted">{t("detail.actor")}</dt>
              <dd>
                <ActorCell name={entry.actorName} role={entry.actorRole} />
              </dd>
              <dt className="text-text-muted">{t("detail.time")}</dt>
              <dd className="text-text">{formatAuditTime(entry.createdAt)}</dd>
            </dl>

            <ChangeList action={entry.action} changes={detail.changes} />

            {detail.note && (
              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-text">{t("detail.note")}</h3>
                <p className="whitespace-pre-line rounded-lg bg-surface-hover px-3 py-2 text-sm text-text">{detail.note}</p>
              </section>
            )}
          </>
        )}

        <div className="mt-1 flex flex-wrap justify-end gap-2">
          {openPath && (
            <Link to={openPath} onClick={onClose} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              <Icon name="arrow-right" />
              {t("detail.open")}
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("detail.close")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
