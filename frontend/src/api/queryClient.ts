import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Mặc định ngắn vì nhiều dữ liệu kèm tiến độ theo user; dữ liệu tĩnh tự đặt dài hơn.
      staleTime: 30 * 1000,
      retry: false,
    },
  },
});
