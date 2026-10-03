"use client";

import { useState, type FormEvent } from "react";

import { PlusIcon } from "@/components/icons";
import { OnlineBadge } from "@/components/status";
import { Button, Card, EmptyState, ErrorState, LoadingCards, Modal, Notice, PageHeader, Switch, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Station } from "@/types/api";

interface FormState {
  id: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  altitude_m: string;
  interval_min: string;
  is_active: boolean;
}

const EMPTY: FormState = { id: "", name: "", description: "", latitude: "", longitude: "", altitude_m: "", interval_min: "10", is_active: true };

function num(value: string): number | null {
  const v = value.trim().replace(",", ".");
  return v === "" ? null : Number(v);
}

export function StationsAdmin() {
  const { data, error, loading, reload } = useApi(() => api.get<{ items: Station[] }>("/stations", { include_inactive: true }), []);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<Station | null>(null);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openNew() {
    const used = new Set(data?.items.map((s) => s.id));
    let next = 1;
    while (used.has(next) && next < 255) next++;
    setEditing(null);
    setForm({ ...EMPTY, id: String(next) });
    setFormError(null);
    setOpen(true);
  }

  function openEdit(s: Station) {
    setEditing(s);
    setForm({
      id: String(s.id),
      name: s.name,
      description: s.description ?? "",
      latitude: s.latitude?.toString() ?? "",
      longitude: s.longitude?.toString() ?? "",
      altitude_m: s.altitude_m?.toString() ?? "",
      interval_min: String(s.measurement_interval_s / 60),
      is_active: s.is_active,
    });
    setFormError(null);
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const id = Number(form.id);
    const interval = num(form.interval_min);
    const values = [num(form.latitude), num(form.longitude), num(form.altitude_m)];
    if (!editing && (!Number.isInteger(id) || id < 1 || id > 255)) return setFormError("O número da estação deve ser de 1 a 255 (o mesmo configurado no aparelho).");
    if (!form.name.trim()) return setFormError("Informe o nome da estação.");
    if (interval === null || Number.isNaN(interval) || interval <= 0) return setFormError("Informe o intervalo de medição em minutos.");
    if (values.some((v) => v !== null && Number.isNaN(v))) return setFormError("Latitude, longitude e altitude devem ser números.");
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      latitude: values[0],
      longitude: values[1],
      altitude_m: values[2] === null ? null : Math.round(values[2]),
      measurement_interval_s: Math.round(interval * 60),
      is_active: form.is_active,
    };
    setBusy(true);
    setFormError(null);
    try {
      if (editing) await api.patch(`/stations/${editing.id}`, body);
      else await api.post("/stations", { id, ...body });
      setOpen(false);
      setMessage(editing ? "Estação atualizada." : "Estação cadastrada.");
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  return (
    <>
      <PageHeader
        title="Estações"
        subtitle="Cadastro das estações. O número deve ser igual ao configurado no aparelho."
        actions={
          <Button onClick={openNew}>
            <PlusIcon size={18} /> Nova estação
          </Button>
        }
      />
      {message && (
        <div className="mb-4">
          <Notice tone="success">{message}</Notice>
        </div>
      )}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {loading && !data && <LoadingCards count={2} height="h-24" />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState title="Nenhuma estação cadastrada" />
        ) : (
          <ul className="flex flex-col gap-3">
            {data.items.map((s) => (
              <li key={s.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-semibold">
                      Nº {s.id} · {s.name}
                    </p>
                    <p className="text-sm text-ink-3">
                      {s.is_active ? `Mede a cada ${Math.round(s.measurement_interval_s / 60)} min` : "Desativada"} · último contato{" "}
                      {formatDateTime(s.last_seen_at)}
                    </p>
                  </div>
                  {s.is_active && <OnlineBadge online={s.online} />}
                  <Button variant="secondary" onClick={() => openEdit(s)}>
                    Editar
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ))}

      <Modal open={open} title={editing ? `Editar estação nº ${editing.id}` : "Nova estação"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {formError && <Notice tone="error">{formError}</Notice>}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Número
              <input className={inputClass} inputMode="numeric" value={form.id} onChange={set("id")} disabled={Boolean(editing)} required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2 sm:col-span-2">
              Nome
              <input className={inputClass} value={form.name} onChange={set("name")} maxLength={120} required />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            Descrição
            <input className={inputClass} value={form.description} onChange={set("description")} maxLength={500} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Latitude
              <input className={inputClass} inputMode="decimal" value={form.latitude} onChange={set("latitude")} placeholder="-23.5558" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Longitude
              <input className={inputClass} inputMode="decimal" value={form.longitude} onChange={set("longitude")} placeholder="-46.7312" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Altitude (m)
              <input className={inputClass} inputMode="numeric" value={form.altitude_m} onChange={set("altitude_m")} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            Intervalo de medição (minutos)
            <input className={inputClass} inputMode="decimal" value={form.interval_min} onChange={set("interval_min")} required />
          </label>
          <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
            <span className="text-sm font-semibold text-ink-2">Estação ativa</span>
            <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Estação ativa" />
          </div>
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
