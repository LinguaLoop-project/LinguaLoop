import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Icon from "@/components/common/Icon";
import type { AdminApiError } from "@/features/user";

/** Thành phần dùng chung giữa ba màn thống kê của giáo viên (UC-TN-01 đến 03). */

/**
 * "Quay lại" về nơi giáo viên đã mở màn thống kê (UC-TN-02 Bước 5, UC-TN-03 Bước 6); mở thẳng bằng đường dẫn thì về
 * `fallback`.
 */
export function BackButton({ fallback }: Readonly<{ fallback: string }>) {
  const { t } = useTranslation("statsTeacher");
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<Icon name="arrow-left" />}
      onClick={() => (location.key === "default" ? navigate(fallback) : navigate(-1))}
      className="self-start"
    >
      {t("back")}
    </Button>
  );
}

/** Lỗi tải số liệu: mất kết nối hoặc lỗi máy chủ, kèm nút Tải lại (AC-TN-08, 15, 23). */
export function StatsLoadError({ error, onRetry, retrying }: Readonly<{ error: unknown; onRetry: () => void; retrying: boolean }>) {
  const { t } = useTranslation("statsTeacher");
  return (
    <ErrorState
      title={t("loadError")}
      kind={(error as AdminApiError | null)?.kind === "network" ? "network" : "server"}
      onRetry={onRetry}
      retrying={retrying}
    />
  );
}

export function ForbiddenState({ title, fallback }: Readonly<{ title: string; fallback: string }>) {
  const { t } = useTranslation("statsTeacher");
  const navigate = useNavigate();
  return <EmptyState icon="lock" mascotSrc="" title={title} actionText={t("back")} onAction={() => navigate(fallback)} />;
}

export interface RankItem {
  id: string;
  name: string;
  meta: string;
  value: string;
  /** Có thì tên mục là liên kết mở thống kê chi tiết. */
  to?: string;
}

/** Danh sách xếp hạng đánh số, tối đa 5 mục (BR-TN-04); rỗng thì hiện {@code emptyText}. */
export function RankList({ items, emptyText }: Readonly<{ items: readonly RankItem[]; emptyText: string }>) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-text-muted">{emptyText}</p>;
  return (
    <ol className="flex flex-col divide-y divide-border">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-text">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {item.to ? (
              <Link to={item.to} className="truncate font-medium text-text hover:underline">
                {item.name}
              </Link>
            ) : (
              <span className="truncate font-medium text-text" title={item.name}>
                {item.name}
              </span>
            )}
            <span className="truncate text-xs text-text-muted">{item.meta}</span>
          </div>
          <span className="shrink-0 font-semibold text-text tabular-nums">{item.value}</span>
        </li>
      ))}
    </ol>
  );
}
