"use client";

import { SignalOffIcon } from "@/components/icons";
import { StationCard } from "@/components/StationCard";
import { ActiveAlarmsBanner } from "@/components/status";
import { EmptyState, ErrorState, LoadingCards, Notice, PageHeader } from "@/components/ui";
import { WindUnitToggle } from "@/components/WindUnitToggle";
import { useApi, useNow } from "@/hooks/useApi";
import { useWindUnit } from "@/hooks/useWindUnit";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { AlarmEvent, Page, Station } from "@/types/api";

const REFRESH_MS = 30_000;

export function Dashboard({ noPermission }: { noPermission: boolean }) {
  const now = useNow();
  const [windUnit] = useWindUnit();
  const { data, error, loading, reload } = useApi(
    async () => {
      const [stations, events] = await Promise.all([
        api.get<{ items: Station[] }>("/stations"),
        api.get<Page<AlarmEvent>>("/alarm-events", { status: "active", limit: 50 }),
      ]);
      return { stations: stations.items, events: events.items, fetchedAt: Date.now() };
    },
    [],
    REFRESH_MS,
  );

  return (
    <>
      <PageHeader
        title="Painel"
        subtitle={data ? `Atualiza sozinho a cada 30 s · última às ${formatTime(data.fetchedAt)}` : "Leituras atuais das estações"}
        actions={<WindUnitToggle />}
      />
      {noPermission && (
        <div className="mb-4">
          <Notice tone="error">Você não tem permissão para acessar a área de administração.</Notice>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorState
            message={data ? `Não foi possível atualizar: ${error.message} Mostrando os últimos dados recebidos.` : error.message}
            onRetry={reload}
          />
        </div>
      )}
      {loading && !data && <LoadingCards count={2} height="h-80" />}
      {data && (
        <>
          <ActiveAlarmsBanner events={data.events} />
          {data.stations.length === 0 ? (
            <EmptyState title="Nenhuma estação cadastrada" icon={<SignalOffIcon size={32} />}>
              Peça a um administrador para cadastrar a primeira estação.
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.stations.map((station) => (
                <StationCard key={station.id} station={station} now={now} windUnit={windUnit} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
