import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { UseQueryResult } from "@tanstack/react-query";
import Button from "@/components/common/Button";
import Icon from "@/components/common/Icon";
import Skeleton from "@/components/common/Skeleton";
import { isNetworkError } from "../utils";

export interface ListStateProps {
  query: UseQueryResult<unknown>;
  skeletonRows?: number;
  children: ReactNode;
}

/** Khung chung của các danh sách: đang tải, lỗi kèm nút Thử lại, hoặc nội dung. */
export default function ListState({ query, skeletonRows = 3, children }: ListStateProps) {
  const { t } = useTranslation("mywords");
  if (query.isLoading) {
    return (
      <div role="status" aria-label={t("loading")} className="flex flex-col gap-3">
        {Array.from({ length: skeletonRows }, (_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-warning px-3.5 py-3 text-sm">
        <Icon name="circle-alert" className="h-5 w-5 flex-none text-warning" />
        <span>{isNetworkError(query.error) ? t("offline") : t("loadFailed")}</span>
        <Button variant="text" size="sm" onClick={() => void query.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
