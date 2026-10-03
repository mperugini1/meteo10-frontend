"use client";

import Link from "next/link";
import { useState } from "react";

import { BellIcon, CheckCircleIcon } from "@/components/icons";
import { EventStatusBadge, SeverityBadge } from "@/components/status";
import { Button, Card, EmptyState, ErrorState, LoadingCards, Notice, PageHeader, cx, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, fromLocalInputValue } from "@/lib/format";
import type { AlarmEvent, Page, Station } from "@/types/api";

type Status = "active" | "resolved" | "all";

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: "active", label: "Ativos" },
  { value: "resolved", label: "Resolvidos" },
  { value: "all", label: "Todos" },
];

const TYPE_LABELS: Record<AlarmEvent["type"], string> = {
  rule: "Regra",
  battery_low: "Bateria",
  battery_critical: "Bateria",
  station_offline: "Comunicação",
  sensor_fault: "Sensor",
};

function dayStart(value: string): string | undefined {
  return value ? fromLocalInputValue(`${value}T00:00`)?.toISOString() : undefined;
}

function dayEnd(value: string): string | undefined {
  const start = value ? fromLocalInputValue(`${value}T00:00`) : null;
  return start ? new Date(start.getTime() + 86_400_000).toISOString() : undefined;
}

export function AlarmEvents({ initialStatus, initialStationId }: { initialStatus: Status; initialStationId: number | null }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [stationId, setStationId] = useState<number | null>(initialStationId);
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [extra, setExtra] = useState<{ items: AlarmEvent[]; cursor: string | null } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [acking, setAcking] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const query = {
    status,
    station_id: stationId ?? undefined,
    from: dayStart(fromDay),
    to: dayEnd(toDay),
    limit: 50,
  };

  const stations = useApi(() => api.get<{ items: Station[] }>("/stations"), []);
  const events = useApi(
    async () => {
      const page = await api.get<Page<AlarmEvent>>("/alarm-events", query);
      setExtra(null);
      return page;
    },
    [status, stationId, fromDay, toDay],
    30_000,
  );

  const items = [...(events.data?.items ?? []), ...(extra?.items ?? [])];
  const nextCursor = extra ? extra.cursor : (events.data?.next_cursor ?? null);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await api.get<Page<AlarmEvent>>("/alarm-events", { ...query, cursor: nextCursor });
      setExtra({ items: [...(extra?.items ?? []), ...page.items], cursor: page.next_cursor });
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setLoadingMore(false);
    }
  }

  async function acknowledge(event: AlarmEvent) {
    setAcking(event.id);
    try {
      await api.post(`/alarm-events/${event.id}/acknowledge`);
      setMessage({ tone: "success", text: "Alarme reconhecido. Ele continua ativo até a condição voltar ao normal." });
      await events.reload();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setAcking(null);
    }
  }

  return (
    <>
      <PageHeader title="Alarmes" subtitle="Histórico de avisos das estações. Atualiza sozinho a cada 30 s." />

      <Card className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
          <span id="status-label">Situação</span>
          <div role="group" aria-labelledby="status-label" className="inline-flex rounded-xl border border-line bg-surface p-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={status === option.value}
                onClick={() => setStatus(option.value)}
                className={cx(
                  "min-h-9 flex-1 rounded-lg px-2 text-sm font-semibold",
                  status === option.value ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-surface-2",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
          Estação
          <select
            className={inputClass}
            value={stationId ?? ""}
            onChange={(e) => setStationId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todas</option>
            {stations.data?.items.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
          De
          <input type="date" className={inputClass} value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink-2">
          Até
          <input type="date" className={inputClass} value={toDay} onChange={(e) => setToDay(e.target.value)} />
        </label>
      </Card>

      {message && (
        <div className="mb-4">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
      {events.error && <ErrorState message={events.error.message} onRetry={events.reload} />}
      {events.loading && !events.data && <LoadingCards count={3} height="h-24" />}

      {events.data &&
        (items.length === 0 ? (
          <EmptyState title={status === "active" ? "Nenhum alarme ativo" : "Nenhum alarme encontrado"} icon={<BellIcon size={32} />}>
            {status === "active" ? "Tudo certo com as estações." : "Ajuste os filtros para ver outros períodos."}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Eventos de alarme">
            {items.map((event) => (
              <li key={event.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={event.severity} />
                      <EventStatusBadge event={event} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">{TYPE_LABELS[event.type]}</span>
                    </div>
                    <p className="font-medium text-ink">{event.message}</p>
                    <p className="text-sm text-ink-3">
                      <Link href={`/stations/${event.station_id}`} className="font-semibold text-ink-2 hover:underline">
                        {event.station_name ?? `Estação ${event.station_id}`}
                      </Link>
                      {" · "}início {formatDateTime(event.started_at)}
                      {event.resolved_at && ` · fim ${formatDateTime(event.resolved_at)}`}
                    </p>
                    {event.acknowledged_at && (
                      <p className="flex items-center gap-1 text-xs text-ink-3">
                        <CheckCircleIcon size={14} /> Reconhecido por {event.acknowledged_by_name ?? "usuário"} em {formatDateTime(event.acknowledged_at)}
                      </p>
                    )}
                  </div>
                  {!event.acknowledged_at && event.status === "active" && (
                    <Button variant="secondary" busy={acking === event.id} onClick={() => acknowledge(event)}>
                      <CheckCircleIcon size={18} /> Reconhecer
                    </Button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        ))}

      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" busy={loadingMore} onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      )}
    </>
  );
}
