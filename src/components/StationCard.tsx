"use client";

import Link from "next/link";

import { BellIcon, DropletIcon, GaugeIcon, ThermometerIcon } from "@/components/icons";
import { BatteryIndicator, OnlineBadge, WindReading } from "@/components/status";
import { cx } from "@/components/ui";
import { formatValue, timeAgo, type WindUnit } from "@/lib/format";
import type { Station } from "@/types/api";

function Reading({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-3">
        {icon}
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums text-ink">{value}</span>
    </div>
  );
}

export function StationCard({ station, now, windUnit }: { station: Station; now: number; windUnit: WindUnit }) {
  const latest = station.latest;
  const alarms = station.active_alarms_count;
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby={`station-${station.id}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`station-${station.id}`} className="truncate text-lg font-bold">
            <Link href={`/stations/${station.id}`} className="hover:underline">
              {station.name}
            </Link>
          </h2>
          <p className="text-sm text-ink-3">Última atualização {timeAgo(station.last_seen_at, now)}</p>
        </div>
        <OnlineBadge online={station.online} />
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Reading icon={<ThermometerIcon size={14} />} label="Temperatura" value={formatValue("temperature_c", latest.temperature_c)} />
        <Reading icon={<DropletIcon size={14} />} label="Umidade do ar" value={formatValue("humidity_pct", latest.humidity_pct)} />
        <Reading icon={<GaugeIcon size={14} />} label="Pressão" value={formatValue("pressure_hpa", latest.pressure_hpa)} />
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 px-3 py-2.5">
          <span className="text-xs font-semibold text-ink-3">Vento</span>
          <WindReading speed={latest.wind_speed_ms} direction={latest.wind_direction_deg} unit={windUnit} />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <BatteryIndicator volts={station.battery_v} pct={station.battery_pct} />
        <Link
          href={alarms > 0 ? `/alarms?station_id=${station.id}&status=active` : `/stations/${station.id}/alarms`}
          className={cx(
            "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold",
            alarms > 0 ? "text-warn" : "text-ink-3",
          )}
          aria-label={alarms === 0 ? "Nenhum alarme ativo" : `${alarms} ${alarms === 1 ? "alarme ativo" : "alarmes ativos"}`}
        >
          <BellIcon size={18} />
          {alarms === 0 ? "Sem alarmes" : `${alarms} ${alarms === 1 ? "alarme" : "alarmes"}`}
        </Link>
        <Link
          href={`/stations/${station.id}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-soft px-4 text-sm font-semibold text-brand sm:w-auto"
        >
          Ver detalhes e gráficos
        </Link>
      </footer>
    </article>
  );
}
