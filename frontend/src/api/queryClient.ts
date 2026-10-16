import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Mặc định ngắn vì nhiều dữ liệu kèm tiến độ theo user; dữ liệu tĩnh tự đặt dài hơn.
      staleTime: 30 * 1000,
      // Thử lại một lần cho lỗi mạng/5xx thoáng qua; lỗi 4xx (404, 403…) có thử lại cũng vô ích. Chỉ áp cho truy vấn đọc, mutations không tự thử lại.
      retry: (failureCount, error) =>
        failureCount < 1 && !(isAxiosError(error) && error.response && error.response.status < 500),
    },
  },
});
