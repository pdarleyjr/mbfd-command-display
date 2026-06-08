/** Minimal inline icon set (no runtime dependency). Stroke-based, currentColor. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Flame = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2c2 3 1 5 0 6 3-1 4-3 4-5 3 3 4 7 4 10a8 8 0 1 1-16 0c0-3 2-6 5-8-1 2 0 4 2 5-2-3 0-6-1-8Z" />
  </Svg>
);
export const Truck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Svg>
);
export const Wrench = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 6a3.5 3.5 0 0 0 4.6 4.6L21 12l-7 7-2.4-2.4a3.5 3.5 0 0 1-4.6-4.6L4 10l7-7z" />
  </Svg>
);
export const Boxes = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8l4-2 4 2-4 2zM13 8l4-2 4 2-4 2zM8 16l4-2 4 2-4 2z" />
  </Svg>
);
export const Camera = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
);
export const Users = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
    <path d="M16 6a3 3 0 0 1 0 6M21 19c0-2-1-3.5-3-4.3" />
  </Svg>
);
export const Clock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
export const Activity = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </Svg>
);
export const AlertTriangle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20zM12 9v5M12 17h.01" />
  </Svg>
);
export const Anchor = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v13M5 13a7 7 0 0 0 14 0M5 13H3M19 13h2" />
  </Svg>
);
export const Signal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19v-4M10 19v-8M15 19v-12M20 19V5" />
  </Svg>
);
export const ShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
export const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const Grid = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
  </Svg>
);
export const MapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c5-5 7-8 7-11a7 7 0 1 0-14 0c0 3 2 6 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
export const Waves = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
  </Svg>
);
export const Refresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 4v4h-4" />
  </Svg>
);
export const Cpu = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </Svg>
);
export const ClipboardCheck = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9zM9 13l2 2 4-4" />
  </Svg>
);
