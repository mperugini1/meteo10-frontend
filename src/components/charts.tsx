"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cardinalFromDegrees, formatDateTime, formatDayMonth, formatNumber, formatTime } from "@/lib/format";

export interface SeriesPoint {
  t: number;
  value: number | null;
  /** Faixa mín–máx quando os dados são agregados */
  range?: [number, number] | null;
}

interface Domain {
  from: number;
  to: number;
}

const HOUR = 3_600_000;

function timeTickFormatter(domain: Domain) {
  const span = domain.to - domain.from;
  return (t: number) => (span <= 36 * HOUR ? formatTime(t) : formatDayMonth(t));
}

function timeTicks(domain: Domain, count = 6): number[] {
  const span = domain.to - domain.from;
  const steps = [HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, 24 * HOUR, 2 * 24 * HOUR, 7 * 24 * HOUR, 14 * 24 * HOUR, 30 * 24 * HOUR];
  const step = steps.find((s) => span / s <= count) ?? steps[steps.length - 1];
  // Alinha os ticks ao horário de São Paulo (UTC−3) para cair em horas/dias "redondos"
  const offset = 3 * HOUR;
  const first = Math.ceil((domain.from - offset) / step) * step + offset;
  const ticks: number[] = [];
  for (let t = first; t <= domain.to; t += step) ticks.push(t);
  return ticks;
}

/** Subconjunto das props que o Recharts passa ao conteúdo do tooltip. */
interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

const axisProps = {
  stroke: "var(--grid)",
  tickLine: false,
  tick: { fill: "var(--axis)", fontSize: 12 },
} as const;

function ChartTooltip({
  active,
  payload,
  unit,
  decimals,
  aggregated,
}: TooltipProps & { unit: string; decimals: number; aggregated: boolean }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as SeriesPoint;
  if (point.value === null) return null;
  const fmt = (v: number) => `${formatNumber(v, decimals)}${unit ? (unit === "%" ? "%" : ` ${unit}`) : ""}`;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="text-xs text-ink-3">{formatDateTime(point.t)}</p>
      <p className="font-bold text-ink">
        {aggregated ? "Média " : ""}
        {fmt(point.value)}
      </p>
      {aggregated && point.range && (
        <p className="text-xs text-ink-2">
          mín. {fmt(point.range[0])} · máx. {fmt(point.range[1])}
        </p>
      )}
    </div>
  );
}

export function TimeSeriesChart({
  title,
  unit,
  decimals,
  points,
  domain,
  aggregated,
  height = 220,
  yDomain,
}: {
  title: string;
  unit: string;
  decimals: number;
  points: SeriesPoint[];
  domain: Domain;
  aggregated: boolean;
  height?: number;
  yDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
}) {
  const hasData = points.some((p) => p.value !== null);
  const values = points.filter((p) => p.value !== null) as Array<SeriesPoint & { value: number }>;
  const last = values[values.length - 1];
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-semibold text-ink">
          {title}
          {unit && <span className="font-normal text-ink-3"> ({unit})</span>}
        </span>
        {last && (
          <span className="text-sm text-ink-3">
            última: <strong className="text-ink">{formatNumber(last.value, decimals)}</strong>
          </span>
        )}
      </figcaption>
      {!hasData ? (
        <p className="flex items-center justify-center text-sm text-ink-3" style={{ height }}>
          Sem dados neste período.
        </p>
      ) : (
        <div style={{ height }} role="img" aria-label={`Gráfico de ${title.toLowerCase()} no período selecionado`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[domain.from, domain.to]}
                ticks={timeTicks(domain)}
                tickFormatter={timeTickFormatter(domain)}
                {...axisProps}
              />
              <YAxis
                domain={yDomain ?? ["auto", "auto"]}
                tickFormatter={(v: number) => formatNumber(v, decimals > 1 ? 1 : decimals)}
                width={52}
                axisLine={false}
                {...axisProps}
              />
              <Tooltip
                cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
                content={(props) => <ChartTooltip active={props.active} payload={props.payload} unit={unit} decimals={decimals} aggregated={aggregated} />}
              />
              {aggregated && (
                <Area dataKey="range" stroke="none" fill="var(--series-band)" isAnimationActive={false} connectNulls={false} />
              )}
              <Line
                dataKey="value"
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

const DIRECTION_TICKS = [0, 90, 180, 270, 360];

function DirectionTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { t: number; value: number };
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="text-xs text-ink-3">{formatDateTime(point.t)}</p>
      <p className="font-bold text-ink">
        de {cardinalFromDegrees(point.value)} · {point.value}°
      </p>
    </div>
  );
}

/** Direção do vento: dispersão por horário (eixo Y em graus com pontos cardeais). */
export function WindDirectionChart({ points, domain, height = 220 }: { points: Array<{ t: number; value: number }>; domain: Domain; height?: number }) {
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption className="mb-2 font-semibold text-ink">
        Direção do vento <span className="font-normal text-ink-3">(de onde vem)</span>
      </figcaption>
      {points.length === 0 ? (
        <p className="flex items-center justify-center text-sm text-ink-3" style={{ height }}>
          Sem dados neste período.
        </p>
      ) : (
        <div style={{ height }} role="img" aria-label="Gráfico de dispersão da direção do vento por horário">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[domain.from, domain.to]}
                ticks={timeTicks(domain)}
                tickFormatter={timeTickFormatter(domain)}
                {...axisProps}
              />
              <YAxis
                dataKey="value"
                type="number"
                domain={[0, 360]}
                ticks={DIRECTION_TICKS}
                tickFormatter={(v: number) => cardinalFromDegrees(v % 360) ?? ""}
                width={52}
                axisLine={false}
                {...axisProps}
              />
              <Tooltip cursor={{ stroke: "var(--axis)", strokeWidth: 1 }} content={(props) => <DirectionTooltip active={props.active} payload={props.payload} />} />
              <Scatter data={points} fill="var(--series-1)" shape="circle" isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}
