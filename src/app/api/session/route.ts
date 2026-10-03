// Login/logout: repassa as credenciais ao backend e guarda o JWT em cookie httpOnly.

import { NextResponse, type NextRequest } from "next/server";

import { apiBaseUrl, cookieOptions, getSessionUser } from "@/lib/auth";
import { TOKEN_COOKIE, USER_COOKIE, encodeUserCookie } from "@/lib/session";
import type { User } from "@/types/api";

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  let credentials: unknown;
  try {
    credentials = await request.json();
  } catch {
    return errorResponse(400, "bad_request", "Requisição inválida.");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl()}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
  } catch {
    return errorResponse(502, "backend_unavailable", "Não foi possível conectar ao servidor. Tente novamente.");
  }

  const body = await upstream.json().catch(() => null);
  if (!upstream.ok || !body) {
    return NextResponse.json(body ?? { error: { code: "login_failed", message: "Não foi possível entrar." } }, {
      status: upstream.status,
    });
  }

  const login = body as LoginResponse;
  const response = NextResponse.json({ user: login.user });
  response.cookies.set(TOKEN_COOKIE, login.access_token, cookieOptions(login.expires_in));
  response.cookies.set(USER_COOKIE, encodeUserCookie(login.user), cookieOptions(login.expires_in));
  return response;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return errorResponse(401, "not_authenticated", "Faça login para continuar.");
  return NextResponse.json({ user });
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.delete(TOKEN_COOKIE);
  response.cookies.delete(USER_COOKIE);
  return response;
}
