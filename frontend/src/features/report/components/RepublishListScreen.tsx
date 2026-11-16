import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Badge from "@/components/common/Badge";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Skeleton from "@/components/common/Skeleton";
import { useRepublishList } from "../hooks";
import { REPUBLISH_PATH } from "../paths";
import { formatDateTime } from "../reportFormat";
import type { ReportApiError } from "../types";

/** Danh sách yêu cầu xuất bản lại đang chờ duyệt, cũ nhất trước, 10 dòng mỗi trang (UC-XL-05 Bước 1, 2, nhánh 2a). */
export default function RepublishListScreen() {
  const { t, i18n } = useTranslation("report");
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const query = useRepublishList(page);
  const items = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 0;

  let body;
  if (query.isLoading) {
    body = <Skeleton className="h-48 w-full" />;
  } else if (query.isError) {
    const error = query.error as unknown as ReportApiError;
    body = <ErrorState kind={error.kind === "network" ? "network" : "server"} onRetry={() => void query.refetch()} />;
  } else if (items.length === 0) {
    body = <EmptyState title={t("republish.empty")} />;
  } else {
    body = (
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => navigate(`${REPUBLISH_PATH}/${item.id}`)}
              className="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{t(`republish.type.${item.targetType}`)}</Badge>
                <span className="font-semibold text-text">{item.targetName}</span>
              </div>
              <p className="line-clamp-2 text-sm text-text">{t("republish.takedownReason", { reason: item.takedownReason })}</p>
              <div className="flex flex-wrap gap-x-4 text-xs text-text-muted">
                <span>{item.ownerName ? t("list.owner", { name: item.ownerName }) : t("list.noOwner")}</span>
                <span>{t("republish.requestedAt", { at: formatDateTime(item.requestedAt, i18n.language) })}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <h1 className="text-2xl font-bold text-text">{t("republish.title")}</h1>
      {body}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm text-text-muted">
          <Button type="button" variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            {t("list.prev")}
          </Button>
          <span>{t("list.pageOf", { page: page + 1, total: totalPages })}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t("list.next")}
          </Button>
        </nav>
      )}
    </main>
  );
}
