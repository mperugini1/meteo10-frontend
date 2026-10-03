import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-ink-3">O endereço pode estar errado ou a página foi removida.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-brand-ink">
        Voltar ao painel
      </Link>
    </main>
  );
}
