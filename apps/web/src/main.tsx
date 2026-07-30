import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";
import { Toaster } from "sonner";
import { router } from "./routes/router";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        richColors
        closeButton
        position="top-right"
        duration={4500}
        toastOptions={{ className: "studio-toast" }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
