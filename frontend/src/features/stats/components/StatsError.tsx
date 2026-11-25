import ErrorState from "@/components/common/ErrorState";
import { NETWORK_ERROR, toApiError } from "@/features/auth";

/** Thẻ lỗi của một truy vấn thống kê: mất mạng hoặc lỗi máy chủ, luôn kèm nút Thử lại (AC-TH-07, AC-TH-13, AC-TH-20). */
export default function StatsError({
  error,
  onRetry,
  retrying,
  className,
}: {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
  className?: string;
}) {
  const apiError = toApiError(error);
  const network = apiError.code === NETWORK_ERROR;
  return (
    <ErrorState
      kind={network ? "network" : "server"}
      code={network ? undefined : apiError.code}
      onRetry={onRetry}
      retrying={retrying}
      className={className}
    />
  );
}
