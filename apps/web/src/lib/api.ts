import type { ApiError, ApiResponse } from "@ratama/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, error: ApiError["error"]) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init?.headers
    },
    ...init
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const error = payload.success
      ? { code: "HTTP_ERROR", message: "Request failed." }
      : payload.error;
    throw new ApiRequestError(response.status, error);
  }

  return payload.data;
}
