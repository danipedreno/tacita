/* Opoempollo, la mascota: un pollito redondo con tupé (basado en «Hand drawn flat design kawaii face collection»
   de Freepik), redibujado en SVG con la paleta de la app. Cambia de cara según el momento y parpadea solo.
   Lienzo de 200×200 con el suelo en y≈186. */
import { useId } from "react";

export const POLLO = {
  body: "#ffe1a6", // crema mantequilla
  shade: "#f6c38f", // melocotón (sombras)
  light: "#fff6e0",
  feet: "#ff8ac8", // rosa de la app
  feetDark: "#e85fa8",
  cheek: "#ffb3d9",
  tongue: "#ff9cc9",
  line: "#3a2418", // contorno tinta cálida
  shadow: "#e7dccb",
};

const SW = 4.4; // grosor del contorno
const line = { stroke: POLLO.line, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

const L = 76; // ojo izquierdo
const R = 124; // ojo derecho
const EY = 117; // altura de los ojos
const MY = 129; // altura de la boca

/** Ojos ovalados con brillo (parpadean). */
const Oval = ({ x, blink, big = false, look = [0, 0] }) => {
  const rx = big ? 8.5 : 6.6;
  const ry = big ? 11 : 9;
  return (
    <g className={blink ? "mascot-eye" : undefined} style={blink ? { animationDelay: blink } : undefined}>
      <ellipse cx={x + look[0] * 3} cy={EY + look[1] * 3} rx={rx} ry={ry} fill={POLLO.line} />
      <ellipse cx={x + look[0] * 3 + rx * 0.3} cy={EY + look[1] * 3 - ry * 0.35} rx={rx * 0.36} ry={ry * 0.32} fill="#fff" />
    </g>
  );
};

const happyEye = (x, dir) => <path d={`M${x - 8 * dir} ${EY - 8}L${x + 6 * dir} ${EY}L${x - 8 * dir} ${EY + 8}`} {...line} strokeWidth={SW + 0.6} />;
const arcUp = (x) => <path d={`M${x - 8} ${EY + 3}Q${x} ${EY - 9} ${x + 8} ${EY + 3}`} {...line} strokeWidth={SW + 0.6} />;
const arcDown = (x) => <path d={`M${x - 8} ${EY - 2}Q${x} ${EY + 8} ${x + 8} ${EY - 2}`} {...line} strokeWidth={SW + 0.6} />;
const star = (x) => (
  <path
    d={`M${x} ${EY - 11}Q${x + 1.6} ${EY - 1.6} ${x + 10} ${EY}Q${x + 1.6} ${EY + 1.6} ${x} ${EY + 11}Q${x - 1.6} ${EY + 1.6} ${x - 10} ${EY}Q${x - 1.6} ${EY - 1.6} ${x} ${EY - 11}Z`}
    fill={POLLO.line}
    stroke={POLLO.line}
    strokeWidth={2}
    strokeLinejoin="round"
  />
);

/** Bocas. */
const MOUTHS = {
  smile: <path d={`M${92} ${MY}Q${100} ${MY + 9} ${108} ${MY}`} {...line} />,
  open: (
    <g>
      <path d={`M88 ${MY - 3}Q94 ${MY} 100 ${MY - 3}Q106 ${MY} 112 ${MY - 3}Q113 ${MY + 13} 100 ${MY + 13}Q87 ${MY + 13} 88 ${MY - 3}Z`} fill={POLLO.line} stroke={POLLO.line} strokeWidth={2.4} strokeLinejoin="round" />
      <path d={`M92.5 ${MY + 8}Q100 ${MY + 2.5} 107.5 ${MY + 8}Q105 ${MY + 12} 100 ${MY + 12}Q95 ${MY + 12} 92.5 ${MY + 8}Z`} fill={POLLO.tongue} />
    </g>
  ),
  tongue: (
    <g>
      <path d={`M90 ${MY - 4}H110`} {...line} />
      <path d={`M94 ${MY - 4}V${MY + 6}Q94 ${MY + 11} 100 ${MY + 11}Q106 ${MY + 11} 106 ${MY + 6}V${MY - 4}`} fill={POLLO.tongue} stroke={POLLO.line} strokeWidth={SW - 0.8} strokeLinejoin="round" />
    </g>
  ),
  o: <ellipse cx={100} cy={MY + 3} rx={4.6} ry={6} fill={POLLO.line} />,
  small: <path d={`M96 ${MY + 1}Q100 ${MY + 5} 104 ${MY + 1}`} {...line} />,
  kiss: <path d={`M98 ${MY - 7}Q105 ${MY - 4} 99 ${MY}Q105 ${MY + 4} 98 ${MY + 7}`} {...line} />,
  tri: <path d={`M100 ${MY - 5}L105 ${MY + 7}H95Z`} fill={POLLO.tongue} stroke={POLLO.line} strokeWidth={SW - 1.2} strokeLinejoin="round" />,
  flat: <path d={`M94 ${MY + 2}L106 ${MY - 1}`} {...line} />,
};

/** Caras disponibles (las de la hoja de expresiones, sin las de enfado). */
const FACES = {
  open: (b, look) => [<Oval key="l" x={L} blink={b} look={look} />, <Oval key="r" x={R} blink={b} look={look} />, MOUTHS.open],
  happy: () => [happyEye(L, 1), happyEye(R, -1), MOUTHS.open],
  smile: (b, look) => [<Oval key="l" x={L} blink={b} look={look} />, <Oval key="r" x={R} blink={b} look={look} />, MOUTHS.smile],
  joy: () => [arcUp(L), arcUp(R), MOUTHS.open],
  wink: (b, look) => [<Oval key="l" x={L} blink={b} look={look} />, arcUp(R), MOUTHS.tongue],
  tongue: (b, look) => [<Oval key="l" x={L} blink={b} look={look} />, <Oval key="r" x={R} blink={b} look={look} />, MOUTHS.tongue],
  surprised: (b, look) => [<Oval key="l" x={L} big look={look} />, <Oval key="r" x={R} big look={look} />, MOUTHS.o],
  sparkle: () => [star(L), star(R), MOUTHS.tri],
  kiss: (b, look) => [<Oval key="l" x={L} blink={b} look={look} />, <Oval key="r" x={R} blink={b} look={look} />, MOUTHS.kiss, <path key="h" d="M116 133c-3-5 4-8 6-3 2-5 9-2 6 3l-6 6z" fill={POLLO.feet} />],
  sleepy: () => [arcDown(L), arcDown(R), MOUTHS.small],
  meh: (b, look) => [
    <g key="l">
      <Oval x={L} look={[look[0], 0.5]} />
      <path d={`M${L - 10} ${EY - 3}H${L + 10}`} {...line} strokeWidth={SW + 1} />
    </g>,
    <g key="r">
      <Oval x={R} look={[look[0], 0.5]} />
      <path d={`M${R - 10} ${EY - 3}H${R + 10}`} {...line} strokeWidth={SW + 1} />
    </g>,
    MOUTHS.flat,
  ],
};
// Equivalencias con las caras de los otros personajes.
FACES.dots = FACES.smile;
FACES.flat = FACES.meh;
FACES.dead = FACES.sleepy;
export const POLLO_FACES = Object.keys(FACES);

/** El pollito como grupo SVG dentro de un lienzo de 200×200 (para meterlo en otros SVG). */
export function PolloShape({ face = "open", blink, look = [0, 0], shadow = true, uid = "p", feet = true }) {
  const clip = `pollo-body-${uid}`;
  const body = "M100 41C146 41 184 92 184 136C184 167 160 181 100 181C40 181 16 167 16 136C16 92 54 41 100 41Z";
  const f = (FACES[face] || FACES.open)(blink, look);
  return (
    <g>
      {shadow && <ellipse cx="100" cy="186" rx="80" ry="8" fill={POLLO.shadow} />}
      <defs>
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
      </defs>
      {/* cuerpo y sombras de la barriga */}
      <path d={body} fill={POLLO.body} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx="66" cy="172" rx="34" ry="30" fill={POLLO.shade} />
        <ellipse cx="134" cy="172" rx="34" ry="30" fill={POLLO.shade} />
        <ellipse cx="128" cy="62" rx="22" ry="14" fill={POLLO.shade} opacity="0.75" />
      </g>
      <path d={body} {...line} />
      {/* tupé: dos bolitas y el rizo que entra en la cabeza */}
      <path d="M84 49C78 34 86 20 99 20C111 20 117 31 112 39C124 36 133 45 130 56C127 65 117 69 106 68" fill={POLLO.body} />
      <path d="M84 49C78 34 86 20 99 20C111 20 117 31 112 39C124 36 133 45 130 56C127 65 117 69 106 68" {...line} />
      <ellipse cx="97" cy="29" rx="7" ry="4.6" fill={POLLO.light} transform="rotate(-22 97 29)" />
      <ellipse cx="120" cy="47" rx="5.6" ry="3.8" fill={POLLO.light} transform="rotate(-22 120 47)" />
      {/* mofletes */}
      <ellipse cx="52" cy="128" rx="11" ry="7" fill={POLLO.cheek} stroke={POLLO.line} strokeWidth={SW - 1.2} />
      <ellipse cx="148" cy="128" rx="11" ry="7" fill={POLLO.cheek} stroke={POLLO.line} strokeWidth={SW - 1.2} />
      {/* cara */}
      {f}
      {/* patitas */}
      {feet && [70, 130].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="173" rx="18" ry="21" fill={POLLO.feet} />
          <path d={`M${x - 17.5} ${176}Q${x} ${184} ${x + 17.5} ${176}Q${x + 15} ${193} ${x} ${194}Q${x - 15} ${193} ${x - 17.5} ${176}Z`} fill={POLLO.feetDark} />
          <ellipse cx={x} cy="173" rx="18" ry="21" {...line} />
        </g>
      ))}
    </g>
  );
}

/** <Pollo face="happy" className="w-32" /> */
export function Pollo({ face = "open", look, className = "", title, blink = "0s", shadow = true }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 8 200 190" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <PolloShape face={face} look={look} blink={blink} shadow={shadow} uid={uid} />
    </svg>
  );
}

/* ---------- Huevos del camino de Aprende ----------
   Lección sin hacer: huevo dormido · siguiente: huevo despierto que se tambalea · hecha: el pollito ya ha salido
   y está sentado en media cáscara (con caras distintas). `hatch` anima el momento de romper el cascarón. */
const EGG = "M100 22C138 22 172 78 172 130C172 174 141 198 100 198C59 198 28 174 28 130C28 78 62 22 100 22Z";
const ZIG = "L172 150L158 138L142 154L126 136L110 154L94 136L78 154L62 138L44 154L28 142";
const SHELL_BOTTOM = `M0 220H200V150${ZIG}L0 142Z`;
const SHELL_TOP = `M0 0H200V150${ZIG}L0 142Z`;
const SPECKS = [
  [70, 70, 7],
  [128, 92, 5],
  [58, 158, 5],
  [140, 166, 8],
  [104, 52, 4],
];
const DONE_FACES = ["happy", "joy", "smile", "wink", "tongue", "sparkle", "kiss", "open"];
export const doneFace = (i) => DONE_FACES[i % DONE_FACES.length];

const Crown = ({ y = 0 }) => (
  <path d={`M76 ${y + 26}L72 ${y}L88 ${y + 12}L100 ${y - 6}L112 ${y + 12}L128 ${y}L124 ${y + 26}Z`} fill="#ffcf5c" stroke={POLLO.line} strokeWidth={SW - 0.8} strokeLinejoin="round" />
);

function Shell({ clip, uid, tint, muted }) {
  return (
    <g clipPath={`url(#${clip}-${uid})`}>
      <path d={EGG} fill={muted ? "#efe6d6" : "#fffaf0"} />
      {SPECKS.map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill={tint} opacity={muted ? 0.35 : 0.6} />
      ))}
      <ellipse cx="72" cy="64" rx="10" ry="17" fill="#fff" opacity={muted ? 0.5 : 0.9} transform="rotate(24 72 64)" />
      <path d={EGG} {...line} />
    </g>
  );
}

/** Huevo (lección sin hacer o siguiente). state: "sleep" | "awake". */
export function Huevo({ state = "sleep", tint = POLLO.shade, crown = false, className = "", blink = "0s" }) {
  const uid = useId().replace(/:/g, "");
  const awake = state === "awake";
  return (
    <svg viewBox="0 -14 200 222" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`all-${uid}`}>
          <rect x="0" y="-20" width="200" height="240" />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="200" rx="58" ry="7" fill={POLLO.shadow} />
      <g className={awake ? "egg-wobble" : undefined}>
        <Shell clip="all" uid={uid} tint={tint} muted={!awake} />
        <g transform="translate(0 14)">
          <ellipse cx="58" cy="128" rx="10" ry="6.5" fill={POLLO.cheek} opacity={awake ? 1 : 0.6} />
          <ellipse cx="142" cy="128" rx="10" ry="6.5" fill={POLLO.cheek} opacity={awake ? 1 : 0.6} />
          {awake ? (FACES.smile(blink, [0, -0.6])) : FACES.sleepy()}
        </g>
        {crown && <Crown y={6} />}
      </g>
    </svg>
  );
}

/** El pollito ya fuera del huevo, sentado en media cáscara. `hatch`: anima la salida. */
export function PolloEnHuevo({ face = "happy", tint = POLLO.shade, crown = false, hatch = false, className = "" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 -14 200 222" className={`overflow-visible ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={`bot-${uid}`}>
          <path d={SHELL_BOTTOM} />
        </clipPath>
        <clipPath id={`top-${uid}`}>
          <path d={SHELL_TOP} />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="200" rx="62" ry="7" fill={POLLO.shadow} />
      <g className={hatch ? "hatch-chick" : undefined}>
        <g transform="translate(14 0) scale(0.86)">
          <PolloShape face={face} shadow={false} uid={uid} feet={false} />
          {crown && <Crown y={-4} />}
        </g>
      </g>
      <g className={hatch ? "hatch-shell" : undefined}>
        <Shell clip="bot" uid={uid} tint={tint} />
      </g>
      {hatch && (
        <g className="hatch-top">
          <Shell clip="top" uid={uid} tint={tint} />
        </g>
      )}
    </svg>
  );
}
