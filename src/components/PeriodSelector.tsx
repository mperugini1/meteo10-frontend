"use client";

import { useState, type FormEvent } from "react";

import { Button, cx, inputClass } from "@/components/ui";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/format";

export type PresetKey = "24h" | "7d" | "30d";
export type PeriodValue = { kind: "preset"; preset: PresetKey } | { kind: "custom"; from: Date; to: Date };

export const PRESETS: Record<PresetKey, { label: string; ms: number }> = {
  "24h": { label: "24 horas", ms: 24 * 3_600_000 },
  "7d": { label: "7 dias", ms: 7 * 86_400_000 },
  "30d": { label: "30 dias", ms: 30 * 86_400_000 },
};

export function resolvePeriod(period: PeriodValue, now = Date.now()): { from: Date; to: Date } {
  if (period.kind === "custom") return { from: period.from, to: period.to };
  return { from: new Date(now - PRESETS[period.preset].ms), to: new Date(now) };
}

export function PeriodSelector({ value, onChange }: { value: PeriodValue; onChange: (value: PeriodValue) => void }) {
  const [customOpen, setCustomOpen] = useState(value.kind === "custom");
  const initial = resolvePeriod(value);
  const [from, setFrom] = useState(toLocalInputValue(initial.from));
  const [to, setTo] = useState(toLocalInputValue(initial.to));
  const [error, setError] = useState<string | null>(null);

  function applyCustom(event: FormEvent) {
    event.preventDefault();
    const f = fromLocalInputValue(from);
    const t = fromLocalInputValue(to);
    if (!f || !t) return setError("Informe data e hora de início e fim.");
    if (f >= t) return setError("O início precisa ser antes do fim.");
    if (t.getTime() - f.getTime() > 400 * 86_400_000) return setError("O período máximo é de 400 dias.");
    setError(null);
    onChange({ kind: "custom", from: f, to: t });
  }

  const tab = (active: boolean) =>
    cx("min-h-11 rounded-lg px-3 text-sm font-semibold", active ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-surface-2");

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Período" className="inline-flex flex-wrap gap-1 self-start rounded-xl border border-line bg-surface p-1">
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
          const active = value.kind === "preset" && value.preset === key && !customOpen;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              className={tab(active)}
              onClick={() => {
                setCustomOpen(false);
                onChange({ kind: "preset", preset: key });
              }}
            >
              {PRESETS[key].label}
            </button>
          );
        })}
        <button type="button" aria-pressed={customOpen} aria-expanded={customOpen} className={tab(customOpen)} onClick={() => setCustomOpen(true)}>
          Personalizado
        </button>
      </div>
      {customOpen && (
        <form onSubmit={applyCustom} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-ink-2">
            De
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} required />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-ink-2">
            Até
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} required />
          </label>
          <Button type="submit">Aplicar</Button>
          {error && (
            <p role="alert" className="text-sm font-medium text-crit sm:basis-full">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
