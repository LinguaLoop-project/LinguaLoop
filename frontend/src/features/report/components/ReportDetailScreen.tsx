import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import ErrorState from "@/components/common/ErrorState";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { useReportDetail } from "../hooks";
import { reportListPath, contentEditPath } from "../paths";
import { cellText, compareRows, formatDateTime, statusKey } from "../reportFormat";
import type { ReportApiError, ReportDetail, ReportEntry, ReviewRole } from "../types";
import ApplyFixDialog from "./ApplyFixDialog";
import ContentPreviewDialog from "./ContentPreviewDialog";
import HandleReportDialog, { type HandleMode } from "./HandleReportDialog";
import { StatusPill } from "./reportBits";

interface Pending {
  mode: HandleMode;
  reporter?: { id: string; name: string };
}

/**
 * Chi tiết một dòng báo cáo (UC-XL-01 Bước 8): nội dung lúc báo cạnh nội dung hiện tại (BR-BC-10), từng báo cáo trong
 * dòng với bản sửa đề xuất, mô tả và kết quả xử lý (BR-XL-07), và các thao tác tác nhân được làm ở trạng thái hiện tại.
 * Chỉ quản trị viên thấy tên và số liệu người báo, và từ chối hàng loạt theo học viên (BR-XL-09, BR-XL-14).
 */
export default function ReportDetailScreen({ role }: Readonly<{ role: ReviewRole }>) {
  const { t } = useTranslation("report");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useReportDetail(role, id);
  const [pending, setPending] = useState<Pending | null>(null);
  const backToList = () => navigate(reportListPath(role));

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-64 w-full" />;
  } else if (query.isError || !query.data) {
    const error = query.error as unknown as ReportApiError | null;
    body =
      error?.kind === "forbidden" ? (
        <FormAlert variant="danger">{t("dialog.forbidden")}</FormAlert>
      ) : (
        <ErrorState
          kind={error?.kind === "network" ? "network" : error?.kind === "notFound" ? "notFound" : "server"}
          onRetry={() => void query.refetch()}
        />
      );
  } else {
    body = <DetailBody role={role} detail={query.data} onAction={setPending} onGone={backToList} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6">
      <Link to={reportListPath(role)} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <Icon name="arrow-left" className="size-4" />
        {t("detail.back")}
      </Link>
      {body}
      {pending && query.data && (
        <HandleReportDialog
          role={role}
          mode={pending.mode}
          reportId={query.data.item.id}
          groupSize={query.data.item.reportCount}
          reporter={pending.reporter}
          takedown={{ containerName: query.data.item.containerName, count: query.data.takedownCount }}
          onClose={() => setPending(null)}
          onDone={() => {
            setPending(null);
            if (pending.mode !== "rejectAll") backToList();
          }}
        />
      )}
    </main>
  );
}

function DetailBody({
  role,
  detail,
  onAction,
  onGone,
}: Readonly<{ role: ReviewRole; detail: ReportDetail; onAction: (pending: Pending) => void; onGone: () => void }>) {
  const { t } = useTranslation("report");
  const navigate = useNavigate();
  const [applying, setApplying] = useState<ReportEntry | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const { item } = detail;
  const rows = compareRows(detail.snapshot, detail.current);
  const hasSnapshot = Object.keys(detail.snapshot).length > 0;
  const can = (action: string) => detail.actions.includes(action as never);
  const editPath = role === "teacher" ? contentEditPath(item) : null;
  // Chỉ giáo viên chủ, khi dòng còn chờ mình xử lý, mới áp dụng được bản sửa đề xuất (BR-XL-10).
  const canApply = role === "teacher" && can("resolve");

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={item.status} label={t(statusKey(role, item.status))} />
          <Badge tone={item.reason === "offensive" ? "danger" : "info"}>{t(`reasons.${item.reason}`)}</Badge>
          <Badge tone="primary">{t(`type.${item.targetType}`)}</Badge>
          {item.reportCount > 1 && <Badge tone="accent">{t("list.count", { count: item.reportCount })}</Badge>}
          {item.overdue && <Badge tone="warning">{t("list.overdue")}</Badge>}
        </div>
        <h1 className="text-xl font-bold text-text">{item.content}</h1>
        <p className="text-sm text-text-muted">
          {item.containerName}
          {role === "admin" && ` · ${item.ownerName ? t("list.owner", { name: item.ownerName }) : t("list.noOwner")}`}
        </p>
        <Button
          type="button"
          variant="text"
          size="sm"
          className="self-start"
          leftIcon={<Icon name="eye" />}
          onClick={() => setPreviewing(true)}
        >
          {t("preview.open")}
        </Button>
      </header>

      {role === "admin" && item.noHandler && item.status === "waiting_teacher" && (
        <FormAlert variant="warning">{t("detail.noHandlerNotice")}</FormAlert>
      )}
      {item.containerDeleted && <FormAlert variant="warning">{t("detail.deletedNotice")}</FormAlert>}

      <section className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-elevated text-text-muted">
            <tr>
              <th className="px-4 py-2 font-semibold" scope="col">
                <span className="sr-only">{t("list.type")}</span>
              </th>
              <th className="px-4 py-2 font-semibold" scope="col">
                {t("detail.snapshot")}
              </th>
              <th className="px-4 py-2 font-semibold" scope="col">
                {t("detail.current")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.field} className="border-t border-border align-top">
                <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium text-text-muted">
                  {t(`fields.${row.field}`)}
                </th>
                <td className="px-4 py-2 text-text">{cellText(row.field, row.before, t)}</td>
                <td className="px-4 py-2 text-text">
                  {cellText(row.field, row.after, t)}
                  {row.changed && (
                    <Badge tone="success" className="ml-2">
                      {t("detail.changed")}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!hasSnapshot && <p className="px-4 py-2 text-xs text-text-muted">{t("detail.noSnapshot")}</p>}
      </section>

      {detail.actions.length > 0 && (
        <section className="flex flex-col gap-2">
          {can("resolve") && <p className="text-sm text-text-muted">{t("detail.resolveHint")}</p>}
          <div className="flex flex-wrap gap-3">
            {editPath && can("resolve") && (
              <Button type="button" variant="secondary" leftIcon={<Icon name="pencil" />} onClick={() => navigate(editPath)}>
                {t("detail.openContent")}
              </Button>
            )}
            {can("resolve") && (
              <Button type="button" leftIcon={<Icon name="circle-check" />} onClick={() => onAction({ mode: "resolve" })}>
                {t("detail.resolve")}
              </Button>
            )}
            {can("reject") && (
              <Button type="button" variant="danger" leftIcon={<Icon name="circle-x" />} onClick={() => onAction({ mode: "reject" })}>
                {t("detail.reject")}
              </Button>
            )}
            {can("takedown") && (
              <Button
                type="button"
                variant="danger"
                leftIcon={<Icon name="eye-off" />}
                onClick={() => onAction({ mode: "takedown" })}
              >
                {t("detail.takedown")}
              </Button>
            )}
            {can("assign") && (
              <Button type="button" variant="secondary" disabled title={t("detail.comingSoon")}>
                {t("detail.assign")}
              </Button>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-text">{t("detail.reports", { count: detail.reports.length })}</h2>
        <ul className="flex flex-col gap-2.5">
          {detail.reports.map((entry) => (
            <EntryRow
              key={entry.id}
              role={role}
              entry={entry}
              onAction={onAction}
              onApply={canApply && entry.suggestedFix && entry.fixField ? () => setApplying(entry) : undefined}
            />
          ))}
        </ul>
      </section>

      {applying && (
        <ApplyFixDialog
          reportId={item.id}
          entry={applying}
          current={detail.current[applying.fixField ?? ""] ?? null}
          onClose={() => setApplying(null)}
          onGone={onGone}
        />
      )}
      {previewing && (
        <ContentPreviewDialog
          targetType={item.targetType}
          content={detail.current}
          imageUrl={detail.imageUrl}
          containerName={item.containerName}
          onClose={() => setPreviewing(false)}
        />
      )}
    </>
  );
}

function EntryRow({
  role,
  entry,
  onAction,
  onApply,
}: Readonly<{ role: ReviewRole; entry: ReportEntry; onAction: (pending: Pending) => void; onApply?: () => void }>) {
  const { t, i18n } = useTranslation("report");
  const navigate = useNavigate();
  const open = entry.status === "waiting_teacher" || entry.status === "waiting_admin";
  const reporter = entry.reporterId && entry.reporterName ? { id: entry.reporterId, name: entry.reporterName } : null;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-text-muted">{t("detail.reportedAt", { at: formatDateTime(entry.reportedAt, i18n.language) })}</span>
        {role === "admin" && reporter && (
          <span className="text-text">
            {t("detail.reporter", { name: reporter.name })}
            {entry.reporterStats && (
              <span className="ml-2 text-text-muted">
                ({t("detail.stats", { submitted: entry.reporterStats.submitted, rejected: entry.reporterStats.rejected })})
              </span>
            )}
          </span>
        )}
      </div>
      {entry.suggestedFix && (
        <p className="text-text">
          <span className="font-semibold">
            {entry.fixField
              ? t("detail.suggestedFixFor", { field: t(`fields.${entry.fixField}`) })
              : t("detail.suggestedFix")}
            :{" "}
          </span>
          {entry.suggestedFix}
        </p>
      )}
      {onApply && (
        <Button type="button" variant="secondary" size="sm" className="self-start" leftIcon={<Icon name="check" />} onClick={onApply}>
          {t("applyFix.open")}
        </Button>
      )}
      {entry.description && (
        <p className="text-text">
          <span className="font-semibold">{t("detail.description")}: </span>
          {entry.description}
        </p>
      )}
      {entry.handledAt && (
        <p className="text-text-muted">
          {t("detail.handled", {
            status: t(statusKey(role, entry.status)),
            by: entry.handledBy ?? t("detail.system"),
            at: formatDateTime(entry.handledAt, i18n.language),
          })}
          {entry.handlingNote && <span className="block">{t("detail.note", { note: entry.handlingNote })}</span>}
        </p>
      )}
      {role === "admin" && reporter && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={() =>
              navigate(`${reportListPath("admin")}?reporterId=${reporter.id}&reporterName=${encodeURIComponent(reporter.name)}`)
            }
          >
            {t("detail.filterReporter")}
          </Button>
          {open && (
            <Button type="button" variant="text" size="sm" onClick={() => onAction({ mode: "rejectAll", reporter })}>
              {t("detail.rejectAll")}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}
