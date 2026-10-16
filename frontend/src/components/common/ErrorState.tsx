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

/** Thẻ lỗi thay vùng dữ liệu, giữ nguyên khung trang (docs/ux/STATES.md §2). */
export default function ErrorState({ kind = "server", code, onRetry, retrying = false, action, className = "" }: ErrorStateProps) {
  const { t } = useTranslation("common");
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center sm:p-12 ${className}`}
    >
      <Mascot mood="encourage" size={96} alt="" />
      <h3 className="text-lg font-semibold text-text">{t(`error.${kind}.title`)}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-text-muted">{t(`error.${kind}.desc`)}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} isLoading={retrying} leftIcon={<Icon name="refresh-cw" />}>
            {t("error.retry")}
          </Button>
        )}
        {action}
      </div>
      {code && <span className="text-xs text-text-subtle">{t("error.code", { code })}</span>}
    </div>
  );
}
