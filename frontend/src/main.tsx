import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import "@/i18n";
import App from "@/App.tsx";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleAuthProvider } from "@/features/auth";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <GoogleAuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleAuthProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
