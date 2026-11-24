import type { CSSProperties, ReactNode, SVGProps } from "react";

/**
 * Custom line icons for the Agentic Security Systems carousel.
 * Each one is drawn from what the project's code actually does.
 * 24x24 grid, 1.75 stroke, round caps/joins, currentColor (set by the
 * per-project signature color), so they stay crisp from 24px to 48px.
 * Lucide-style: one stroke weight, no fills, no badges, 2-4 primitives each.
 */
export interface AgenticIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  className?: string;
  style?: CSSProperties;
}

const IconBase = ({ children, ...props }: AgenticIconProps & { children: ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

/** CloudPilot AI: a cloud with a compass heading needle. */
export const CloudPilotIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    <path d="M12 9.5l-1.58 3.77L7 15.5l1.58-3.77Z" />
  </IconBase>
);

/** STRATA: three wavy rock strata with a small access key above them. */
export const StrataIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <circle cx="7" cy="5.5" r="2" />
    <path d="M9 5.5h6.5M13.5 5.5v2" />
    <path d="M3 11.5c2.5-1.5 5.5 1.5 9 0s6.5-1.5 9 0M3 15.5c2.5-1.5 5.5 1.5 9 0s6.5-1.5 9 0M3 19.5c2.5-1.5 5.5 1.5 9 0s6.5-1.5 9 0" />
  </IconBase>
);

/** Cirrus: a wispy cirrus line over an audit checklist. */
export const CirrusIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M4 4.5c2-1.3 4-1.3 6 0s4 1.3 6 0c1.3-.9 2.7-1.1 4-.6" />
    <rect x="5" y="8" width="14" height="13" rx="2" />
    <path d="m8.5 12.5 1.5 1.5 3-3" />
    <path d="M8.5 17.5h7" />
  </IconBase>
);

/** Containment: a shield guarding a terminal prompt. */
export const ContainmentIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
    <path d="m8.5 9.5 2.5 2.5-2.5 2.5" />
    <path d="M13 15h3" />
  </IconBase>
);

/** Spectra AI: a prism fanning one assessment into three rays. */
export const SpectraIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M8.5 5l6 12h-12Z" />
    <path d="M12.3 9l8.7-3.5M13.3 11h8.2M14.3 13l6.7 3.5" />
  </IconBase>
);

/** AEGIS.ai: a flat-topped shield holding code brackets. */
export const AegisIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M4 4h16v7c0 5.5-3.5 8.5-8 10.5C7.5 19.5 4 16.5 4 11Z" />
    <path d="m9.5 9-2.5 3 2.5 3M14.5 9l2.5 3-2.5 3" />
    <path d="m13 8.5-2 7" />
  </IconBase>
);

/** ThreatLens: a six-blade lens aperture. */
export const ThreatLensIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m14.31 8 5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16 3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
  </IconBase>
);

/** AETHER: a falcon feather. */
export const AetherIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M20 4C13 4 8 8.5 8 16c7.5 0 12-5 12-12Z" />
    <path d="M4 20 15 9" />
  </IconBase>
);

/** KARMA: a seven-spoke Kubernetes helm wheel. */
export const KarmaIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="6.5" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12.00 9.80L12.00 2.50M13.72 10.63L19.43 6.08M14.14 12.49L21.26 14.11M12.95 13.98L16.12 20.56M11.05 13.98L7.88 20.56M9.86 12.49L2.74 14.11M10.28 10.63L4.57 6.08" />
  </IconBase>
);

/** Chaff: a wheat stalk with its grain. */
export const ChaffIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M12 21.5V8.5" />
    <path d="M12 3c1.5 1.5 1.5 4 0 5.5-1.5-1.5-1.5-4 0-5.5Z" />
    <path d="M12 12.5c-2.2 0-4-1.8-4-4 2.2 0 4 1.8 4 4Zm0 0c2.2 0 4-1.8 4-4-2.2 0-4 1.8-4 4ZM12 17c-2.2 0-4-1.8-4-4 2.2 0 4 1.8 4 4Zm0 0c2.2 0 4-1.8 4-4-2.2 0-4 1.8-4 4Z" />
  </IconBase>
);

/** Traceveil: a three-node evidence graph. */
export const TraceveilIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="5" r="2.5" />
    <circle cx="5.5" cy="18" r="2.5" />
    <circle cx="18.5" cy="18" r="2.5" />
    <path d="M10.88 7.24 6.62 15.76M13.12 7.24l4.26 8.52M8 18h8" />
  </IconBase>
);
