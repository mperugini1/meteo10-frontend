import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StationDetail } from "./StationDetail";

export const metadata: Metadata = { title: "Estação" };

export default async function StationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stationId = Number(id);
  if (!Number.isInteger(stationId) || stationId < 1 || stationId > 255) notFound();
  return <StationDetail stationId={stationId} />;
}
