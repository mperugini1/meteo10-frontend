// Formatação pt-BR e conversões puras (testadas com `node --test`).
// Sem imports para rodar direto no Node com remoção de tipos.

export const TIME_ZONE = "America/Sao_Paulo";
export const EMPTY = "—";

const numberFormats = new Map<number, Intl.NumberFormat>();

function numberFormat(decimals: number): Intl.NumberFormat {
  let nf = numberFormats.get(decimals);
  if (!nf) {
    nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    numberFormats.set(decimals, nf);
  }
  return nf;
}

/** Número com vírgula decimal ("23,6"); "—" quando ausente. */
export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  // Evita "-0,0"
  const rounded = Number(value.toFixed(decimals));
  return numberFormat(decimals).format(Object.is(rounded, -0) ? 0 : rounded);
}

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parts(date: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of dateTimeFormat.formatToParts(date)) out[p.type] = p.value;
  return out;
}

function toDate(value: string | Date | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** "03/10/2026 11:20" no horário de São Paulo. */
export function formatDateTime(value: string | Date | number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  const p = parts(d);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

/** "11:20" */
export function formatTime(value: string | Date | number): string {
  const p = parts(toDate(value));
  return `${p.hour}:${p.minute}`;
}

/** "03/10" */
export function formatDayMonth(value: string | Date | number): string {
  const p = parts(toDate(value));
  return `${p.day}/${p.month}`;
}

/** "há 5 min", "há 2 h", "há 3 dias"; "agora mesmo" abaixo de 1 min. */
export function timeAgo(value: string | Date | number | null | undefined, now: Date | number = Date.now()): string {
  if (value === null || value === undefined) return "nunca";
  const then = toDate(value).getTime();
  const nowMs = now instanceof Date ? now.getTime() : now;
  const diffS = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diffS < 60) return "agora mesmo";
  const minutes = Math.floor(diffS / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

export const CARDINALS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
export type Cardinal = (typeof CARDINALS)[number];

const CARDINAL_NAMES: Record<Cardinal, string> = {
  N: "norte",
  NE: "nordeste",
  E: "leste",
  SE: "sudeste",
  S: "sul",
  SO: "sudoeste",
  O: "oeste",
  NO: "noroeste",
};

/** Ponto cardeal (8 setores de 45°) a partir de graus; 0° = N, 90° = E. */
export function cardinalFromDegrees(degrees: number | null | undefined): Cardinal | null {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) return null;
  const normalized = ((degrees % 360) + 360) % 360;
  return CARDINALS[Math.round(normalized / 45) % 8];
}

export function cardinalName(cardinal: Cardinal): string {
  return CARDINAL_NAMES[cardinal];
}

/** Estimativa linear: 3,00 V = 0 %, 4,20 V = 100 %, limitada a 0–100. */
export function batteryPercent(volts: number | null | undefined): number | null {
  if (volts === null || volts === undefined || Number.isNaN(volts)) return null;
  const pct = ((volts - 3.0) / 1.2) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

export type BatteryLevel = "ok" | "low" | "critical" | "unknown";

/** Mesmos limites dos alarmes do backend: < 3,3 V baixa; < 3,0 V crítica. */
export function batteryLevel(volts: number | null | undefined): BatteryLevel {
  if (volts === null || volts === undefined) return "unknown";
  if (volts < 3.0) return "critical";
  if (volts < 3.3) return "low";
  return "ok";
}

export function msToKmh(ms: number | null | undefined): number | null {
  if (ms === null || ms === undefined) return null;
  return ms * 3.6;
}

export type WindUnit = "ms" | "kmh";

export function formatWindSpeed(ms: number | null | undefined, unit: WindUnit = "ms"): string {
  if (ms === null || ms === undefined) return EMPTY;
  return unit === "kmh" ? `${formatNumber(msToKmh(ms), 1)} km/h` : `${formatNumber(ms, 1)} m/s`;
}

export type VariableKey =
  | "temperature_c"
  | "humidity_pct"
  | "pressure_hpa"
  | "wind_speed_ms"
  | "wind_direction_deg"
  | "soil_moisture_pct"
  | "uv_index"
  | "battery_v";

export interface VariableInfo {
  label: string;
  /** Usado em frases: "Avisar quando a temperatura ficar acima de…" */
  phrase: string;
  unit: string;
  decimals: number;
}

export const VARIABLES: Record<VariableKey, VariableInfo> = {
  temperature_c: { label: "Temperatura", phrase: "a temperatura", unit: "°C", decimals: 1 },
  humidity_pct: { label: "Umidade do ar", phrase: "a umidade do ar", unit: "%", decimals: 1 },
  pressure_hpa: { label: "Pressão", phrase: "a pressão", unit: "hPa", decimals: 1 },
  wind_speed_ms: { label: "Vento", phrase: "a velocidade do vento", unit: "m/s", decimals: 1 },
  wind_direction_deg: { label: "Direção do vento", phrase: "a direção do vento", unit: "°", decimals: 0 },
  soil_moisture_pct: { label: "Umidade do solo", phrase: "a umidade do solo", unit: "%", decimals: 0 },
  uv_index: { label: "Índice UV", phrase: "o índice UV", unit: "", decimals: 1 },
  battery_v: { label: "Bateria", phrase: "a bateria", unit: "V", decimals: 2 },
};

/** "23,6 °C", "64%", "6,3" (UV sem unidade). */
export function formatValue(variable: VariableKey, value: number | null | undefined): string {
  const info = VARIABLES[variable];
  const text = formatNumber(value, info.decimals);
  if (text === EMPTY || !info.unit) return text;
  return info.unit === "%" ? `${text}%` : `${text} ${info.unit}`;
}

export type Resolution = "raw" | "hour" | "day";

const DAY_MS = 86_400_000;

/** Até 7 dias: medições brutas; até 60 dias: agregação por hora; acima: por dia. */
export function chartResolution(from: Date, to: Date): Resolution {
  const span = to.getTime() - from.getTime();
  if (span <= 7 * DAY_MS) return "raw";
  if (span <= 60 * DAY_MS) return "hour";
  return "day";
}

/** Deslocamento (min) do fuso de São Paulo em relação ao UTC no instante dado (ex.: -180). */
export function saoPauloOffsetMinutes(at: Date): number {
  const p = parts(at);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  const truncated = Math.floor(at.getTime() / 60_000) * 60_000;
  return Math.round((asUtc - truncated) / 60_000);
}

/** Valor para <input type="datetime-local"> ("2026-10-03T11:20") no horário de São Paulo. */
export function toLocalInputValue(date: Date): string {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Interpreta "2026-10-03T11:20" como horário de São Paulo. */
export function fromLocalInputValue(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const naiveUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const offset = saoPauloOffsetMinutes(new Date(naiveUtc));
  return new Date(naiveUtc - offset * 60_000);
}
