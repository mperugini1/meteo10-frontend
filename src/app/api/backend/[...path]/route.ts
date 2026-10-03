// Repasse autenticado: o navegador chama /api/backend/<rota> e o servidor do Next
// inclui o JWT do cookie httpOnly ao chamar o backend. O token nunca chega ao JavaScript do cliente.

import { NextResponse, type NextRequest } from "next/server";

import { apiBaseUrl } from "@/lib/auth";
import { TOKEN_COOKIE, USER_COOKIE } from "@/lib/session";

const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition"];

async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  // Somente segmentos simples (impede "..", barras codificadas e acesso à ingestão do gateway)
  if (path.some((segment) => !/^[\w.-]+$/.test(segment) || segment === ".." || segment === ".") || path[0] === "ingest") {
    return NextResponse.json({ error: { code: "not_found", message: "Recurso não encontrado." } }, { status: 404 });
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: { code: "not_authenticated", message: "Faça login para continuar." } }, { status: 401 });
  }

  const url = `${apiBaseUrl()}/${path.join("/")}${request.nextUrl.search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const hasBody = !["GET", "HEAD"].includes(request.method);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { code: "backend_unavailable", message: "Não foi possível conectar ao servidor. Tente novamente." } },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const response = new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
  if (upstream.status === 401) {
    // Sessão expirada no backend: limpa os cookies para o proxy mandar ao login
    response.cookies.delete(TOKEN_COOKIE);
    response.cookies.delete(USER_COOKIE);
  }
  return response;
}

export { forward as GET, forward as POST, forward as PATCH, forward as DELETE };
