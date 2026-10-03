"use client";

import Link from "next/link";

import {
  AlertIcon,
  AlertOctagonIcon,
  BatteryIcon,
  CheckCircleIcon,
  SignalIcon,
  SignalOffIcon,
  WindArrow,
} from "@/components/icons";
import { cx } from "@/components/ui";
import {
  batteryLevel,
  cardinalFromDegrees,
  cardinalName,
  formatDateTime,
  formatNumber,
  formatWindSpeed,
  type WindUnit,
} from "@/lib/format";
import type { AlarmEvent, Severity } from "@/types/api";

export function OnlineBadge({ online }: { online: boolean }) {
  return online ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-1 text-xs font-semibold text-ok">
      <SignalIcon size={14} /> Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-offline-bg px-2.5 py-1 text-xs font-semibold text-offline">
      <SignalOffIcon size={14} /> Offline
    </span>
  );
}

const SEVERITY: Record<Severity, { label: string; className: string; Icon: typeof AlertIcon }> = {
  info: { label: "Aviso", className: "bg-surface-2 text-ink-2", Icon: AlertIcon },
  warning: { label: "Alerta", className: "bg-warn-bg text-warn", Icon: AlertIcon },
  critical: { label: "Crítico", className: "bg-crit-bg text-crit", Icon: AlertOctagonIcon },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className, Icon } = SEVERITY[severity];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      <Icon size={14} /> {label}
    </span>
  );
}

export function EventStatusBadge({ event }: { event: AlarmEvent }) {
  if (event.status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-bg px-2.5 py-1 text-xs font-semibold text-ok">
        <CheckCircleIcon size={14} /> Resolvido
      </span>
    );
  }
  return event.acknowledged_at ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-2">
      <CheckCircleIcon size={14} /> Ativo · reconhecido
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink">
      <AlertIcon size={14} /> Ativo
    </span>
  );
}

const BATTERY_TONE = {
  ok: "text-ink",
  low: "text-warn",
  critical: "text-crit",
  unknown: "text-ink-3",
} as const;

const BATTERY_TEXT = { ok: "", low: "baixa", critical: "crítica", unknown: "" } as const;

export function BatteryIndicator({ volts, pct, compact = false }: { volts: number | null; pct: number | null; compact?: boolean }) {
  const level = batteryLevel(volts);
  const label =
    volts === null
      ? "Bateria sem leitura"
      : `Bateria ${BATTERY_TEXT[level] ? `${BATTERY_TEXT[level]}, ` : ""}${formatNumber(pct, 0)}% (${formatNumber(volts, 2)} V)`;
  return (
    <span className={cx("inline-flex items-center gap-1.5 font-semibold", BATTERY_TONE[level])} aria-label={label} title={label}>
      <BatteryIcon pct={pct} />
      {volts === null ? (
        <span aria-hidden="true">—</span>
      ) : (
        <span aria-hidden="true" className="tabular-nums">
          {formatNumber(pct, 0)}%{!compact && <span className="ml-1 font-normal text-ink-3">{formatNumber(volts, 2)} V</span>}
          {BATTERY_TEXT[level] && <span className="ml-1 text-xs uppercase">{BATTERY_TEXT[level]}</span>}
        </span>
      )}
    </span>
  );
}

export function WindReading({ speed, direction, unit, size = "md" }: { speed: number | null; direction: number | null; unit: WindUnit; size?: "md" | "lg" }) {
  const cardinal = cardinalFromDegrees(direction);
  const label = cardinal
    ? `Vento de ${cardinalName(cardinal)} (${direction}°), ${formatWindSpeed(speed, unit)}`
    : `Vento ${formatWindSpeed(speed, unit)}`;
  return (
    <span className="inline-flex items-center gap-2" aria-label={label}>
      <WindArrow degrees={direction} size={size === "lg" ? 36 : 28} />
      <span aria-hidden="true" className="flex flex-col leading-tight">
        <span className={cx("font-bold tabular-nums", size === "lg" ? "text-3xl" : "text-xl")}>{formatWindSpeed(speed, unit)}</span>
        <span className="text-xs text-ink-3">{cardinal ? `de ${cardinal} · ${direction}°` : "direção —"}</span>
      </span>
    </span>
  );
}

/** Faixa de alarmes ativos (topo do painel). */
export function ActiveAlarmsBanner({ events, showStation = true }: { events: AlarmEvent[]; showStation?: boolean }) {
  if (events.length === 0) return null;
  const critical = events.some((e) => e.severity === "critical");
  const visible = events.slice(0, 4);
  return (
    <section
      aria-label="Alarmes ativos"
      className={cx(
        "mb-5 rounded-2xl border-2 p-4",
        critical ? "border-crit-border bg-crit-bg text-crit" : "border-warn-border bg-warn-bg text-warn",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold">
          {critical ? <AlertOctagonIcon /> : <AlertIcon />}
          {events.length === 1 ? "1 alarme ativo" : `${events.length} alarmes ativos`}
        </h2>
        <Link href="/alarms" className="text-sm font-semibold underline underline-offset-2">
          Ver todos
        </Link>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {visible.map((event) => (
          <li key={event.id} className="flex flex-col gap-0.5 rounded-xl bg-surface px-3 py-2 text-ink sm:flex-row sm:items-center sm:gap-3">
            <SeverityBadge severity={event.severity} />
            <span className="flex-1 text-sm font-medium">
              {showStation && event.station_name && <strong>{event.station_name}: </strong>}
              {event.message}
            </span>
            <span className="text-xs text-ink-3">
              desde {formatDateTime(event.started_at)}
              {event.acknowledged_at && " · reconhecido"}
            </span>
          </li>
        ))}
      </ul>
      {events.length > visible.length && <p className="mt-2 text-sm font-medium">e mais {events.length - visible.length}…</p>}
    </section>
  );
}
