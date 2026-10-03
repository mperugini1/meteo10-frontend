"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="text-ink-3">Tente novamente. Se o problema continuar, avise o administrador.</p>
      <button type="button" onClick={reset} className="inline-flex min-h-11 items-center rounded-xl bg-brand px-4 font-semibold text-brand-ink">
        Tentar novamente
      </button>
    </main>
  );
}
