import type { ReactNode } from "react";
import ErrorState, { type ErrorKind } from "@/components/common/ErrorState";
import { NETWORK_ERROR, toApiError } from "@/features/auth";

export interface QueryErrorProps {
  error: unknown;
  /** Truyền để hiện nút Thử lại; lỗi 404 luôn bỏ nút vì thử lại vô ích. */
  onRetry?: () => void;
  retrying?: boolean;
  /** Hành động phụ, vd nút "Về thư viện". */
  action?: ReactNode;
  /** Ép loại lỗi khi không có đối tượng lỗi (vd dữ liệu rỗng nghĩa là không tìm thấy). */
  kind?: ErrorKind;
  className?: string;
}

/** Thẻ lỗi cho truy vấn: phân biệt mất mạng, không tìm thấy (404) và lỗi máy chủ (STATES.md §2). */
export default function QueryError({ error, onRetry, retrying, action, className, kind: forced }: QueryErrorProps) {
  const apiError = toApiError(error);
  const kind: ErrorKind =
    forced ?? (apiError.code === NETWORK_ERROR ? "network" : apiError.status === 404 ? "notFound" : "server");
  return (
    <ErrorState
      kind={kind}
      code={kind === "server" ? apiError.code : undefined}
      onRetry={kind === "notFound" ? undefined : onRetry}
      retrying={retrying}
      action={action}
      className={className}
    />
  );
}
