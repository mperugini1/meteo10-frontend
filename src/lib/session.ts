// Utilidades de sessão compartilhadas entre proxy.ts, route handlers e server components.
// Sem dependências de servidor para poder rodar no proxy.

import type { Role, User } from "@/types/api";

export const TOKEN_COOKIE = "meteo10_token";
export const USER_COOKIE = "meteo10_user";

export interface TokenClaims {
  sub: string;
  role: Role;
  exp: number;
  iat: number;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return atob(base64);
}

/**
 * Lê as claims do JWT sem verificar a assinatura. Serve apenas para decisões de navegação
 * (redirecionar, esconder menus): toda autorização real é feita pelo backend.
 */
export function readTokenClaims(token: string | undefined | null): TokenClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(parts[1])) as TokenClaims;
    if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) return null;
    if (claims.role !== "admin" && claims.role !== "viewer") return null;
    return claims;
  } catch {
    return null;
  }
}

export function encodeUserCookie(user: User): string {
  return encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }));
}

export type SessionUser = Pick<User, "id" | "name" | "email" | "role">;

export function decodeUserCookie(value: string | undefined): SessionUser | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as SessionUser;
  } catch {
    return null;
  }
}
