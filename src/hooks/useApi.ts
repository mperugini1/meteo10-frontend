"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api";

export interface ApiState<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  /** Recarrega mantendo os dados atuais na tela. */
  reload: () => Promise<void>;
}

interface Stored<T> {
  key: string | null;
  data: T | undefined;
  error: ApiError | null;
}

/**
 * Busca dados e, opcionalmente, atualiza a cada `refreshMs` (padrão do painel: 30 s).
 * Quando `deps` mudam, os dados anteriores deixam de ser exibidos até a nova resposta.
 * Pausa a atualização com a aba em segundo plano e atualiza ao voltar.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[], refreshMs?: number): ApiState<T> {
  const key = JSON.stringify(deps);
  const [stored, setStored] = useState<Stored<T>>({ key: null, data: undefined, error: null });
  const fetcherRef = useRef(fetcher);
  const keyRef = useRef(key);

  useEffect(() => {
    fetcherRef.current = fetcher;
    keyRef.current = key;
  });

  const load = useCallback(async (forKey: string) => {
    try {
      const data = await fetcherRef.current();
      if (forKey !== keyRef.current) return; // resposta antiga: filtros mudaram
      setStored({ key: forKey, data, error: null });
    } catch (err) {
      if (forKey !== keyRef.current) return;
      const error = err instanceof ApiError ? err : new ApiError(0, "unknown", "Algo deu errado. Tente novamente.");
      setStored((prev) => ({ key: forKey, data: prev.key === forKey ? prev.data : undefined, error }));
    }
  }, []);

  useEffect(() => {
    void load(key);
  }, [key, load]);

  useEffect(() => {
    if (!refreshMs) return;
    const tick = () => {
      if (document.visibilityState === "visible") void load(keyRef.current);
    };
    const id = window.setInterval(tick, refreshMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refreshMs, load]);

  const current = stored.key === key;
  return {
    data: current ? stored.data : undefined,
    error: current ? stored.error : null,
    loading: !current,
    reload: () => load(keyRef.current),
  };
}

/** Relógio que avança a cada `intervalMs` (para textos como "há 5 min"). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
