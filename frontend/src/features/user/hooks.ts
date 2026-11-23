import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUserApi } from "./api";
import type { ChangeableRole, TransferFilter, UserListFilter } from "./types";

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (filter: UserListFilter, page: number) => [...adminUserKeys.all, "list", filter, page] as const,
  detail: (userId: string) => [...adminUserKeys.all, "detail", userId] as const,
  summary: (teacherId: string) => [...adminUserKeys.all, "summary", teacherId] as const,
  transfers: ["admin", "transfers"] as const,
  items: (filter: TransferFilter, page: number) => [...adminUserKeys.transfers, "items", filter, page] as const,
  owners: () => [...adminUserKeys.transfers, "owners"] as const,
  recipients: (q: string, exclude: string[]) => [...adminUserKeys.transfers, "recipients", q, exclude] as const,
};

/** Danh sách tài khoản (UC-QT-01); lỗi hiện ngay kèm "Thử lại", không tự thử lại. */
export function useAdminUsers(filter: UserListFilter, page: number) {
  return useQuery({
    queryKey: adminUserKeys.list(filter, page),
    queryFn: () => adminUserApi.list(filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useAdminUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: adminUserKeys.detail(userId ?? ""),
    queryFn: () => adminUserApi.detail(userId ?? ""),
    enabled: Boolean(userId),
    retry: false,
  });
}

/** Tóm tắt nội dung thư viện của giáo viên trước khi giao toàn bộ (UC-QT-07 Bước 2); luôn tải mới. */
export function useTeacherSummary(teacherId: string | undefined) {
  return useQuery({
    queryKey: adminUserKeys.summary(teacherId ?? ""),
    queryFn: () => adminUserApi.summary(teacherId ?? ""),
    enabled: Boolean(teacherId),
    staleTime: 0,
    retry: false,
  });
}

export function useTransferItems(filter: TransferFilter, page: number) {
  return useQuery({
    queryKey: adminUserKeys.items(filter, page),
    queryFn: () => adminUserApi.transferItems(filter, page),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useTransferOwners() {
  return useQuery({ queryKey: adminUserKeys.owners(), queryFn: adminUserApi.transferOwners, retry: false });
}

/** Giáo viên có thể nhận (BR-QT-06), trừ các giáo viên đang giữ nội dung. */
export function useRecipients(q: string, exclude: string[], enabled = true) {
  return useQuery({
    queryKey: adminUserKeys.recipients(q, exclude),
    queryFn: () => adminUserApi.recipients(q, exclude),
    placeholderData: keepPreviousData,
    enabled,
    retry: false,
  });
}

/** Sau mỗi thao tác ghi: làm mới danh sách tài khoản, chi tiết và danh sách nội dung cần giao. */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    void queryClient.invalidateQueries({ queryKey: adminUserKeys.transfers });
  };
}

export function useLockUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => adminUserApi.lock(userId, reason),
    onSettled: invalidate,
  });
}

export function useUnlockUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: (userId: string) => adminUserApi.unlock(userId), onSettled: invalidate });
}

export function useGrantCredit() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ userId, credits, note }: { userId: string; credits: number; note: string }) =>
      adminUserApi.grantCredit(userId, credits, note),
    onSettled: invalidate,
  });
}

export function useChangeRole() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ChangeableRole }) => adminUserApi.changeRole(userId, role),
    onSettled: invalidate,
  });
}

export function useTransferAll() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: { teacherId: string; recipientId: string; lessons: number; decks: number }) =>
      adminUserApi.transferAll(input.teacherId, input.recipientId, input.lessons, input.decks),
    onSettled: invalidate,
  });
}

export function useTransferSelected() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: { recipientId: string; items: { type: string; id: string; ownerId: string | null }[] }) =>
      adminUserApi.transferSelected(input.recipientId, input.items),
    onSettled: invalidate,
  });
}
