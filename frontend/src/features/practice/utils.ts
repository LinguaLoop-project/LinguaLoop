import { NETWORK_ERROR, toApiError } from "@/features/auth";

/** Lỗi do mất kết nối (không tới được máy chủ), để báo "mất mạng" thay vì lỗi chung. */
export const isNetworkError = (error: unknown): boolean => toApiError(error).code === NETWORK_ERROR;
