import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";

export interface PaginationProps {
  /** Trang hiện tại, đánh số từ 0 như PageResponse. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Dãy số trang có dấu "…": luôn hiện trang đầu, cuối và hai trang quanh trang hiện tại. */
function pageList(page: number, total: number): (number | "gap-l" | "gap-r")[] {
  const keep = new Set([0, total - 1, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  const out: (number | "gap-l" | "gap-r")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push(i === 1 ? "gap-l" : "gap-r");
    out.push(n);
  });
  return out;
}

const BTN =
  "grid h-10 min-w-10 cursor-pointer place-items-center rounded-md border px-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

/** Phân trang (số trang + trước/sau), thay cho "Xem thêm". */
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { t } = useTranslation("pages");
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t("student.topicDetail.pagination.label", "Phân trang")} className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className={`${BTN} border-border-strong bg-surface text-text hover:border-primary hover:bg-primary-soft`}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        aria-label={t("student.topicDetail.pagination.prev", "Trang trước")}
      >
        <Icon name="chevron-left" />
      </button>
      {pageList(page, totalPages).map((p) =>
        typeof p === "string" ? (
          <span key={p} className="px-1 text-text-subtle" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            aria-label={t("student.topicDetail.pagination.page", {
              page: p + 1,
              defaultValue: `Trang ${p + 1}`,
            })}
            onClick={() => onChange(p)}
            className={`${BTN} ${p === page ? "border-transparent bg-[var(--btn-primary)] text-white" : "border-border-strong bg-surface text-text hover:border-primary hover:bg-primary-soft"}`}
          >
            {p + 1}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${BTN} border-border-strong bg-surface text-text hover:border-primary hover:bg-primary-soft`}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label={t("student.topicDetail.pagination.next", "Trang sau")}
      >
        <Icon name="chevron-right" />
      </button>
    </nav>
  );
}
