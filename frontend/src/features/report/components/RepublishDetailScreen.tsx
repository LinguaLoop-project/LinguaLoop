import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import Dialog from "@/components/common/Dialog";
import ErrorState from "@/components/common/ErrorState";
import { FormAlert } from "@/components/common/FormAlert";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { toast } from "@/stores/toastStore";
import { useApproveRepublish, useRejectRepublish, useRepublishDetail } from "../hooks";
import { adminContentPath, REPUBLISH_PATH } from "../paths";
import { REPORT_TEXT_MAX, validateNote } from "../reportForm";
import { cellText, compareRows } from "../reportFormat";
import type { RepublishChange, RepublishDetail, ReportApiError } from "../types";

const REJECT_TITLE = "republish-reject-title";

/**
 * Chi tiết yêu cầu xuất bản lại (UC-XL-05 Bước 3 đến 6): lý do gỡ, từng câu hoặc thẻ bị báo với nội dung lúc gỡ cạnh
 * nội dung hiện tại hoặc nhãn "Đã xóa", nút xem toàn bộ nội dung, Duyệt hoặc Từ chối kèm lý do. Yêu cầu không còn hiệu
 * lực (3a) thì quay về danh sách; chưa đủ điều kiện xuất bản (6a) thì báo và gợi ý từ chối.
 */
export default function RepublishDetailScreen() {
  const { t } = useTranslation("report");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useRepublishDetail(id);
  const approve = useApproveRepublish();
  const [rejecting, setRejecting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const back = () => navigate(REPUBLISH_PATH);
  const onError = (error: unknown) => {
    const e = error as ReportApiError;
    if (e.kind === "notFound" || e.kind === "conflict") {
      toast(t("republish.gone"), { icon: "circle-alert" });
      back();
    } else if (e.status === 422) {
      setFailure(t("republish.notPublishable"));
    } else {
      setFailure(e.kind === "network" ? t("dialog.network") : t("dialog.failed"));
    }
  };

  const doApprove = () => {
    if (!id) return;
    setFailure(null);
    approve.mutate(id, {
      onSuccess: () => {
        toast(t("republish.approved"), { icon: "circle-check" });
        back();
      },
      onError,
    });
  };

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-64 w-full" />;
  } else if (query.isError || !query.data) {
    const error = query.error as unknown as ReportApiError | null;
    body = (
      <ErrorState
        kind={error?.kind === "network" ? "network" : error?.kind === "notFound" ? "notFound" : "server"}
        onRetry={() => void query.refetch()}
      />
    );
  } else {
    body = (
      <DetailBody
        detail={query.data}
        failure={failure}
        approving={approve.isPending}
        onApprove={doApprove}
        onReject={() => setRejecting(true)}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6">
      <Link to={REPUBLISH_PATH} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
        <Icon name="arrow-left" className="size-4" />
        {t("republish.back")}
      </Link>
      {body}
      {rejecting && id && <RejectDialog requestId={id} onClose={() => setRejecting(false)} onDone={back} onError={onError} />}
    </main>
  );
}

function DetailBody({
  detail,
  failure,
  approving,
  onApprove,
  onReject,
}: Readonly<{
  detail: RepublishDetail;
  failure: string | null;
  approving: boolean;
  onApprove: () => void;
  onReject: () => void;
}>) {
  const { t } = useTranslation("report");
  const { item } = detail;
  const pending = detail.status === "pending";
  const contentPath = adminContentPath(item.targetType, item.targetId);
  const location = useLocation();
  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{t(`republish.type.${item.targetType}`)}</Badge>
          <Badge tone="info">{t(`republish.source.${item.source}`)}</Badge>
          {!pending && <Badge tone="info">{t(`republish.status.${detail.status}`)}</Badge>}
        </div>
        <h1 className="text-xl font-bold text-text">{item.targetName}</h1>
        <p className="text-sm text-text-muted">
          {item.ownerName ? t("list.owner", { name: item.ownerName }) : t("list.noOwner")}
        </p>
        <p className="text-sm text-text">{t("republish.takedownReason", { reason: item.takedownReason })}</p>
        {item.note && <p className="text-sm text-text">{t("republish.note", { note: item.note })}</p>}
        {contentPath && (
          <Link
            to={contentPath}
            state={{ backTo: location.pathname, backLabel: t("republish.backToRequest") }}
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline"
          >
            <Icon name="eye" className="size-4" />
            {t(`republish.viewAll.${item.targetType}`)}
          </Link>
        )}
      </header>

      {failure && <FormAlert variant="danger">{failure}</FormAlert>}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-text">{t("republish.changes", { count: detail.changes.length })}</h2>
        {detail.changes.map((change) => (
          <ChangeCard key={change.id} change={change} />
        ))}
      </section>

      {pending && (
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="danger" onClick={onReject} disabled={approving}>
            {t("republish.reject")}
          </Button>
          <Button type="button" leftIcon={<Icon name="circle-check" />} onClick={onApprove} isLoading={approving} disabled={approving}>
            {t("republish.approve")}
          </Button>
        </div>
      )}
    </>
  );
}

function ChangeCard({ change }: Readonly<{ change: RepublishChange }>) {
  const { t } = useTranslation("report");
  const rows = compareRows(change.snapshot, change.deleted ? {} : change.current);
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      {change.deleted && (
        <p className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-sm font-semibold text-danger">
          <Icon name="trash-2" className="size-4" />
          {t("republish.deleted")}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-elevated text-text-muted">
          <tr>
            <th className="px-4 py-2" scope="col">
              <span className="sr-only">{t("list.type")}</span>
            </th>
            <th className="px-4 py-2 font-semibold" scope="col">
              {t("republish.atTakedown")}
            </th>
            {!change.deleted && (
              <th className="px-4 py-2 font-semibold" scope="col">
                {t("detail.current")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field} className="border-t border-border align-top">
              <th scope="row" className="whitespace-nowrap px-4 py-2 font-medium text-text-muted">
                {t(`fields.${row.field}`)}
              </th>
              <td className="px-4 py-2 text-text">{cellText(row.field, row.before, t)}</td>
              {!change.deleted && (
                <td className="px-4 py-2 text-text">
                  {cellText(row.field, row.after, t)}
                  {row.changed && (
                    <Badge tone="success" className="ml-2">
                      {t("detail.changed")}
                    </Badge>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RejectDialog({
  requestId,
  onClose,
  onDone,
  onError,
}: Readonly<{ requestId: string; onClose: () => void; onDone: () => void; onError: (error: unknown) => void }>) {
  const { t } = useTranslation("report");
  const reject = useRejectRepublish();
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState<"NotBlank" | "Size" | null>(null);

  const confirm = () => {
    const error = validateNote(note);
    setFieldError(error);
    if (error) return;
    reject.mutate(
      { requestId, note: note.trim() },
      {
        onSuccess: () => {
          toast(t("republish.rejected"), { icon: "circle-check" });
          onDone();
        },
        onError: (e) => {
          onClose();
          onError(e);
        },
      },
    );
  };

  return (
    <Dialog open onClose={onClose} labelledBy={REJECT_TITLE}>
      <div className="flex flex-col gap-4">
        <h2 id={REJECT_TITLE} className="text-lg font-bold text-text">
          {t("republish.rejectTitle")}
        </h2>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-text">
          <span>
            {t("dialog.reason")}
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          </span>
          <textarea
            className={`min-h-24 rounded-md border bg-surface px-3.5 py-3 text-[15px] font-normal text-text outline-none focus:shadow-[0_0_0_3px_var(--primary-soft)] ${
              fieldError ? "border-danger" : "border-border-strong focus:border-primary"
            }`}
            value={note}
            maxLength={REPORT_TEXT_MAX + 100}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={fieldError !== null}
          />
          {fieldError && (
            <span className="font-normal text-danger">
              {fieldError === "Size" ? t("dialog.tooLong") : t("dialog.reasonRequired")}
            </span>
          )}
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={reject.isPending}>
            {t("dialog.cancel")}
          </Button>
          <Button type="button" variant="danger" onClick={confirm} isLoading={reject.isPending} disabled={reject.isPending}>
            {t("dialog.confirmReject")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
