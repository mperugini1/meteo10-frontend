"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { WindUnit } from "@/lib/format";

const KEY = "meteo10.windUnit";
const listeners = new Set<() => void>();
// Cópia em memória para quando o armazenamento do navegador estiver bloqueado
let memory: WindUnit = "ms";

function read(): WindUnit {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === "kmh" || stored === "ms" ? stored : memory;
  } catch {
    return memory;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Preferência do usuário para exibir o vento em m/s ou km/h (guardada no navegador). */
export function useWindUnit(): [WindUnit, (unit: WindUnit) => void] {
  const unit = useSyncExternalStore(subscribe, read, () => "ms" as WindUnit);
  const setUnit = useCallback((next: WindUnit) => {
    memory = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // armazenamento indisponível: vale a cópia em memória
    }
    listeners.forEach((l) => l());
  }, []);
  return [unit, setUnit];
}
