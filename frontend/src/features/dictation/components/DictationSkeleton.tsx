import { useTranslation } from "react-i18next";
import Skeleton from "@/components/common/Skeleton";

/** Khối chờ tải cùng bố cục với trang thật: đầu trang, video + khung làm bài, danh sách câu. */
export default function DictationSkeleton() {
  const { t } = useTranslation("dictation");
  return (
    <section className="w-full" aria-busy="true" aria-label={t("state.loading")}>
      <div className="mb-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="mx-auto aspect-video w-[min(100%,560px)] rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-[18px]">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[88px] w-full rounded-lg" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <Skeleton className="h-5 w-32" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
