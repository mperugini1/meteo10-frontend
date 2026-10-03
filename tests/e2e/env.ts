import { randomBytes } from "node:crypto";

import { gatewayHeaders } from "./cmac";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Defina ${name} em .env.e2e (veja .env.e2e.example)`);
  return value;
}

export const env = {
  apiBaseUrl: (process.env.E2E_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, ""),
  adminEmail: process.env.E2E_ADMIN_EMAIL ?? "admin@meteo10.local",
  adminPassword: () => required("E2E_ADMIN_PASSWORD"),
  gatewayId: Number(process.env.E2E_GATEWAY_ID ?? 1),
  gatewaySecret: () => required("E2E_GATEWAY_SECRET_HEX"),
  stationId: Number(process.env.E2E_STATION_ID ?? 1),
  viewerEmail: process.env.E2E_VIEWER_EMAIL ?? "visitante.e2e@meteo10.local",
  viewerPassword: process.env.E2E_VIEWER_PASSWORD ?? "visitante-e2e-123",
};

/** Envia uma medição assinada como o gateway. Valores em unidades físicas. */
export async function sendMeasurement(values: { temperature?: number; flags?: number } = {}) {
  const temperature = values.temperature ?? 22.5;
  const body = JSON.stringify({
    station_id: env.stationId,
    seq: Math.floor(Math.random() * 65536),
    flags: values.flags ?? 0,
    temperature_raw: Math.round(temperature * 100),
    humidity_raw: 6420,
    pressure_raw: 9248,
    wind_speed_raw: 312,
    wind_direction_raw: 135,
    soil_moisture_raw: 41,
    uv_index_raw: 63,
    battery_mv: 3987,
    rssi_dbm: -97,
    snr_db: 6.5,
    received_at: new Date().toISOString(),
  });
  const response = await fetch(`${env.apiBaseUrl}/ingest/measurements`, {
    method: "POST",
    headers: gatewayHeaders(env.gatewayId, env.gatewaySecret(), body, randomBytes(16).toString("hex")),
    body,
  });
  if (response.status !== 201) throw new Error(`Ingestão falhou: ${response.status} ${await response.text()}`);
  return (await response.json()) as { measurement_id: number };
}

export async function adminToken(): Promise<string> {
  const response = await fetch(`${env.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.adminEmail, password: env.adminPassword() }),
  });
  if (!response.ok) throw new Error(`Login do admin falhou: ${response.status}`);
  return ((await response.json()) as { access_token: string }).access_token;
}
