import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import "@/i18n";
import "@/hooks/useTheme"; // áp theme đã lưu ngay khi tải trang
import App from "@/App.tsx";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
