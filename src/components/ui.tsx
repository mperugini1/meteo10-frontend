"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { AlertIcon, RefreshIcon } from "@/components/icons";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:opacity-90",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-2",
  danger: "bg-surface text-crit border border-crit-border hover:bg-crit-bg",
  ghost: "text-ink-2 hover:bg-surface-2",
};

export function Button({
  variant = "primary",
  busy = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface p-4 sm:p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true" />;
}

export function LoadingCards({ count = 2, height = "h-64" }: { count?: number; height?: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={height} />
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-crit-border bg-crit-bg p-4 text-crit sm:flex-row sm:items-center">
      <AlertIcon className="shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshIcon size={16} /> Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      {icon && <div className="text-ink-3">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="max-w-md text-sm text-ink-3">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  const styles = {
    info: "border-line bg-surface-2 text-ink-2",
    success: "border-ok bg-ok-bg text-ok",
    error: "border-crit-border bg-crit-bg text-crit",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-sm font-medium", styles)}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink-2">
        {label}
      </label>
      {children(id, describedBy)}
      {hint && <p id={hintId} className="text-xs text-ink-3">{hint}</p>}
      {error && <p id={errorId} className="text-xs font-medium text-crit">{error}</p>}
    </div>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-ink-3 disabled:opacity-60 sm:text-sm";

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition disabled:opacity-60",
        checked ? "border-brand bg-brand" : "border-line bg-surface-2",
      )}
    >
      <span className={cx("inline-block h-5 w-5 rounded-full bg-surface shadow transition", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

/** Modal acessível com <dialog> nativo (foco preso e Esc para fechar). */
export function Modal({ open, title, onClose, children, dismissable = true }: { open: boolean; title: string; onClose: () => void; children: ReactNode; dismissable?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissable) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl"
    >
      {open && (
        <div className="p-5">
          <h2 id={titleId} className="mb-4 text-lg font-bold">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
