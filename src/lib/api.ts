// Cliente HTTP tipado usado pelos componentes do navegador.
// Todas as chamadas passam por /api/backend (que injeta o JWT do cookie httpOnly).

import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody["error"]["details"];

  constructor(status: number, code: string, message: string, details?: ApiErrorBody["error"]["details"]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const GENERIC_MESSAGES: Record<number, string> = {
  401: "Sua sessão expirou. Faça login novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Não encontrado.",
  500: "Erro no servidor. Tente novamente em instantes.",
  502: "Não foi possível conectar ao servidor. Tente novamente.",
  503: "Serviço indisponível no momento. Tente novamente.",
};

type Query = Record<string, string | number | boolean | null | undefined>;

export function backendUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `/api/backend${path}${qs ? `?${qs}` : ""}`;
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  // Recarga completa de propósito: descarta o estado do cliente da sessão expirada
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${next}`);
}

async function request<T>(method: string, path: string, options: { query?: Query; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(backendUrl(path, options.query), {
      method,
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network_error", "Sem conexão. Verifique a internet e tente novamente.");
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    if (response.status === 401) redirectToLogin();
    throw new ApiError(
      response.status,
      err?.code ?? "http_error",
      err?.message ?? GENERIC_MESSAGES[response.status] ?? "Algo deu errado. Tente novamente.",
      err?.details,
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body: body ?? {} }),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, { body }),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Algo deu errado. Tente novamente.";
}
