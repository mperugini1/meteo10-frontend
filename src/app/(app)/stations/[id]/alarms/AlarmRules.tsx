"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { BellIcon, ChevronLeftIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button, Card, EmptyState, ErrorState, LoadingCards, Modal, Notice, PageHeader, Switch, cx, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import { VARIABLES, formatNumber, formatValue } from "@/lib/format";
import type { AlarmOperator, AlarmRule, AlarmVariable, Station } from "@/types/api";

const RULE_VARIABLES: AlarmVariable[] = [
  "temperature_c",
  "humidity_pct",
  "pressure_hpa",
  "wind_speed_ms",
  "soil_moisture_pct",
  "uv_index",
  "battery_v",
];

const OPERATOR_TEXT: Record<AlarmOperator, string> = { gt: "acima de", lt: "abaixo de" };

/** Sugestões para uso agrícola (ponto em aberto 4 da especificação). */
const SUGGESTIONS: Array<{ label: string; variable: AlarmVariable; operator: AlarmOperator; threshold: number; hysteresis: number }> = [
  { label: "Risco de geada (abaixo de 2 °C)", variable: "temperature_c", operator: "lt", threshold: 2, hysteresis: 1 },
  { label: "Calor excessivo (acima de 35 °C)", variable: "temperature_c", operator: "gt", threshold: 35, hysteresis: 1 },
  { label: "Solo seco (abaixo de 30%)", variable: "soil_moisture_pct", operator: "lt", threshold: 30, hysteresis: 5 },
  { label: "Vento forte (acima de 10 m/s)", variable: "wind_speed_ms", operator: "gt", threshold: 10, hysteresis: 1 },
];

function RuleSentence({ rule }: { rule: Pick<AlarmRule, "variable" | "operator" | "threshold"> }) {
  return (
    <>
      Avisar quando {VARIABLES[rule.variable].phrase} ficar <strong>{OPERATOR_TEXT[rule.operator]}</strong>{" "}
      <strong>{formatValue(rule.variable, rule.threshold)}</strong>
    </>
  );
}

interface FormState {
  variable: AlarmVariable;
  operator: AlarmOperator;
  threshold: string;
  hysteresis: string;
}

const EMPTY_FORM: FormState = { variable: "temperature_c", operator: "gt", threshold: "", hysteresis: "0" };

/** Aceita "2,5", "1.000,5" e também "2.5". */
function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  if (normalized === "" || !/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

export function AlarmRules({ stationId }: { stationId: number }) {
  const { data, error, loading, reload } = useApi(
    async () => {
      const [station, rules] = await Promise.all([
        api.get<Station>(`/stations/${stationId}`),
        api.get<{ items: AlarmRule[] }>(`/stations/${stationId}/alarm-rules`),
      ]);
      return { station, rules: rules.items };
    },
    [stationId],
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<AlarmRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<AlarmRule | null>(null);

  function openNew(preset?: Partial<FormState>) {
    setEditing(null);
    setForm({ ...EMPTY_FORM, ...preset });
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(rule: AlarmRule) {
    setEditing(rule);
    setForm({
      variable: rule.variable,
      operator: rule.operator,
      threshold: formatNumber(rule.threshold, 2).replace(/\./g, ""),
      hysteresis: formatNumber(rule.hysteresis, 2).replace(/\./g, ""),
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const threshold = parseDecimal(form.threshold);
    const hysteresis = parseDecimal(form.hysteresis || "0");
    if (threshold === null) return setFormError("Informe o valor limite (ex.: 35 ou 2,5).");
    if (hysteresis === null || hysteresis < 0) return setFormError("A margem deve ser zero ou um número positivo.");
    setBusy(true);
    setFormError(null);
    try {
      const body = { variable: form.variable, operator: form.operator, threshold, hysteresis };
      if (editing) await api.patch(`/alarm-rules/${editing.id}`, body);
      else await api.post(`/stations/${stationId}/alarm-rules`, { ...body, is_enabled: true });
      setFormOpen(false);
      setMessage({ tone: "success", text: editing ? "Regra atualizada." : "Regra criada. Você verá o alarme no painel quando a condição ocorrer." });
      await reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(rule: AlarmRule, enabled: boolean) {
    try {
      await api.patch(`/alarm-rules/${rule.id}`, { is_enabled: enabled });
      setMessage({ tone: "success", text: enabled ? "Regra ativada." : "Regra desativada." });
      await reload();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.delete(`/alarm-rules/${toDelete.id}`);
      setMessage({ tone: "success", text: "Regra removida." });
      setToDelete(null);
      await reload();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const unit = VARIABLES[form.variable].unit;

  return (
    <>
      <PageHeader
        back={
          <Link href={`/stations/${stationId}`} className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-3 hover:text-ink">
            <ChevronLeftIcon size={16} /> {data?.station.name ?? "Estação"}
          </Link>
        }
        title="Regras de alarme"
        subtitle="Defina quando a estação deve avisar. Alarmes de bateria, falha de sensor e estação sem comunicação já são automáticos."
        actions={
          <Button onClick={() => openNew()}>
            <PlusIcon size={18} /> Nova regra
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

      {data && (
        <>
          {data.rules.length === 0 ? (
            <EmptyState title="Nenhuma regra criada" icon={<BellIcon size={32} />}>
              Crie uma regra ou use uma das sugestões abaixo.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Regras">
              {data.rules.map((rule) => (
                <li key={rule.id}>
                  <Card className={cx("flex flex-col gap-3 sm:flex-row sm:items-center", !rule.is_enabled && "opacity-75")}>
                    <div className="flex-1">
                      <p className="text-base text-ink">
                        <RuleSentence rule={rule} />
                      </p>
                      <p className="mt-1 text-xs text-ink-3">
                        {rule.is_enabled ? "Ativa" : "Desativada"}
                        {rule.hysteresis > 0 &&
                          ` · encerra quando voltar ${rule.operator === "gt" ? "abaixo de" : "acima de"} ${formatValue(
                            rule.variable,
                            rule.operator === "gt" ? rule.threshold - rule.hysteresis : rule.threshold + rule.hysteresis,
                          )}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.is_enabled} onChange={(v) => toggle(rule, v)} label={rule.is_enabled ? "Desativar regra" : "Ativar regra"} />
                      <Button variant="secondary" onClick={() => openEdit(rule)}>
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => setToDelete(rule)} aria-label="Remover regra">
                        <TrashIcon size={18} />
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <section className="mt-8" aria-labelledby="suggestions-heading">
            <h2 id="suggestions-heading" className="mb-3 font-bold">
              Sugestões para a lavoura
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s.label}
                  variant="secondary"
                  onClick={() =>
                    openNew({
                      variable: s.variable,
                      operator: s.operator,
                      threshold: formatNumber(s.threshold, 0),
                      hysteresis: formatNumber(s.hysteresis, 0),
                    })
                  }
                >
                  <PlusIcon size={16} /> {s.label}
                </Button>
              ))}
            </div>
          </section>
        </>
      )}

      <Modal open={formOpen} title={editing ? "Editar regra" : "Nova regra"} onClose={() => setFormOpen(false)}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {formError && <Notice tone="error">{formError}</Notice>}
          <p className="text-sm font-semibold text-ink-2">Avisar quando</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Grandeza
              <select
                className={inputClass}
                value={form.variable}
                onChange={(e) => setForm({ ...form, variable: e.target.value as AlarmVariable })}
              >
                {RULE_VARIABLES.map((v) => (
                  <option key={v} value={v}>
                    {VARIABLES[v].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Ficar
              <select
                className={inputClass}
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value as AlarmOperator })}
              >
                <option value="gt">acima de</option>
                <option value="lt">abaixo de</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
              Valor {unit && `(${unit})`}
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                placeholder="ex.: 35"
                required
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
            Margem para encerrar o alarme {unit && `(${unit})`}
            <input
              className={inputClass}
              inputMode="decimal"
              value={form.hysteresis}
              onChange={(e) => setForm({ ...form, hysteresis: e.target.value })}
              aria-describedby="hysteresis-hint"
            />
            <span id="hysteresis-hint" className="text-xs font-normal text-ink-3">
              Evita avisos repetidos quando o valor oscila perto do limite. Ex.: limite 35 °C com margem 1 encerra o alarme abaixo de 34 °C.
            </span>
          </label>
          {parseDecimal(form.threshold) !== null && (
            <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <RuleSentence rule={{ variable: form.variable, operator: form.operator, threshold: parseDecimal(form.threshold) as number }} />
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" busy={busy}>
              Salvar regra
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={toDelete !== null} title="Remover regra?" onClose={() => setToDelete(null)}>
        {toDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2">
              <RuleSentence rule={toDelete} />. O histórico de alarmes desta regra continua disponível.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="danger" busy={busy} onClick={confirmDelete}>
                Remover
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
