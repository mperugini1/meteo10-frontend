// Proteção de rotas (Next 16: "proxy" substitui o antigo "middleware").
// Sem sessão -> /login. Rotas /admin/* bloqueadas para o perfil viewer.

import { NextResponse, type NextRequest } from "next/server";

import { TOKEN_COOKIE, readTokenClaims } from "@/lib/session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const claims = readTokenClaims(request.cookies.get(TOKEN_COOKIE)?.value);

  if (pathname === "/login") {
    return claims ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (!claims) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && claims.role !== "admin") {
    const home = new URL("/", request.url);
    home.searchParams.set("aviso", "sem-permissao");
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  // Páginas apenas: a API própria (/api/*) faz sua checagem, e arquivos estáticos ficam livres.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|svg|ico|webmanifest)$).*)"],
};
