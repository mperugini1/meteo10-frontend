import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AlarmRules } from "./AlarmRules";

export const metadata: Metadata = { title: "Regras de alarme" };

export default async function AlarmRulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stationId = Number(id);
  if (!Number.isInteger(stationId) || stationId < 1 || stationId > 255) notFound();
  return <AlarmRules stationId={stationId} />;
}
