/* Fotos de perfil: cada persona es un animal (el pollito es la mascota del juego, no un jugador).
   Basados en las colecciones «Hand drawn kawaii face collection» de Freepik y redibujados en SVG con el mismo
   trazo que el pollo y los colores de la app. Lienzo de 200×200. */
import { useId } from "react";
import { Mascot } from "./mascots.jsx";
import { POLLO } from "./pollo.jsx";

const INK = POLLO.line;
const SW = 4.4;
const line = { stroke: INK, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
const CREAM = "#fff3d6";
const CHEEK = "#ffb3d9";

const L = 72;
const R = 128;

/* Ojos y bocas comunes. `ey`/`my`: altura de ojos y boca de cada animal. */
const Dot = ({ x, ey, blink }) => (
  <g className={blink ? "mascot-eye" : undefined} style={blink ? { animationDelay: blink } : undefined}>
    <ellipse cx={x} cy={ey} rx={7} ry={8.6} fill={INK} />
    <ellipse cx={x + 2.2} cy={ey - 3} rx={2.6} ry={2.8} fill="#fff" />
  </g>
);
const Squint = ({ x, ey, dir }) => <path d={`M${x - 8 * dir} ${ey - 8}L${x + 6 * dir} ${ey}L${x - 8 * dir} ${ey + 8}`} {...line} strokeWidth={SW + 0.6} />;
const OpenMouth = ({ my }) => (
  <g>
    <path d={`M89 ${my - 2}H111Q111 ${my + 14} 100 ${my + 14}Q89 ${my + 14} 89 ${my - 2}Z`} fill={INK} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
    <path d={`M93 ${my + 9}Q100 ${my + 4} 107 ${my + 9}Q105 ${my + 13} 100 ${my + 13}Q95 ${my + 13} 93 ${my + 9}Z`} fill="#ff8fb3" />
  </g>
);
const CatMouth = ({ my }) => <path d={`M88 ${my}Q94 ${my + 7} 100 ${my}Q106 ${my + 7} 112 ${my}`} {...line} />;

function Face({ face, ey, my, blink, mouth = "open" }) {
  const eyes =
    face === "happy" ? (
      <>
        <Squint x={L} ey={ey} dir={1} />
        <Squint x={R} ey={ey} dir={-1} />
      </>
    ) : (
      <>
        <Dot x={L} ey={ey} blink={blink} />
        <Dot x={R} ey={ey} blink={blink} />
      </>
    );
  return (
    <>
      <ellipse cx={L - 22} cy={ey + 14} rx={11} ry={7} fill={CHEEK} />
      <ellipse cx={R + 22} cy={ey + 14} rx={11} ry={7} fill={CHEEK} />
      {eyes}
      {mouth === "cat" && face !== "happy" ? <CatMouth my={my} /> : <OpenMouth my={my} />}
    </>
  );
}

/* Conejo (Claudia): blanco, orejas largas con el interior rosa de la app. */
function Conejo({ face, blink }) {
  const head = "M100 66C148 66 182 116 182 148C182 176 160 186 100 186C40 186 18 176 18 148C18 116 52 66 100 66Z";
  return (
    <g>
      {[
        [70, -14, "#f8d8fd"],
        [130, 14, "#ed91fa"],
      ].map(([x, rot, inner]) => (
        <g key={x} transform={`rotate(${rot} ${x} 70)`}>
          <ellipse cx={x} cy={42} rx={18} ry={40} fill="#fff" />
          <ellipse cx={x} cy={46} rx={8.5} ry={27} fill={inner} />
          <ellipse cx={x} cy={42} rx={18} ry={40} {...line} />
        </g>
      ))}
      <path d={head} fill="#fff" />
      <path d={head} {...line} />
      {/* el «ω» de la frente, como en el original */}
      <path d="M86 92Q93 101 100 92Q107 101 114 92" {...line} strokeWidth={SW - 0.6} />
      <Face face={face} ey={134} my={146} blink={blink} />
    </g>
  );
}

/* Zorrito tipo shiba (Zaida): amarillo de la app, hocico y cejas crema. */
function Zorro({ face, blink }) {
  const head = "M28 116C28 76 60 60 100 60C140 60 172 76 172 116C184 148 172 184 100 184C28 184 16 148 28 116Z";
  return (
    <g>
      {[1, -1].map((d) => (
        <g key={d} transform={d === -1 ? "translate(200 0) scale(-1 1)" : undefined}>
          <path d="M36 100L44 38Q47 26 58 32L100 66Z" fill="#ffc828" />
          <path d="M48 88L53 50Q55 44 61 48L84 68Z" fill={CREAM} />
          <path d="M36 100L44 38Q47 26 58 32L100 66" {...line} />
        </g>
      ))}
      <path d={head} fill="#ffc828" />
      <path d={head} {...line} />
      <ellipse cx="100" cy="156" rx="32" ry="23" fill={CREAM} />
      <ellipse cx={L} cy={112} rx={6} ry={4} fill={CREAM} />
      <ellipse cx={R} cy={112} rx={6} ry={4} fill={CREAM} />
      <ellipse cx="100" cy="142" rx="6" ry="4.4" fill={INK} />
      <Face face={face} ey={130} my={148} blink={blink} mouth="cat" />
    </g>
  );
}

/* Perrito tipo chihuahua (Dani): coral de la app, orejas grandes y hocico crema. */
function Perro({ face, blink }) {
  const head = "M100 66C152 66 180 104 180 140C180 172 154 188 100 188C46 188 20 172 20 140C20 104 48 66 100 66Z";
  return (
    <g>
      {[1, -1].map((d) => (
        <g key={d} transform={d === -1 ? "translate(200 0) scale(-1 1)" : undefined}>
          <path d="M30 116C4 92 -4 40 14 26C30 14 68 46 84 74Z" fill="#ff614c" />
          <path d="M34 102C16 84 12 50 22 42C32 34 58 56 70 76Z" fill="#ffc0b3" />
          <path d="M30 116C4 92 -4 40 14 26C30 14 68 46 84 74" {...line} />
        </g>
      ))}
      <path d={head} fill="#ff614c" />
      <path d={head} {...line} />
      <path d="M100 118C122 118 134 140 134 160C134 180 120 186 100 186C80 186 66 180 66 160C66 140 78 118 100 118Z" fill={CREAM} />
      <ellipse cx="100" cy="140" rx="6.4" ry="4.6" fill={INK} />
      <Face face={face} ey={124} my={148} blink={blink} mouth="cat" />
    </g>
  );
}

export const AVATARS = {
  claudia: { name: "Conejo", Draw: Conejo, color: "#f8d8fd" },
  zaida: { name: "Zorrito", Draw: Zorro, color: "#fff0bd" },
  dani: { name: "Perrito", Draw: Perro, color: "#ffd6cc" },
};

/**
 * Foto de perfil redonda: <Avatar user="dani" className="w-10 h-10" />.
 * face: "open" (por defecto) | "happy". Sin animal asignado, sale el personaje generado de antes.
 */
export function Avatar({ user = "", face = "open", ring = true, className = "", title }) {
  const a = AVATARS[user.toLowerCase()];
  const clip = `av-${useId().replace(/:/g, "")}`;
  if (!a) return <Mascot name={`user-${user}`} fit="center" className={className} title={title} />;
  const { Draw } = a;
  const blink = `${(user.length * 0.37) % 3}s`;
  return (
    <svg viewBox="0 0 200 200" className={`rounded-full ${className}`} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <clipPath id={clip}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="100" fill={a.color} />
      <g clipPath={`url(#${clip})`}>
      <g transform="translate(100 108) scale(0.84) translate(-100 -110)">
        <Draw face={face} blink={blink} />
      </g>
      </g>
      {ring && <circle cx="100" cy="100" r="97.5" fill="none" stroke={INK} strokeWidth="5" />}
    </svg>
  );
}
