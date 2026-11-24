import type { CSSProperties, ReactNode, SVGProps } from "react";

/**
 * Custom line icons for the Agentic Security Systems carousel.
 * Each one is drawn from what the project's code actually does.
 * 24x24 grid, 1.75 stroke, round caps/joins, currentColor (set by the
 * per-project signature color), so they stay crisp from 24px to 48px.
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

/** CloudPilot AI: cloud with a pilot heading needle and an approval shield. */
export const CloudPilotIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M14 18.5H6.5a4 4 0 0 1-.4-7.98 6 6 0 0 1 11.6-1.2A4.5 4.5 0 0 1 21 13.5" />
    <path d="M15 10l-1.6 4.1L10 17l1.6-4.1z" />
    <path d="M18.5 15.2l2.6 1v1.9c0 1.6-1.1 2.6-2.6 3.1-1.5-.5-2.6-1.5-2.6-3.1v-1.9z" />
    <path d="M17.4 18.3l.8.8 1.4-1.5" />
  </IconBase>
);

/** STRATA: rock strata layers with an access key held behind a pause (approval) badge. */
export const StrataIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M3 12.5c3-1.5 6 1.5 9 0s6-1.5 9 0" />
    <path d="M3 16.5c3-1.5 6 1.5 9 0s6-1.5 9 0" />
    <path d="M3 20.5c3-1.5 6 1.5 9 0s6-1.5 9 0" />
    <circle cx="6" cy="6.5" r="2.2" />
    <path d="M8.2 6.5H14M12.4 6.5v1.8" />
    <circle cx="18.6" cy="6.5" r="2.8" />
    <path d="M17.8 5.3v2.4M19.4 5.3v2.4" />
  </IconBase>
);

/** Cirrus: wispy cirrus cloud over an audit checklist with a dashed diff row. */
export const CirrusIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M3 4.5c2.5-1.8 5-2 7.5-1s4.5.5 7-1" />
    <path d="M6.5 7h8.5c2 0 3.6-.6 5.5-2" />
    <rect x="6.5" y="10.5" width="11" height="11" rx="1.6" />
    <path d="M10 10.5V10a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v.5" />
    <path d="M9 14.6l1 1 1.9-2.1M13.8 14.8h1.8" />
    <path d="M9.2 18.4h6.2" strokeDasharray="1.6 1.6" />
  </IconBase>
);

/** Containment: a shield guarding a terminal prompt, flanked by gate bars. */
export const ContainmentIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M12 3l6.5 2.6v5.2c0 4.4-2.8 7.9-6.5 9.7-3.7-1.8-6.5-5.3-6.5-9.7V5.6z" />
    <path d="M9 9.8l2.3 1.9L9 13.6M12.6 14h2.6" />
    <path d="M2.2 6.5v11M21.8 6.5v11" />
  </IconBase>
);

/** Spectra AI: a prism splitting one beam into several rays (many tools, one assessment). */
export const SpectraIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M8 4l6 13H2z" />
    <path d="M1 8.6l4.3 1.6" />
    <path d="M11.3 11.3l10.2-3.8M11.8 12.4L22.5 11M12.3 13.5l8.7 1.5M12.8 14.6l6.7 3.9" />
  </IconBase>
);

/** AEGIS.ai: a heater shield holding code brackets, with a CVE alert badge on its corner. */
export const AegisIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M15.5 4H5v7c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V8" />
    <path d="M9.8 10.2l-2 2.4 2 2.4M14.2 10.2l2 2.4-2 2.4M12.8 9.6l-1.6 6" />
    <circle cx="19.5" cy="4.5" r="2.6" />
    <path d="M19.5 3.4v1.3M19.5 6.1v.01" />
  </IconBase>
);

/** ThreatLens: a lens aperture with ticks for the endpoints it discovers outside-in. */
export const ThreatLensIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="6" />
    <path d="M12 9.6l5.9 3.4M14.08 10.8v6.83M14.08 13.2l-5.92 3.41M12 14.4l-5.91-3.41M9.92 13.2V6.37M9.92 10.8l5.92-3.41" />
    <path d="M17.27 5.72l1.54-1.84M19.92 9.88l2.32-.62M19.71 14.8l2.25.83" />
  </IconBase>
);

/** AETHER: a falcon feather beside an endpoint screen with an approved check. */
export const AetherIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <rect x="2.5" y="7" width="11" height="8" rx="1" />
    <path d="M1.5 18.5h11" />
    <path d="M5.3 11.1l1.5 1.5 2.8-3" />
    <path d="M21.5 3c-4.5.5-7.6 3.6-8.6 8.4l-.6 3.4 3.4-.9c4.4-1.5 6.3-5.9 5.8-10.9z" />
    <path d="M10.5 21l8-11.5M17.6 9.6l-2.4.4" />
  </IconBase>
);

/** KARMA: a Kubernetes helm wheel inside a strike-and-return arrow (attack, then fix). */
export const KarmaIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="1.8" />
    <path d="M12 7l3.91 1.88.96 4.23-2.7 3.39H9.83l-2.7-3.39.96-4.23z" />
    <path d="M12 10.2V5M13.41 10.88l4.06-3.24M13.75 12.4l5.07 1.16M12.78 13.62l2.26 4.69M11.22 13.62l-2.26 4.69M10.25 12.4l-5.07 1.16M10.59 10.88L6.53 7.64" />
    <path d="M3.69 16.8A9.6 9.6 0 1 1 20.31 16.8" />
    <path d="M19.9 14.54l.41 2.26 2.16-.79" />
    <path d="M2.1 15.6l3.2 2.4" />
  </IconBase>
);

/** Chaff: a wheat stalk with its grain kept, and husk flecks drifting away (bots separated out). */
export const ChaffIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M9 21.5V9" />
    <path d="M9 3c1.3 1.3 1.3 3.7 0 5-1.3-1.3-1.3-3.7 0-5z" />
    <path d="M9 12.5c-1.9 0-3.4-1.5-3.6-3.6 1.9 0 3.4 1.5 3.6 3.6zM9 12.5c1.9 0 3.4-1.5 3.6-3.6-1.9 0-3.4 1.5-3.6 3.6z" />
    <path d="M14.5 9c1.2-1.2 2.8-1.4 3.9-1-1 1.2-2.7 1.4-3.9 1z" />
    <path d="M16.5 15c1.2-1 2.7-1.1 3.8-.6-1 1-2.6 1.1-3.8.6z" />
    <path d="M13.5 12.2h2.2M18.5 11.6h2.5M12.5 17.6h2" />
  </IconBase>
);

/** Traceveil: an evidence-pinned attack graph under a veil arc. */
export const TraceveilIcon = (props: AgenticIconProps) => (
  <IconBase {...props}>
    <path d="M3 7c5-4.5 13-4.5 18 0" />
    <circle cx="12" cy="10" r="2" />
    <circle cx="5.5" cy="18" r="2" />
    <circle cx="18.5" cy="18" r="2" />
    <path d="M10.8 11.6l-4.1 4.8M13.2 11.6l4.1 4.8M7.5 18h9" />
    <path d="M12 16.6v2.8M7.8 13.2l1.9 1.7M16.2 13.2l-1.9 1.7" />
  </IconBase>
);
