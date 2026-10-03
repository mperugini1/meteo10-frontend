// Tipos espelhando as respostas do backend (snake_case, datas ISO 8601 UTC).

import type { VariableKey } from "@/lib/format";

export type Role = "admin" | "viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string | null;
}

export type LatestSummary = Record<VariableKey, number | null>;

export interface Station {
  id: number;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude_m: number | null;
  measurement_interval_s: number;
  is_active: boolean;
  created_at: string;
  last_seen_at: string | null;
  last_seq: number | null;
  online: boolean;
  offline_after_s: number;
  battery_v: number | null;
  battery_pct: number | null;
  active_alarms_count: number;
  latest: LatestSummary;
  latest_measured_at: string | null;
  last_measurement?: LastMeasurementMeta | null;
}

export interface LastMeasurementMeta {
  id: number;
  seq: number;
  flags: number;
  measured_at: string;
  received_at: string;
  rssi_dbm: number | null;
  snr_db: number | null;
  quality_flags: QualityFlags | null;
}

export interface QualityFlags {
  out_of_range?: string[];
  sensor_fault?: string[];
}

export interface LatestValue {
  value: number;
  measured_at: string;
}

export interface LatestResponse {
  station_id: number;
  measured_at: string | null;
  values: Record<VariableKey, LatestValue | null>;
  last_measurement: LastMeasurementMeta | null;
}

export interface Measurement extends Record<VariableKey, number | null> {
  id: number;
  station_id: number;
  seq: number;
  flags: number;
  measured_at: string;
  measured_at_estimated: boolean;
  received_at: string;
  rssi_dbm: number | null;
  snr_db: number | null;
  quality_flags: QualityFlags | null;
}

export interface Page<T> {
  items: T[];
  next_cursor: string | null;
}

export interface AggregateStat {
  min: number | null;
  avg: number | null;
  max: number | null;
  count: number;
}

export type AggregateItem = {
  bucket_start: string;
  count: number;
  wind_direction_deg: { avg: number | null; count: number };
} & Record<Exclude<VariableKey, "wind_direction_deg">, AggregateStat>;

export interface AggregateResponse {
  station_id: number;
  from: string;
  to: string;
  bucket: "hour" | "day";
  items: AggregateItem[];
}

export interface Availability {
  station_id: number;
  from: string;
  to: string;
  effective_from: string | null;
  expected: number;
  received: number;
  availability_pct: number | null;
}

export type AlarmVariable = Exclude<VariableKey, "wind_direction_deg">;
export type AlarmOperator = "gt" | "lt";

export interface AlarmRule {
  id: number;
  station_id: number;
  variable: AlarmVariable;
  operator: AlarmOperator;
  threshold: number;
  hysteresis: number;
  is_enabled: boolean;
  created_by: number;
  created_at: string;
}

export type AlarmType = "rule" | "battery_low" | "battery_critical" | "station_offline" | "sensor_fault";
export type Severity = "info" | "warning" | "critical";

export interface AlarmEvent {
  id: number;
  station_id: number;
  station_name: string | null;
  rule_id: number | null;
  type: AlarmType;
  source: string | null;
  severity: Severity;
  status: "active" | "resolved";
  message: string;
  trigger_value: number | null;
  measurement_id: number | null;
  started_at: string;
  resolved_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  acknowledged_by_name: string | null;
}

export interface Gateway {
  id: number;
  name: string;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface GatewayWithSecret extends Gateway {
  secret_hex: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}
