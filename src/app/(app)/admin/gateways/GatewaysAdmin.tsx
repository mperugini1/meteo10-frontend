"use client";

import { useState, type FormEvent } from "react";

import { AlertIcon, CopyIcon, PlusIcon } from "@/components/icons";
import { Button, Card, EmptyState, ErrorState, LoadingCards, Modal, Notice, PageHeader, Switch, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Gateway, GatewayWithSecret } from "@/types/api";

/** Exibe o segredo uma única vez, com botão copiar e aviso. */
function SecretModal({ gateway, onClose }: { gateway: GatewayWithSecret | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function copy() {
    if (!gateway) return;
    try {
      await navigator.clipboard.writeText(gateway.secret_hex);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function close() {
    setCopied(false);
    setConfirmed(false);
    onClose();
  }

  return (
    <Modal open={gateway !== null} title="Segredo do gateway" onClose={close} dismissable={false}>
      {gateway && (
        <div className="flex flex-col gap-4">
          <div role="alert" className="flex gap-2 rounded-xl border border-warn-border bg-warn-bg p-3 text-sm font-medium text-warn">
            <AlertIcon className="shrink-0" />
            <p>
              Copie agora e grave no firmware do gateway. <strong>Este segredo não será exibido novamente.</strong> Se perder, gere um novo.
            </p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-ink-3">Gateway</dt>
            <dd className="font-semibold">
              {gateway.name} (id {gateway.id})
            </dd>
          </dl>
          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 break-all rounded-xl border border-line bg-surface-2 px-3 py-3 font-mono text-base" aria-label="Segredo em hexadecimal">
              {gateway.secret_hex}
            </code>
            <Button variant="secondary" onClick={copy}>
              <CopyIcon size={18} /> {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
            Já copiei e guardei o segredo em local seguro
          </label>
          <div className="flex justify-end">
            <Button onClick={close} disabled={!confirmed}>
              Concluir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function GatewaysAdmin() {
  const { data, error, loading, reload } = useApi(() => api.get<{ items: Gateway[] }>("/gateways"), []);
  const [secret, setSecret] = useState<GatewayWithSecret | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Gateway | null>(null);
  const [name, setName] = useState("");
  const [rotateTarget, setRotateTarget] = useState<Gateway | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setFormError("Informe um nome.");
    setBusy(true);
    setFormError(null);
    try {
      const created = await api.post<GatewayWithSecret>("/gateways", { name: name.trim() });
      setCreateOpen(false);
      setName("");
      setSecret(created);
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !name.trim()) return setFormError("Informe um nome.");
    setBusy(true);
    try {
      await api.patch(`/gateways/${editing.id}`, { name: name.trim() });
      setEditing(null);
      setMessage({ tone: "success", text: "Gateway atualizado." });
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(gateway: Gateway, active: boolean) {
    try {
      await api.patch(`/gateways/${gateway.id}`, { is_active: active });
      setMessage({ tone: "success", text: active ? "Gateway ativado." : "Gateway desativado: os envios dele serão recusados." });
      await reload();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    }
  }

  async function rotate() {
    if (!rotateTarget) return;
    setBusy(true);
    try {
      const rotated = await api.post<GatewayWithSecret>(`/gateways/${rotateTarget.id}/rotate-secret`);
      setRotateTarget(null);
      setSecret(rotated);
      await reload();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
      setRotateTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Gateways"
        subtitle="Receptores LoRa que encaminham as medições das estações para o servidor."
        actions={
          <Button
            onClick={() => {
              setName("");
              setFormError(null);
              setCreateOpen(true);
            }}
          >
            <PlusIcon size={18} /> Novo gateway
          </Button>
        }
      />
      {message && (
        <div className="mb-4">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data && <LoadingCards count={2} height="h-24" />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState title="Nenhum gateway cadastrado" />
        ) : (
          <ul className="flex flex-col gap-3">
            {data.items.map((g) => (
              <li key={g.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {g.name} <span className="font-normal text-ink-3">(id {g.id})</span>
                    </p>
                    <p className="text-sm text-ink-3">Último envio: {formatDateTime(g.last_seen_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-2 text-sm text-ink-2">
                      <Switch checked={g.is_active} onChange={(v) => toggleActive(g, v)} label={g.is_active ? "Desativar gateway" : "Ativar gateway"} />
                      {g.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditing(g);
                        setName(g.name);
                        setFormError(null);
                      }}
                    >
                      Renomear
                    </Button>
                    <Button variant="secondary" onClick={() => setRotateTarget(g)}>
                      Gerar novo segredo
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ))}

      <Modal open={createOpen || editing !== null} title={editing ? "Renomear gateway" : "Novo gateway"} onClose={() => { setCreateOpen(false); setEditing(null); }}>
        <form onSubmit={editing ? saveEdit : create} className="flex flex-col gap-3">
          {formError && <Notice tone="error">{formError}</Notice>}
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            Nome
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus />
          </label>
          {!editing && <p className="text-sm text-ink-3">Um segredo será gerado e exibido uma única vez após criar.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setEditing(null); }}>
              Cancelar
            </Button>
            <Button type="submit" busy={busy}>
              {editing ? "Salvar" : "Criar gateway"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={rotateTarget !== null} title="Gerar novo segredo?" onClose={() => setRotateTarget(null)}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">
            O segredo atual de <strong>{rotateTarget?.name}</strong> deixará de funcionar imediatamente. O gateway só voltará a enviar dados depois
            de receber o novo segredo.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRotateTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" busy={busy} onClick={rotate}>
              Gerar novo segredo
            </Button>
          </div>
        </div>
      </Modal>

      <SecretModal gateway={secret} onClose={() => setSecret(null)} />
    </>
  );
}
