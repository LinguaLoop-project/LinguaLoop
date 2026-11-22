import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CREDIT_PRICES_QUERY_KEY } from "@/features/subscription/hooks/useCredit";
import { creditAdminApi } from "./api";
import type { UpdateCreditConfigInput } from "./types";

export const CREDIT_CONFIG_KEY = ["admin", "credit-config"] as const;

/** Cấu hình credit hiện hành (UC-GA-01); lỗi thì không thử lại ngầm để hiện "Không tải được cấu hình". */
export function useCreditConfig() {
  return useQuery({ queryKey: CREDIT_CONFIG_KEY, queryFn: creditAdminApi.get, retry: false });
}

/** Lưu cấu hình (UC-GA-02); xong thì đọc lại cấu hình và bảng giá trên các nút AI. */
export function useUpdateCreditConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCreditConfigInput) => creditAdminApi.update(input),
    onSuccess: (config) => {
      queryClient.setQueryData(CREDIT_CONFIG_KEY, config);
      void queryClient.invalidateQueries({ queryKey: CREDIT_PRICES_QUERY_KEY });
    },
  });
}
