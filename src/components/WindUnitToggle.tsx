"use client";

import { cx } from "@/components/ui";
import { useWindUnit } from "@/hooks/useWindUnit";
import type { WindUnit } from "@/lib/format";

const OPTIONS: Array<{ value: WindUnit; label: string }> = [
  { value: "ms", label: "m/s" },
  { value: "kmh", label: "km/h" },
];

export function WindUnitToggle() {
  const [unit, setUnit] = useWindUnit();
  return (
    <div role="radiogroup" aria-label="Unidade do vento" className="inline-flex rounded-xl border border-line bg-surface p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={unit === option.value}
          onClick={() => setUnit(option.value)}
          className={cx(
            "min-h-9 rounded-lg px-3 text-sm font-semibold",
            unit === option.value ? "bg-brand text-brand-ink" : "text-ink-2 hover:bg-surface-2",
          )}
        >
          Vento em {option.label}
        </button>
      ))}
    </div>
  );
}
