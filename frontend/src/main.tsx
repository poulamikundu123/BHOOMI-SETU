import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: "12px", fontSize: "13px", fontFamily: "Inter, sans-serif" },
            success: { style: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" } },
            error: { style: { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);