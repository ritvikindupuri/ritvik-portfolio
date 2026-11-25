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


const CirrusMark = () => (
  // Official Cirrus cloud-and-crosshair mark, traced from the app's 1024px logo so it stays vector-crisp.
  <svg viewBox="155 131 711 712" xmlns="http://www.w3.org/2000/svg" fill="none" className="w-full h-full">
    <g transform="translate(0 1024) scale(0.1 -0.1)" fill="#f1f1f6">
      <path d="M4950 7894 c-14 -2 -65 -9 -115 -15 -112 -13 -280 -56 -411 -104 -435 -161 -814 -516 -1024 -958 -103 -218 -153 -406 -175 -664 l-6 -72 38 -42 38 -42 12 129 c44 483 248 899 599 1222 272 251 653 420 1009 448 126 10 137 15 133 61 -3 36 -5 38 -38 39 -19 1 -46 0 -60 -2z M5177 7894 c-4 -4 -7 -22 -7 -41 0 -42 14 -48 139 -57 202 -15 371 -62 580 -162 149 -71 247 -134 369 -237 281 -237 507 -599 598 -958 28 -111 54 -285 54 -366 0 -28 4 -54 9 -57 5 -4 23 6 40 20 29 24 31 30 31 94 0 37 -9 121 -20 187 -124 730 -649 1321 -1346 1517 -133 37 -430 77 -447 60z M5087 7024 c-4 -4 -6 -247 -6 -541 0 -294 -3 -538 -6 -544 -4 -5 -23 -9 -44 -9 -59 0 -199 -39 -287 -80 -99 -46 -170 -97 -250 -181 -77 -82 -117 -140 -164 -242 -41 -90 -55 -140 -66 -235 -4 -34 -10 -65 -15 -67 -4 -3 -271 -5 -593 -5 -363 0 -587 -4 -591 -10 -3 -5 -1 -19 5 -30 10 -19 20 -20 271 -20 221 0 260 2 265 15 6 15 49 12 69 -6 5 -5 138 -9 296 -9 l286 0 6 -64 c8 -88 60 -240 112 -328 52 -90 157 -204 240 -264 112 -79 273 -142 413 -159 l52 -7 1 -241 c0 -133 1 -447 2 -697 l2 -455 25 0 25 0 2 450 c1 248 2 561 2 697 l1 247 58 6 c202 23 397 117 528 257 129 137 204 293 228 477 l12 86 285 -4 c253 -3 289 -2 311 13 22 15 27 15 38 1 11 -13 53 -15 281 -15 l269 0 0 30 c0 30 0 30 -58 30 -31 0 -154 1 -272 1 -118 1 -356 1 -529 1 -172 -1 -317 1 -321 3 -4 3 -11 31 -15 62 -22 191 -100 353 -235 491 -135 139 -311 222 -542 257 l-38 6 0 544 0 545 -23 0 c-13 0 -27 -3 -30 -6z m-7 -1343 c0 -124 4 -202 10 -206 6 -3 19 -3 30 0 19 6 20 15 20 206 l0 199 38 0 c92 0 263 -60 377 -132 136 -86 267 -261 318 -423 24 -77 41 -185 30 -196 -5 -5 -107 -10 -228 -11 l-220 -3 0 -25 0 -25 228 0 c203 0 227 -2 227 -16 0 -9 -7 -56 -15 -104 -59 -337 -351 -613 -682 -644 l-73 -7 0 204 0 203 -27 -3 -28 -3 -3 -199 -2 -199 -73 6 c-146 11 -331 101 -447 216 -123 123 -194 251 -230 412 -33 147 -54 134 215 134 l230 0 0 25 0 25 -230 5 -230 5 3 45 c10 175 126 397 272 519 127 107 313 183 463 190 l27 1 0 -199z M5046 5149 c-35 -41 -34 -83 3 -120 75 -74 189 11 139 104 -17 34 -39 46 -80 47 -28 0 -42 -7 -62 -31z M5456 6273 c-11 -11 -6 -72 7 -80 6 -4 39 -17 72 -28 87 -31 189 -87 275 -151 102 -77 141 -115 214 -209 78 -100 125 -179 162 -272 l29 -73 39 0 c38 0 38 1 32 31 -3 17 -23 68 -45 114 -122 261 -329 470 -591 597 -77 38 -187 78 -194 71z M4654 6236 c-244 -100 -431 -246 -575 -448 -52 -73 -141 -249 -153 -300 -6 -27 -5 -28 35 -28 33 0 42 4 46 21 12 45 93 197 140 264 131 184 308 324 511 406 43 17 87 35 100 40 17 7 22 17 22 44 0 45 -17 45 -126 1z M3005 6073 c-246 -44 -471 -161 -657 -341 -157 -152 -277 -343 -342 -545 -84 -259 -80 -567 10 -843 26 -81 131 -302 162 -341 24 -30 119 -37 114 -8 -2 10 -16 34 -32 54 -46 58 -126 219 -160 321 -45 135 -74 338 -66 464 37 597 446 1058 1025 1156 62 11 116 21 118 24 6 6 -70 76 -82 75 -5 -1 -46 -8 -90 -16z M7066 6054 c-25 -24 -34 -39 -27 -44 7 -3 55 -12 107 -19 388 -51 732 -303 910 -666 59 -121 97 -242 113 -359 16 -111 13 -299 -4 -402 -29 -165 -110 -371 -197 -500 -55 -82 -55 -84 2 -84 47 0 50 2 80 46 76 109 159 316 196 485 29 131 27 441 -4 564 -66 260 -177 460 -357 641 -96 96 -230 196 -335 249 -71 36 -247 95 -314 105 -34 5 -77 12 -96 15 -30 5 -40 1 -74 -31z M3915 4741 c-3 -5 -1 -12 4 -15 4 -3 11 -19 15 -36 9 -47 88 -200 148 -287 71 -104 225 -257 330 -326 120 -80 335 -176 359 -161 5 3 9 18 9 35 0 32 6 28 -140 90 -270 114 -496 348 -612 632 -32 77 -32 77 -69 77 -21 0 -40 -4 -44 -9z M6184 4653 c-115 -284 -380 -543 -653 -638 l-81 -28 0 -40 c0 -38 1 -39 28 -32 45 11 171 64 231 96 212 116 405 318 511 535 34 69 80 185 80 201 0 1 -17 3 -38 3 l-39 0 -39 -97z M7891 3889 c-50 -9 -62 -16 -130 -83 -135 -130 -261 -209 -431 -270 -167 -60 -122 -58 -1300 -66 l-95 -1 -168 -164 -168 -165 -155 0 c-151 0 -155 0 -163 -22 -5 -15 -4 -26 3 -30 15 -10 298 -9 359 1 39 6 56 17 90 52 23 24 88 88 144 142 l102 99 573 2 c412 1 590 6 633 15 157 32 325 103 469 198 81 54 280 247 288 281 4 12 5 21 5 21 -1 -1 -27 -5 -56 -10z M2285 3869 c-4 -5 17 -36 46 -67 198 -212 405 -332 684 -398 60 -14 156 -17 665 -21 l595 -4 147 -146 147 -146 188 -1 188 -1 3 28 3 27 -153 0 -153 0 -167 165 -167 165 -123 1 c-68 1 -334 2 -593 4 -515 3 -558 7 -713 64 -168 61 -292 139 -438 275 -64 59 -76 66 -112 66 -23 0 -44 -5 -47 -11z" />
    </g>
    <circle cx="510.5" cy="514.4" r="8" fill="#3b82f6" />
  </svg>
);

const KarmaMark = () => {
  // KARMA "Twin Helm": a Kubernetes heptagon formed by two segments (attack / fix) around a static cluster core.
  // Inline SVG so the slow segment rotation stays vector-crisp; ids are per-instance so hidden copies don't break gradients.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const a = `karmaA${uid}`, b = `karmaB${uid}`, c = `karmaC${uid}`;
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="logo-fx-karma-mark w-full h-full" shapeRendering="geometricPrecision">
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
      ) : slug === "cirrus" ? (
        <CirrusMark />
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
