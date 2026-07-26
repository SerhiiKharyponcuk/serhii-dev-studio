import axios from "axios";

const configuredApiUrl: string | undefined = import.meta.env.VITE_API_URL;
export const api = axios.create({
  baseURL: configuredApiUrl ?? "http://localhost:4000/api",
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" }
});

let refreshPromise: Promise<void> | null = null;
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      !error.config ||
      error.config.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error instanceof Error ? error : new Error("Request failed"));
    }
    const config = error.config as typeof error.config & { _retried?: boolean };
    if (config._retried)
      return Promise.reject(error instanceof Error ? error : new Error("Request failed"));
    config._retried = true;
    refreshPromise ??= api
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
    await refreshPromise;
    return api.request(config);
  }
);
