"use client";

import { useState, type FormEvent } from "react";

import { PlusIcon } from "@/components/icons";
import { useSessionUser } from "@/components/SessionProvider";
import { Button, Card, ErrorState, LoadingCards, Modal, Notice, PageHeader, Switch, cx, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import type { Role, User } from "@/types/api";

const ROLE_LABEL: Record<Role, string> = { admin: "Administrador", viewer: "Usuário" };

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  is_active: boolean;
}

const EMPTY: FormState = { name: "", email: "", password: "", role: "viewer", is_active: true };

export function UsersAdmin() {
  const me = useSessionUser();
  const { data, error, loading, reload } = useApi(() => api.get<{ items: User[] }>("/users"), []);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, is_active: user.is_active });
    setFormError(null);
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setFormError("Informe nome e e-mail.");
    if ((!editing || form.password) && form.password.length < 8) return setFormError("A senha deve ter pelo menos 8 caracteres.");
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = { name: form.name.trim(), email: form.email.trim(), role: form.role, is_active: form.is_active };
      if (form.password) body.password = form.password;
      if (editing) await api.patch(`/users/${editing.id}`, body);
      else await api.post("/users", body);
      setOpen(false);
      setMessage(editing ? "Usuário atualizado." : "Usuário criado. Informe a senha a ele por um canal seguro.");
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const isSelf = editing?.id === me.id;

  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle="Quem pode acessar o Meteo10. Usuários não são excluídos, apenas desativados."
        actions={
          <Button onClick={openNew}>
            <PlusIcon size={18} /> Novo usuário
          </Button>
        }
      />
      {message && (
        <div className="mb-4">
          <Notice tone="success">{message}</Notice>
        </div>
      )}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data && <LoadingCards count={2} height="h-20" />}
      {data && (
        <ul className="flex flex-col gap-3">
          {data.items.map((u) => (
            <li key={u.id}>
              <Card className={cx("flex flex-col gap-3 sm:flex-row sm:items-center", !u.is_active && "opacity-70")}>
                <div className="flex-1">
                  <p className="font-semibold">
                    {u.name} {u.id === me.id && <span className="font-normal text-ink-3">(você)</span>}
                  </p>
                  <p className="text-sm text-ink-3">
                    {u.email} · {ROLE_LABEL[u.role]} · {u.is_active ? "Ativo" : "Desativado"}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => openEdit(u)}>
                  Editar
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} title={editing ? "Editar usuário" : "Novo usuário"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {formError && <Notice tone="error">{formError}</Notice>}
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            Nome
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            E-mail
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={190}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            {editing ? "Nova senha (deixe em branco para manter)" : "Senha inicial"}
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required={!editing}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            Perfil
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              disabled={isSelf}
            >
              <option value="viewer">Usuário (consulta e alarmes)</option>
              <option value="admin">Administrador (tudo)</option>
            </select>
          </label>
          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
            <span className="text-sm font-semibold text-ink-2">Acesso ativo</span>
            <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Acesso ativo" disabled={isSelf} />
          </div>
          {isSelf && <p className="text-xs text-ink-3">Você não pode alterar o próprio perfil nem desativar o próprio acesso.</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" busy={busy}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
