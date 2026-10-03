import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  batteryLevel,
  batteryPercent,
  cardinalFromDegrees,
  chartResolution,
  formatDateTime,
  formatNumber,
  formatValue,
  formatWindSpeed,
  fromLocalInputValue,
  msToKmh,
  timeAgo,
  toLocalInputValue,
} from "../../src/lib/format.ts";

describe("formatNumber", () => {
  it("usa vírgula decimal e ponto de milhar", () => {
    assert.equal(formatNumber(23.57, 1), "23,6");
    assert.equal(formatNumber(1013.25, 1), "1.013,3");
    assert.equal(formatNumber(3.987, 2), "3,99");
    assert.equal(formatNumber(41, 0), "41");
  });
  it("trata ausência e zero negativo", () => {
    assert.equal(formatNumber(null), "—");
    assert.equal(formatNumber(undefined), "—");
    assert.equal(formatNumber(-0.04, 1), "0,0");
    assert.equal(formatNumber(-5.5, 1), "-5,5");
  });
});

describe("formatValue", () => {
  it("inclui a unidade de cada grandeza", () => {
    assert.equal(formatValue("temperature_c", 23.57), "23,6 °C");
    assert.equal(formatValue("humidity_pct", 64.2), "64,2%");
    assert.equal(formatValue("pressure_hpa", 923.5), "923,5 hPa");
    assert.equal(formatValue("uv_index", 6.3), "6,3");
    assert.equal(formatValue("battery_v", 3.987), "3,99 V");
    assert.equal(formatValue("temperature_c", null), "—");
  });
});

describe("formatDateTime", () => {
  it("converte UTC para o horário de São Paulo", () => {
    assert.equal(formatDateTime("2026-10-03T14:20:00.000Z"), "03/10/2026 11:20");
    assert.equal(formatDateTime("2026-01-01T02:05:00.000Z"), "31/12/2025 23:05");
  });
  it("retorna travessão para valores inválidos", () => {
    assert.equal(formatDateTime(null), "—");
    assert.equal(formatDateTime("lixo"), "—");
  });
});

describe("cardinalFromDegrees", () => {
  it("mapeia os 8 pontos cardeais em português", () => {
    const cases: Array<[number, string]> = [
      [0, "N"], [22, "N"], [23, "NE"], [45, "NE"], [90, "E"], [135, "SE"],
      [180, "S"], [225, "SO"], [270, "O"], [315, "NO"], [337, "NO"], [338, "N"], [359, "N"],
    ];
    for (const [deg, expected] of cases) assert.equal(cardinalFromDegrees(deg), expected, `${deg}°`);
  });
  it("normaliza valores fora de 0–359 e trata ausência", () => {
    assert.equal(cardinalFromDegrees(360), "N");
    assert.equal(cardinalFromDegrees(-90), "O");
    assert.equal(cardinalFromDegrees(null), null);
  });
});

describe("bateria", () => {
  it("estima a porcentagem entre 3,00 V e 4,20 V", () => {
    assert.equal(batteryPercent(3.0), 0);
    assert.equal(batteryPercent(3.6), 50);
    assert.equal(batteryPercent(4.2), 100);
    assert.equal(batteryPercent(4.3), 100);
    assert.equal(batteryPercent(2.7), 0);
    assert.equal(batteryPercent(3.987), 82);
    assert.equal(batteryPercent(null), null);
  });
  it("classifica o nível como os alarmes do backend", () => {
    assert.equal(batteryLevel(3.9), "ok");
    assert.equal(batteryLevel(3.25), "low");
    assert.equal(batteryLevel(2.95), "critical");
    assert.equal(batteryLevel(null), "unknown");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-03T14:20:00Z");
  it("mostra minutos, horas e dias", () => {
    assert.equal(timeAgo("2026-10-03T14:19:30Z", now), "agora mesmo");
    assert.equal(timeAgo("2026-10-03T14:19:00Z", now), "há 1 min");
    assert.equal(timeAgo("2026-10-03T14:00:00Z", now), "há 20 min");
    assert.equal(timeAgo("2026-10-03T11:20:00Z", now), "há 3 h");
    assert.equal(timeAgo("2026-10-02T14:00:00Z", now), "há 1 dia");
    assert.equal(timeAgo("2026-09-30T14:20:00Z", now), "há 3 dias");
  });
  it("não mostra tempo negativo e trata ausência", () => {
    assert.equal(timeAgo("2026-10-03T14:25:00Z", now), "agora mesmo");
    assert.equal(timeAgo(null, now), "nunca");
  });
});

describe("vento", () => {
  it("converte m/s para km/h", () => {
    assert.equal(msToKmh(10), 36);
    assert.equal(formatWindSpeed(3.12), "3,1 m/s");
    assert.equal(formatWindSpeed(3.12, "kmh"), "11,2 km/h");
    assert.equal(formatWindSpeed(null), "—");
  });
});

describe("chartResolution", () => {
  const to = new Date("2026-10-03T00:00:00Z");
  const daysBefore = (n: number) => new Date(to.getTime() - n * 86_400_000);
  it("segue a regra de 7 e 60 dias", () => {
    assert.equal(chartResolution(daysBefore(1), to), "raw");
    assert.equal(chartResolution(daysBefore(7), to), "raw");
    assert.equal(chartResolution(daysBefore(30), to), "hour");
    assert.equal(chartResolution(daysBefore(60), to), "hour");
    assert.equal(chartResolution(daysBefore(61), to), "day");
  });
});

describe("datetime-local em São Paulo", () => {
  it("faz ida e volta", () => {
    const d = new Date("2026-10-03T14:20:00Z");
    assert.equal(toLocalInputValue(d), "2026-10-03T11:20");
    assert.equal(fromLocalInputValue("2026-10-03T11:20")?.toISOString(), "2026-10-03T14:20:00.000Z");
    assert.equal(fromLocalInputValue("inválido"), null);
  });
});
