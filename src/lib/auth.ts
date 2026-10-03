import "server-only";

import { cookies } from "next/headers";

import { TOKEN_COOKIE, USER_COOKIE, decodeUserCookie, readTokenClaims, type SessionUser } from "@/lib/session";

export function apiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
}

/** Usuário da sessão atual (server components). Null se não houver sessão válida. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const claims = readTokenClaims(store.get(TOKEN_COOKIE)?.value);
  if (!claims) return null;
  const user = decodeUserCookie(store.get(USER_COOKIE)?.value);
  if (!user || String(user.id) !== claims.sub) return null;
  // O papel vem do token (fonte de verdade enviada ao backend)
  return { ...user, role: claims.role };
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
