"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TimeSeriesChart, WindDirectionChart } from "@/components/charts";
import {
  BellIcon,
  ChevronLeftIcon,
  DownloadIcon,
  DropletIcon,
  GaugeIcon,
  MapPinIcon,
  SproutIcon,
  SunIcon,
  ThermometerIcon,
} from "@/components/icons";
import { PeriodSelector, resolvePeriod, type PeriodValue } from "@/components/PeriodSelector";
import { ActiveAlarmsBanner, BatteryIndicator, OnlineBadge, WindReading } from "@/components/status";
import { Card, ErrorState, LoadingCards, PageHeader, Skeleton } from "@/components/ui";
import { WindUnitToggle } from "@/components/WindUnitToggle";
import { useApi, useNow } from "@/hooks/useApi";
import { useWindUnit } from "@/hooks/useWindUnit";
import { api, backendUrl } from "@/lib/api";
import {
  VARIABLES,
  chartResolution,
  formatDateTime,
  formatNumber,
  formatValue,
  msToKmh,
  timeAgo,
  type VariableKey,
} from "@/lib/format";
import { aggregateDirectionPoints, aggregateSeries, directionPoints, hasAnyValue, rawSeries } from "@/lib/series";
import type { AggregateResponse, AlarmEvent, Availability, LatestResponse, Measurement, Page, Station } from "@/types/api";

const REFRESH_MS = 30_000;
const MAX_RAW_PAGES = 10;
const BUCKET_MS = { hour: 3_600_000, day: 86_400_000 } as const;

type ChartData =
  | { kind: "raw"; from: number; to: number; measurements: Measurement[]; truncated: boolean }
  | { kind: "hour" | "day"; from: number; to: number; items: AggregateResponse["items"] };

async function loadChartData(stationId: number, from: Date, to: Date): Promise<ChartData> {
  const resolution = chartResolution(from, to);
  const query = { from: from.toISOString(), to: to.toISOString() };
  if (resolution === "raw") {
    const measurements: Measurement[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page: Page<Measurement> = await api.get(`/stations/${stationId}/measurements`, { ...query, limit: 1000, cursor });
      measurements.push(...page.items);
      cursor = page.next_cursor;
      pages += 1;
    } while (cursor && pages < MAX_RAW_PAGES);
    measurements.reverse(); // API devolve em ordem decrescente
    return { kind: "raw", from: from.getTime(), to: to.getTime(), measurements, truncated: Boolean(cursor) };
  }
  const agg = await api.get<AggregateResponse>(`/stations/${stationId}/measurements/aggregate`, { ...query, bucket: resolution });
  return { kind: resolution, from: from.getTime(), to: to.getTime(), items: agg.items };
}

function CurrentValue({ icon, variable, latest, newest }: { icon: React.ReactNode; variable: VariableKey; latest: LatestResponse; newest: string | null }) {
  const item = latest.values[variable];
  const stale = item && newest && item.measured_at !== newest;
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-3">
        {icon}
        {VARIABLES[variable].label}
      </span>
      <span className="text-3xl font-bold tabular-nums text-ink">{formatValue(variable, item?.value)}</span>
      {stale && <span className="text-xs text-warn">Leitura de {formatDateTime(item.measured_at)}</span>}
      {!item && <span className="text-xs text-ink-3">Sem leitura válida</span>}
    </div>
  );
}

export function StationDetail({ stationId }: { stationId: number }) {
  const now = useNow();
  const [windUnit] = useWindUnit();
  const [period, setPeriod] = useState<PeriodValue>({ kind: "preset", preset: "24h" });
  const [periodVersion, setPeriodVersion] = useState(0);

  const current = useApi(
    async () => {
      const [station, latest, events] = await Promise.all([
        api.get<Station>(`/stations/${stationId}`),
        api.get<LatestResponse>(`/stations/${stationId}/latest`),
        api.get<Page<AlarmEvent>>("/alarm-events", { station_id: stationId, status: "active", limit: 20 }),
      ]);
      return { station, latest, events: events.items };
    },
    [stationId],
    REFRESH_MS,
  );

  const history = useApi(
    async () => {
      const { from, to } = resolvePeriod(period);
      const [chart, availability] = await Promise.all([
        loadChartData(stationId, from, to),
        api.get<Availability>(`/stations/${stationId}/availability`, { from: from.toISOString(), to: to.toISOString() }),
      ]);
      return { chart, availability };
    },
    [stationId, period, periodVersion],
    period.kind === "preset" ? 60_000 : undefined,
  );

  const station = current.data?.station;
  const latest = current.data?.latest;
  const interval = station?.measurement_interval_s ?? 600;

  const charts = useMemo(() => {
    const chart = history.data?.chart;
    if (!chart) return null;
    const domain = { from: chart.from, to: chart.to };
    const windTransform = windUnit === "kmh" ? (v: number) => msToKmh(v) as number : undefined;
    const series = (variable: Exclude<VariableKey, "wind_direction_deg">, transform?: (v: number) => number) =>
      chart.kind === "raw"
        ? rawSeries(chart.measurements, variable, 3 * interval * 1000, transform)
        : aggregateSeries(chart.items, variable, BUCKET_MS[chart.kind], transform);
    return {
      domain,
      aggregated: chart.kind !== "raw",
      kind: chart.kind,
      truncated: chart.kind === "raw" && chart.truncated,
      temperature: series("temperature_c"),
      humidity: series("humidity_pct"),
      pressure: series("pressure_hpa"),
      wind: series("wind_speed_ms", windTransform),
      battery: series("battery_v"),
      soil: series("soil_moisture_pct"),
      uv: series("uv_index"),
      direction: chart.kind === "raw" ? directionPoints(chart.measurements) : aggregateDirectionPoints(chart.items, BUCKET_MS[chart.kind]),
    };
  }, [history.data, interval, windUnit]);

  const { from, to } = resolvePeriod(period, history.data?.chart.to ?? now);
  const csvHref = backendUrl(`/stations/${stationId}/measurements.csv`, { from: from.toISOString(), to: to.toISOString() });

  const back = (
    <Link href="/" className="mb-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-3 hover:text-ink">
      <ChevronLeftIcon size={16} /> Painel
    </Link>
  );

  if (current.error && !current.data) {
    return (
      <>
        <PageHeader title="Estação" back={back} />
        <ErrorState message={current.error.status === 404 ? "Estação não encontrada." : current.error.message} onRetry={current.reload} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        back={back}
        title={station ? station.name : <Skeleton className="h-8 w-56" />}
        subtitle={
          station && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <OnlineBadge online={station.online} />
              <span>Última atualização {timeAgo(station.last_seen_at, now)}</span>
              {station.latitude !== null && station.longitude !== null && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon size={14} />
                  {formatNumber(station.latitude, 4)}, {formatNumber(station.longitude, 4)}
                  {station.altitude_m !== null && ` · ${station.altitude_m} m`}
                </span>
              )}
            </span>
          )
        }
        actions={
          <>
            <WindUnitToggle />
            <Link
              href={`/stations/${stationId}/alarms`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2"
            >
              <BellIcon size={18} /> Regras de alarme
            </Link>
          </>
        }
      />

      {current.error && current.data && (
        <div className="mb-4">
          <ErrorState message={`Não foi possível atualizar: ${current.error.message}`} onRetry={current.reload} />
        </div>
      )}

      {current.data && <ActiveAlarmsBanner events={current.data.events} showStation={false} />}

      {/* Leituras atuais */}
      <section aria-labelledby="current-heading" className="mb-8">
        <h2 id="current-heading" className="mb-3 text-lg font-bold">
          Agora
        </h2>
        {!latest || !station ? (
          <LoadingCards count={4} height="h-28" />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <CurrentValue icon={<ThermometerIcon size={16} />} variable="temperature_c" latest={latest} newest={latest.measured_at} />
            <CurrentValue icon={<DropletIcon size={16} />} variable="humidity_pct" latest={latest} newest={latest.measured_at} />
            <CurrentValue icon={<GaugeIcon size={16} />} variable="pressure_hpa" latest={latest} newest={latest.measured_at} />
            <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
              <span className="text-sm font-semibold text-ink-3">Vento</span>
              <WindReading
                speed={latest.values.wind_speed_ms?.value ?? null}
                direction={latest.values.wind_direction_deg?.value ?? null}
                unit={windUnit}
                size="lg"
              />
            </div>
            <CurrentValue icon={<SproutIcon size={16} />} variable="soil_moisture_pct" latest={latest} newest={latest.measured_at} />
            <CurrentValue icon={<SunIcon size={16} />} variable="uv_index" latest={latest} newest={latest.measured_at} />
            <div className="col-span-2 flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
              <span className="text-sm font-semibold text-ink-3">Bateria</span>
              <span className="text-2xl">
                <BatteryIndicator volts={station.battery_v} pct={station.battery_pct} />
              </span>
              <span className="text-xs text-ink-3">Carregada pelo painel solar durante o dia.</span>
            </div>
          </div>
        )}
        {latest?.values.pressure_hpa && latest.values.pressure_hpa.value < 960 && (
          <p className="mt-3 text-xs text-ink-3">
            A pressão medida em lugares altos é menor: em São Paulo (cerca de 760 m de altitude), valores entre 920 e 930 hPa são normais.
          </p>
        )}
      </section>

      {/* Histórico */}
      <section aria-labelledby="history-heading">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 id="history-heading" className="text-lg font-bold">
            Histórico
          </h2>
          <a
            href={csvHref}
            download
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2"
          >
            <DownloadIcon size={18} /> Exportar CSV
          </a>
        </div>
        <div className="mb-4">
          <PeriodSelector
            value={period}
            onChange={(value) => {
              setPeriod(value);
              setPeriodVersion((v) => v + 1);
            }}
          />
        </div>

        {history.data && (
          <Card className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="text-sm font-semibold text-ink-3">Disponibilidade no período</p>
              <p className="text-2xl font-bold tabular-nums">
                {history.data.availability.availability_pct === null ? "—" : `${formatNumber(history.data.availability.availability_pct, 1)}%`}
              </p>
            </div>
            <p className="text-sm text-ink-2">
              {history.data.availability.received} de {history.data.availability.expected} medições esperadas recebidas
              <span className="text-ink-3"> (1 a cada {Math.round(interval / 60)} min)</span>
            </p>
            {charts?.aggregated && (
              <p className="text-sm text-ink-3">
                Gráficos com média por {charts.kind === "hour" ? "hora" : "dia"}; a faixa clara mostra o mínimo e o máximo.
              </p>
            )}
            {charts?.truncated && <p className="text-sm text-warn">Período com muitas medições: exibindo as mais recentes.</p>}
          </Card>
        )}

        {history.error && <ErrorState message={history.error.message} onRetry={history.reload} />}
        {history.loading && !history.data && <LoadingCards count={4} height="h-64" />}
        {charts && (
          <div className="grid gap-4 lg:grid-cols-2">
            <TimeSeriesChart title="Temperatura" unit="°C" decimals={1} points={charts.temperature} domain={charts.domain} aggregated={charts.aggregated} />
            <TimeSeriesChart title="Umidade do ar" unit="%" decimals={1} points={charts.humidity} domain={charts.domain} aggregated={charts.aggregated} />
            <TimeSeriesChart title="Pressão" unit="hPa" decimals={1} points={charts.pressure} domain={charts.domain} aggregated={charts.aggregated} />
            <TimeSeriesChart
              title="Velocidade do vento"
              unit={windUnit === "kmh" ? "km/h" : "m/s"}
              decimals={1}
              points={charts.wind}
              domain={charts.domain}
              aggregated={charts.aggregated}
              yDomain={[0, "auto"]}
            />
            <WindDirectionChart points={charts.direction} domain={charts.domain} />
            <TimeSeriesChart title="Bateria" unit="V" decimals={2} points={charts.battery} domain={charts.domain} aggregated={charts.aggregated} />
            {hasAnyValue(charts.soil) && (
              <TimeSeriesChart title="Umidade do solo" unit="%" decimals={0} points={charts.soil} domain={charts.domain} aggregated={charts.aggregated} yDomain={[0, 100]} />
            )}
            {hasAnyValue(charts.uv) && (
              <TimeSeriesChart title="Índice UV" unit="" decimals={1} points={charts.uv} domain={charts.domain} aggregated={charts.aggregated} yDomain={[0, "auto"]} />
            )}
          </div>
        )}
      </section>
    </>
  );
}
