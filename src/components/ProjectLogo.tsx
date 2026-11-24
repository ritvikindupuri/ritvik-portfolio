import type { CSSProperties } from "react";

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

const KarmaMark = () => (
  // KARMA's header wheel from the app, inline so the slow spin stays vector-crisp.
  <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" className="logo-fx-karma-wheel w-full h-full">
    <circle cx="14" cy="14" r="11" fill="none" stroke="#326ce5" strokeWidth="2.4" />
    <circle cx="14" cy="14" r="11" fill="none" stroke="#3b82f6" strokeWidth="1.4" />
    {[
      [25, 14], [21.78, 21.78], [14, 25], [6.22, 21.78], [3, 14], [6.22, 6.22], [14, 3], [21.78, 6.22],
    ].map(([cx, cy]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="#326ce5" />
    ))}
    <g stroke="#326ce5" strokeWidth="0.6">
      <line x1="3" y1="14" x2="25" y2="14" />
      <line x1="14" y1="3" x2="14" y2="25" />
      <line x1="6.22" y1="6.22" x2="21.78" y2="21.78" />
      <line x1="6.22" y1="21.78" x2="21.78" y2="6.22" />
    </g>
  </svg>
);

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
