import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Icon from "./Icon";
import Mascot from "./Mascot";

export type ErrorKind = "server" | "network" | "notFound";

export interface ErrorStateProps {
  kind?: ErrorKind;
  /** Mã lỗi nhỏ để người dùng báo cáo (vd SRV-500). */
  code?: string;
  /** Chỉ truyền khi thử lại có ý nghĩa; lỗi 404 thì bỏ. */
  onRetry?: () => void;
  retrying?: boolean;
  /** Hành động phụ, vd nút "Về thư viện". */
  action?: ReactNode;
  className?: string;
}

/** `.err-state` của mockup: thẻ giữa trang có mascot 120, h2, mô tả, mã lỗi và nút (docs/ux/STATES.md §2). */
export default function ErrorState({ kind = "server", code, onRetry, retrying = false, action, className = "" }: ErrorStateProps) {
  const { t } = useTranslation("common");
  return (
    <div
      role="alert"
      className={`flex flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)] ${className}`}
    >
      <Mascot mood="encourage" size={120} alt="" />
      <h2 className="mt-2 font-display text-2xl font-bold">{t(`error.${kind}.title`)}</h2>
      <p className="mt-2 max-w-md text-text-muted">{t(`error.${kind}.desc`)}</p>
      {code && <p className="mt-2 text-[13px] text-text-subtle">{t("error.code", { code })}</p>}
      {(onRetry || action) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button onClick={onRetry} isLoading={retrying} leftIcon={<Icon name="rotate-cw" />}>
              {t("error.retry")}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
