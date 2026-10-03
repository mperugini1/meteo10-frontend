// Ícones SVG inline (traço de 2px). Decorativos por padrão; passe `label` para torná-los acessíveis.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { label?: string; size?: number };

function Icon({ label, size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ThermometerIcon = (p: IconProps) => (
  <Icon {...p}><path d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z" /></Icon>
);
export const DropletIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 2.7s-6 6.4-6 11.3a6 6 0 0 0 12 0c0-4.9-6-11.3-6-11.3z" /></Icon>
);
export const GaugeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 14l4-4" /><path d="M3.3 17a9 9 0 1 1 17.4 0" /></Icon>
);
export const WindIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h16a3 3 0 1 1-3 3" /><path d="M3 16h7" /></Icon>
);
export const SproutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 21v-9" /><path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z" /><path d="M12 12c0-3 2.5-6 7-6 0 3.5-2.5 6-7 6z" /><path d="M7 21h10" /></Icon>
);
export const SunIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
);
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></Icon>
);
export const AlertOctagonIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z" /><path d="M12 8v4M12 16h.01" /></Icon>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></Icon>
);
export const SignalIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a5 5 0 0 1 7 0" /><path d="M12 19.5h.01" /></Icon>
);
export const SignalOffIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2 2l20 20" /><path d="M8.5 16a5 5 0 0 1 7 0" /><path d="M5 12.5a10 10 0 0 1 5.2-2.8" /><path d="M16.7 10.7A10 10 0 0 1 19 12.5" /><path d="M12 19.5h.01" /></Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Icon>
);
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></Icon>
);
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></Icon>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>
);
export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8" /><path d="M21 3v5h-5" /></Icon>
);
export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>
);
export const MapPinIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></Icon>
);

/** Bateria com preenchimento proporcional à porcentagem. */
export function BatteryIcon({ pct, size = 22, ...rest }: IconProps & { pct: number | null }) {
  const width = pct === null ? 0 : Math.max(1.5, (Math.min(100, Math.max(0, pct)) / 100) * 13);
  return (
    <Icon size={size} {...rest}>
      <rect x="2" y="7" width="17" height="10" rx="2" />
      <path d="M22 11v2" />
      {pct !== null && <rect x="4" y="9" width={width} height="6" rx="1" fill="currentColor" stroke="none" />}
    </Icon>
  );
}

/** Seta indicando para onde o vento sopra (direção de origem + 180°). */
export function WindArrow({ degrees, size = 28, label }: { degrees: number | null; size?: number; label?: string }) {
  if (degrees === null) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ transform: `rotate(${(degrees + 180) % 360}deg)` }}
      className="shrink-0 transition-transform"
    >
      <circle cx="12" cy="12" r="11" fill="none" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M12 4l4.5 10.5L12 12l-4.5 2.5z" fill="currentColor" />
      <path d="M12 12v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
