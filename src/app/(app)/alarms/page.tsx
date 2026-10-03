import type { Metadata } from "next";

import { AlarmEvents } from "./AlarmEvents";

export const metadata: Metadata = { title: "Alarmes" };

export default async function AlarmsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status === "active" || params.status === "resolved" ? params.status : "all";
  const stationId = params.station_id && /^\d+$/.test(params.station_id) ? Number(params.station_id) : null;
  return <AlarmEvents initialStatus={status} initialStationId={stationId} />;
}
