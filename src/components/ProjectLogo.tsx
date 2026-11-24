import { useId, type CSSProperties } from "react";

/**
 * Real app logo for an Agentic Security Systems project, with a subtle
 * per-logo animated effect (see the .logo-fx rules in index.css).
 * Effects intensify when an ancestor with the `group` class is hovered,
 * and are disabled for prefers-reduced-motion.
 */
interface ProjectLogoProps {
  src: string;
  className?: string;
}

const slugFromSrc = (src: string) => src.split("?")[0].split("/").pop()?.replace(/\.(png|svg)$/, "") ?? "";

const AetherMark = () => (
  // AETHER's CommandLogo from the app (hexagon + pulsing core), cropped to match the PNG framing.
  <svg viewBox="1.25 1.25 37.5 37.5" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path className="logo-fx-aether-hex" d="M20 4L34 11V29L20 36L6 29V11L20 4Z" stroke="#ff2d2d" strokeWidth="1.5" strokeLinejoin="round" />
    <circle className="logo-fx-aether-dot" cx="20" cy="20" r="2.5" fill="#ff2d2d" />
  </svg>
);

const ChaffMark = () => (
  // Chaff's sieve logo from the app, with the three grains drifting gently.
  <svg viewBox="2.2 4.7 19.6 19.6" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ color: "#f1f1f6" }}>
    <path d="M4 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 8l1.2 5a3 3 0 0 0 2.95 2.4h3.7A3 3 0 0 0 16.8 13L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle className="logo-fx-chaff-dot" cx="9" cy="11" r="0.9" fill="currentColor" />
    <circle className="logo-fx-chaff-dot" cx="12" cy="12" r="0.9" fill="currentColor" style={{ animationDelay: "-0.9s" }} />
    <circle className="logo-fx-chaff-dot" cx="15" cy="11" r="0.9" fill="currentColor" style={{ animationDelay: "-1.8s" }} />
    <path d="M12 15.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 21h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const KarmaMark = () => {
  // KARMA "Twin Helm": a Kubernetes heptagon formed by two segments (attack / fix) around a static cluster core.
  // Inline SVG so the slow segment rotation stays vector-crisp; ids are per-instance so hidden copies don't break gradients.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const a = `karmaA${uid}`, b = `karmaB${uid}`, c = `karmaC${uid}`;
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="logo-fx-karma-mark w-full h-full">
      <defs>
        <linearGradient id={a} gradientUnits="userSpaceOnUse" x1="30" y1="95" x2="70" y2="5">
          <stop offset="0" stopColor="#12307a" /><stop offset="1" stopColor="#326ce5" />
        </linearGradient>
        <linearGradient id={b} gradientUnits="userSpaceOnUse" x1="70" y1="95" x2="30" y2="5">
          <stop offset="0" stopColor="#326ce5" /><stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={c} gradientUnits="userSpaceOnUse" x1="50" y1="38" x2="50" y2="62">
          <stop offset="0" stopColor="#1e40af" /><stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <g className="logo-fx-karma-ring">
        <polyline points="71.67,24.44 78.15,27.55 85.10,58.01 65.62,82.43 41.25,82.43" fill="none" stroke={`url(#${a})`} strokeWidth="12.5" strokeLinejoin="miter" strokeMiterlimit="8" />
        <polyline points="29.12,75.84 14.90,58.01 21.85,27.55 50.00,14.00 57.88,17.80" fill="none" stroke={`url(#${b})`} strokeWidth="12.5" strokeLinejoin="miter" strokeMiterlimit="8" />
      </g>
      <polygon points="55.21,39.19 61.70,47.33 59.38,57.48 50.00,62.00 40.62,57.48 38.30,47.33 44.79,39.19" fill={`url(#${c})`} />
    </svg>
  );
};

const ProjectLogo = ({ src, className = "" }: ProjectLogoProps) => {
  const slug = slugFromSrc(src);
  return (
    <span
      className={`logo-fx logo-fx-${slug} relative inline-block select-none pointer-events-none ${className}`}
      aria-hidden="true"
      style={slug === "aegis" ? ({ ["--logo-mask" as string]: `url(${src})` } as CSSProperties) : undefined}
    >
      {slug === "aether" ? (
        <AetherMark />
      ) : slug === "chaff" ? (
        <ChaffMark />
      ) : slug === "karma" ? (
        <KarmaMark />
      ) : (
        <img src={src} alt="" draggable={false} loading="lazy" decoding="async" className="logo-fx-img w-full h-full object-contain" />
      )}
      {slug === "strata" && <span className="logo-fx-strata-core" />}
      {slug === "cirrus" && <span className="logo-fx-cirrus-ping" />}
      {slug === "aegis" && <span className="logo-fx-aegis-sheen" />}
      {slug === "aegis" && <span className="logo-fx-aegis-badge" />}
    </span>
  );
};

export default ProjectLogo;
