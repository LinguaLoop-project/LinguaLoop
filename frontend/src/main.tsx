import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import "@/i18n";
import "@/hooks/useTheme"; // áp theme đã lưu ngay khi tải trang
import App from "@/App.tsx";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";

// Devtools chỉ nạp khi chạy dev: không nằm trong bundle production.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : null;

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {ReactQueryDevtools && (
      <Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} />
      </Suspense>
    )}
  </QueryClientProvider>,
);
