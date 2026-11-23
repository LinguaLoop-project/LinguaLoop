import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminPlanService, type ProPlanInput } from "../services/adminPlanService";

export const ADMIN_PLANS_KEY = ["admin", "pro-plans"] as const;

/** Danh sách gói Pro (UC-GA-03); lỗi thì không thử lại ngầm để hiện "Không tải được danh sách". */
export function useAdminPlans() {
  return useQuery({ queryKey: ADMIN_PLANS_KEY, queryFn: adminPlanService.list, retry: false });
}

function useInvalidatePlans() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
}

export function useCreatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({ mutationFn: (input: ProPlanInput) => adminPlanService.create(input), onSuccess: invalidate });
}

export function useUpdatePlan() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: ({ id, version, input }: { id: string; version: string; input: ProPlanInput }) =>
      adminPlanService.update(id, version, input),
    onSuccess: invalidate,
  });
}

export function useSetPlanOnSale() {
  const invalidate = useInvalidatePlans();
  return useMutation({
    mutationFn: ({ id, onSale }: { id: string; onSale: boolean }) => adminPlanService.setOnSale(id, onSale),
    // Lỗi "đã ở trạng thái này" cũng cần đọc lại danh sách (UC-GA-06 4a)
    onSettled: invalidate,
  });
}
