"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button, Card, Field, Notice, inputClass } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(
          response.status === 422
            ? "Informe um e-mail válido e a senha."
            : (body?.error?.message ?? "Não foi possível entrar. Tente novamente."),
        );
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Sem conexão. Verifique a internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="E-mail">
          {(id) => (
            <input
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Senha">
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Button type="submit" busy={busy} className="mt-1 w-full">
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
