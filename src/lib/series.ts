// Transforma medições/agregados da API em pontos para os gráficos (funções puras).

import type { AggregateItem, Measurement } from "../types/api.ts";
import type { VariableKey } from "./format.ts";

export interface Point {
  t: number;
  value: number | null;
  range?: [number, number] | null;
}

/**
 * Pontos de medições brutas (ordem crescente). Insere um ponto nulo quando o intervalo entre
 * duas medições passa de `maxGapMs`, para a linha "quebrar" nos períodos sem dados.
 */
export function rawSeries(
  measurements: Measurement[],
  variable: VariableKey,
  maxGapMs: number,
  transform: (v: number) => number = (v) => v,
): Point[] {
  const points: Point[] = [];
  let previous: number | null = null;
  for (const m of measurements) {
    const value = m[variable];
    if (value === null) continue;
    const t = Date.parse(m.measured_at);
    if (previous !== null && t - previous > maxGapMs) points.push({ t: previous + 1, value: null });
    points.push({ t, value: transform(value) });
    previous = t;
  }
  return points;
}

export function aggregateSeries(
  items: AggregateItem[],
  variable: Exclude<VariableKey, "wind_direction_deg">,
  bucketMs: number,
  transform: (v: number) => number = (v) => v,
): Point[] {
  const points: Point[] = [];
  let previous: number | null = null;
  for (const item of items) {
    const stat = item[variable];
    if (!stat || stat.avg === null || stat.min === null || stat.max === null) continue;
    // Ponto no meio do intervalo agregado
    const t = Date.parse(item.bucket_start) + bucketMs / 2;
    if (previous !== null && t - previous > bucketMs * 1.5) points.push({ t: previous + 1, value: null, range: null });
    points.push({ t, value: transform(stat.avg), range: [transform(stat.min), transform(stat.max)] });
    previous = t;
  }
  return points;
}

export function directionPoints(measurements: Measurement[]): Array<{ t: number; value: number }> {
  return measurements
    .filter((m) => m.wind_direction_deg !== null)
    .map((m) => ({ t: Date.parse(m.measured_at), value: m.wind_direction_deg as number }));
}

export function aggregateDirectionPoints(items: AggregateItem[], bucketMs: number): Array<{ t: number; value: number }> {
  return items
    .filter((i) => i.wind_direction_deg.avg !== null)
    .map((i) => ({ t: Date.parse(i.bucket_start) + bucketMs / 2, value: i.wind_direction_deg.avg as number }));
}

export function hasAnyValue(points: Point[]): boolean {
  return points.some((p) => p.value !== null);
}
