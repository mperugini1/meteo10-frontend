"use client";

import { useState, type FormEvent } from "react";

import { useSessionUser } from "@/components/SessionProvider";
import { Button, Card, Field, Notice, PageHeader, inputClass } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

export function AccountForm() {
  const user = useSessionUser();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (next.length < 8) return setMessage({ tone: "error", text: "A nova senha deve ter pelo menos 8 caracteres." });
    if (next !== confirm) return setMessage({ tone: "error", text: "A confirmação não é igual à nova senha." });
    setBusy(true);
    setMessage(null);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage({ tone: "success", text: "Senha alterada com sucesso." });
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Minha conta" subtitle={`${user.name} · ${user.email}`} />
      <Card className="max-w-md">
        <h2 className="mb-4 font-bold">Trocar senha</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
          <Field label="Senha atual">
            {(id) => <input id={id} type="password" autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} required />}
          </Field>
          <Field label="Nova senha" hint="Pelo menos 8 caracteres.">
            {(id, describedBy) => (
              <input id={id} aria-describedby={describedBy} type="password" autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
            )}
          </Field>
          <Field label="Confirme a nova senha">
            {(id) => <input id={id} type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}
          </Field>
          <Button type="submit" busy={busy}>
            Salvar nova senha
          </Button>
        </form>
      </Card>
    </>
  );
}
