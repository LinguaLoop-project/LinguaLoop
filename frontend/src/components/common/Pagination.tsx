import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/common/Icon";

export interface PaginationProps {
  /** Trang hiện tại, đánh số từ 0 như PageResponse. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/** Từ số trang này trở lên mới hiện ô "Đến trang". */
const JUMP_MIN_PAGES = 8;

type PageItem = number | "gap-l" | "gap-r";

/** Dãy số trang có dấu "…": luôn hiện trang đầu, cuối và hai trang quanh trang hiện tại. */
function pageList(page: number, total: number): PageItem[] {
  const keep = new Set([0, total - 1, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  const out: PageItem[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push(i === 1 ? "gap-l" : "gap-r");
    out.push(n);
  });
  return out;
}

const BTN =
  "grid h-9 min-w-9 cursor-pointer place-items-center rounded-md border px-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";
const IDLE = "border-border-strong bg-surface text-text hover:border-primary hover:bg-primary-soft";
const CURRENT = "border-transparent bg-[var(--btn-primary)] text-white";

/** Phân trang dùng chung: trước/sau, dãy số trang và ô nhảy tới trang khi có nhiều trang. Ẩn khi chỉ có một trang. */
export default function Pagination({ page, totalPages, onChange, className = "" }: Readonly<PaginationProps>) {
  const { t } = useTranslation("common");
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t("pagination.label")} className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        className={`${BTN} ${IDLE}`}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        aria-label={t("pagination.prev")}
        title={t("pagination.prev")}
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
            aria-label={t("pagination.page", { page: p + 1 })}
            onClick={() => onChange(p)}
            className={`${BTN} ${p === page ? CURRENT : IDLE}`}
          >
            {p + 1}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${BTN} ${IDLE}`}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label={t("pagination.next")}
        title={t("pagination.next")}
      >
        <Icon name="chevron-right" />
      </button>
      {totalPages >= JUMP_MIN_PAGES && <JumpToPage key={page} totalPages={totalPages} onChange={onChange} />}
    </nav>
  );
}

/** Ô nhập số trang (đánh số từ 1), Enter để đi; số ngoài khoảng được kéo về trang đầu hoặc cuối. */
function JumpToPage({ totalPages, onChange }: Readonly<{ totalPages: number; onChange: (page: number) => void }>) {
  const { t } = useTranslation("common");
  const [value, setValue] = useState("");
  const inputId = useId();

  const go = () => {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return;
    onChange(Math.min(Math.max(n, 1), totalPages) - 1);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="ml-1 flex items-center gap-2 text-sm text-text-muted">
      <label htmlFor={inputId}>{t("pagination.goTo")}</label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`1–${totalPages}`}
        className="h-9 w-20 rounded-md border border-border-strong bg-surface px-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none"
      />
    </form>
  );
}
