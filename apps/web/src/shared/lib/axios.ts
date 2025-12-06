import axios from "axios";

export const apiClient = axios.create({
  baseURL:
    typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message || error.message || "Произошла ошибка";

      // Обработка ошибки авторизации (401)
      if (status === 401 && typeof window !== "undefined") {
        // Сохраняем текущий URL для возврата после входа
        const currentPath = window.location.pathname;
        const isPublicRoute =
          ["/login", "/register", "/"].includes(currentPath) ||
          currentPath.startsWith("/invite/");

        // Перенаправляем на страницу входа только если не находимся на публичной странице
        if (!isPublicRoute) {
          const callbackUrl = encodeURIComponent(
            currentPath + window.location.search
          );
          window.location.href = `/login?callbackUrl=${callbackUrl}`;
        }
      }

      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);
