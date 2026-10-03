import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aggregateSeries, directionPoints, rawSeries } from "../../src/lib/series.ts";
import type { AggregateItem, Measurement } from "../../src/types/api.ts";

const m = (iso: string, temperature: number | null, dir: number | null = 90) =>
  ({ measured_at: iso, temperature_c: temperature, wind_direction_deg: dir }) as unknown as Measurement;

describe("rawSeries", () => {
  it("ignora nulos e quebra a linha em lacunas longas", () => {
    const points = rawSeries(
      [m("2026-10-03T10:00:00Z", 20), m("2026-10-03T10:10:00Z", null), m("2026-10-03T10:20:00Z", 21), m("2026-10-03T12:00:00Z", 22)],
      "temperature_c",
      30 * 60_000,
    );
    assert.deepEqual(points.map((p) => p.value), [20, 21, null, 22]);
  });
  it("aplica a conversão de unidade", () => {
    const points = rawSeries([m("2026-10-03T10:00:00Z", 10)], "temperature_c", 1, (v) => v * 3.6);
    assert.equal(points[0].value, 36);
  });
});

describe("aggregateSeries", () => {
  it("usa a média e a faixa mín–máx no meio do intervalo", () => {
    const item = {
      bucket_start: "2026-10-03T10:00:00.000Z",
      count: 6,
      temperature_c: { min: 18, avg: 19.5, max: 21, count: 6 },
      wind_direction_deg: { avg: 90, count: 6 },
    } as unknown as AggregateItem;
    const [p] = aggregateSeries([item], "temperature_c", 3_600_000);
    assert.equal(p.t, Date.parse("2026-10-03T10:30:00Z"));
    assert.equal(p.value, 19.5);
    assert.deepEqual(p.range, [18, 21]);
  });
});

describe("directionPoints", () => {
  it("descarta direções ausentes", () => {
    assert.equal(directionPoints([m("2026-10-03T10:00:00Z", 1, null), m("2026-10-03T10:10:00Z", 1, 45)]).length, 1);
  });
});
