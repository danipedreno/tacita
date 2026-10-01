/* Personajes de Tacita (inspirados en el sistema de Marshmallow por Ragged Edge):
   formas geométricas planas apiladas (sombrero · cabeza · cuerpo) con ojos y expresiones.
   Todo es SVG generado: no hay archivos de imagen. Los ojos abiertos parpadean y, si se pide,
   las pupilas siguen el puntero. */
import { useEffect, useId, useMemo, useRef, useState } from "react";

export const MC = {
  pink: "#ff8ac8",
  moss: "#848f3e",
  slate: "#8da4ba",
  forest: "#2b4a39",
  rust: "#c4692c",
  taupe: "#a39780",
  ink: "#1e1e1c",
  white: "#fffcf7",
};
const COLORS = [MC.pink, MC.moss, MC.slate, MC.forest, MC.rust, MC.taupe];

/* ---------- Formas: cada una dibuja un path dentro de su caja (x, y, w, h) ---------- */
const SHAPES = {
  dome: (x, y, w, h) => `M${x} ${y + h}V${y + h / 2}A${w / 2} ${h / 2} 0 0 1 ${x + w} ${y + h / 2}V${y + h}Z`,
  bowl: (x, y, w, h) => `M${x} ${y}H${x + w}V${y + h / 2}A${w / 2} ${h / 2} 0 0 1 ${x} ${y + h / 2}Z`,
  circle: (x, y, w, h) => `M${x} ${y + h / 2}A${w / 2} ${h / 2} 0 1 1 ${x + w} ${y + h / 2}A${w / 2} ${h / 2} 0 1 1 ${x} ${y + h / 2}Z`,
  square: (x, y, w, h) => {
    const r = Math.min(w, h) * 0.2;
    return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
  },
  hex: (x, y, w, h) => `M${x} ${y + h / 2}L${x + w * 0.22} ${y}H${x + w * 0.78}L${x + w} ${y + h / 2}L${x + w * 0.78} ${y + h}H${x + w * 0.22}Z`,
  diamond: (x, y, w, h) => `M${x + w / 2} ${y}L${x + w} ${y + h * 0.55}L${x + w * 0.82} ${y + h}H${x + w * 0.18}L${x} ${y + h * 0.55}Z`,
  house: (x, y, w, h) => `M${x} ${y + h * 0.38}L${x + w / 2} ${y}L${x + w} ${y + h * 0.38}V${y + h}H${x}Z`,
  shield: (x, y, w, h) => `M${x} ${y}H${x + w}V${y + h * 0.55}L${x + w / 2} ${y + h}L${x} ${y + h * 0.55}Z`,
  drop: (x, y, w, h) => `M${x + w / 2} ${y + h}L${x + w * 0.1} ${y + h * 0.55}A${w * 0.45} ${w * 0.45} 0 1 1 ${x + w * 0.9} ${y + h * 0.55}Z`,
  pin: (x, y, w, h) => `M${x + w / 2} ${y + h}L${x + w * 0.12} ${y + h * 0.5}A${w * 0.42} ${h * 0.42} 0 1 1 ${x + w * 0.88} ${y + h * 0.5}Z`,
  hourglass: (x, y, w, h) => `M${x} ${y}H${x + w}Q${x + w * 0.5} ${y + h * 0.5} ${x + w} ${y + h}H${x}Q${x + w * 0.5} ${y + h * 0.5} ${x} ${y}Z`,
  crown: (x, y, w, h) => {
    const b = w / 3;
    return `M${x} ${y + h}V${y + b / 2}A${b / 2} ${b / 2} 0 0 1 ${x + b} ${y + b / 2}A${b / 2} ${b / 2} 0 0 1 ${x + 2 * b} ${y + b / 2}A${b / 2} ${b / 2} 0 0 1 ${x + w} ${y + b / 2}V${y + h}Z`;
  },
  scallop: (x, y, w, h) => {
    const r = h / 6;
    return `M${x} ${y}H${x + w * 0.85}A${r} ${r} 0 0 1 ${x + w * 0.85} ${y + h / 3}A${r} ${r} 0 0 1 ${x + w * 0.85} ${y + (2 * h) / 3}A${r} ${r} 0 0 1 ${x + w * 0.85} ${y + h}H${x}Z`;
  },
};
const HEAD_SHAPES = ["dome", "circle", "square", "hex", "diamond", "house", "shield", "pin", "scallop"];
const HAT_SHAPES = ["drop", "dome", "bowl", "hex", "circle", "crown", "diamond"];
const BODY_SHAPES = ["dome", "bowl", "hex", "hourglass", "house", "diamond", "square"];

/* ---------- Ojos y expresiones ---------- */
function Eyes({ face, cx, cy, gap, r, look, blink, color }) {
  const eyes = [cx - gap / 2, cx + gap / 2];
  const sw = Math.max(2.2, r * 0.42);
  const line = { stroke: MC.ink, strokeWidth: sw, strokeLinecap: "round", fill: "none" };
  const dx = (look?.[0] || 0) * r * 0.42;
  const dy = (look?.[1] || 0) * r * 0.42;
  const open = (ex, k, size = 1, pupil = 0.56) => (
    <g key={k} className={blink ? "mascot-eye" : undefined} style={blink ? { animationDelay: blink } : undefined}>
      <circle cx={ex} cy={cy} r={r * size} fill={MC.white} />
      <circle cx={ex + dx} cy={cy + dy} r={r * size * pupil} fill={MC.ink} />
      <circle cx={ex + dx + r * size * pupil * 0.38} cy={cy + dy - r * size * pupil * 0.38} r={r * size * pupil * 0.32} fill={MC.white} />
    </g>
  );
  switch (face) {
    case "happy": // ^ ^
      return eyes.map((ex, k) => <path key={k} d={`M${ex - r} ${cy + r * 0.35}Q${ex} ${cy - r * 1.1} ${ex + r} ${cy + r * 0.35}`} {...line} />);
    case "sleepy": // ‿ ‿
      return eyes.map((ex, k) => <path key={k} d={`M${ex - r} ${cy - r * 0.2}Q${ex} ${cy + r * 0.9} ${ex + r} ${cy - r * 0.2}`} {...line} />);
    case "flat": // — —
      return eyes.map((ex, k) => <path key={k} d={`M${ex - r} ${cy}H${ex + r}`} {...line} />);
    case "dead": // x x
      return eyes.map((ex, k) => <path key={k} d={`M${ex - r * 0.7} ${cy - r * 0.7}L${ex + r * 0.7} ${cy + r * 0.7}M${ex + r * 0.7} ${cy - r * 0.7}L${ex - r * 0.7} ${cy + r * 0.7}`} {...line} />);
    case "dots":
      return eyes.map((ex, k) => <circle key={k} cx={ex + dx * 0.6} cy={cy + dy * 0.6} r={r * 0.42} fill={MC.ink} />);
    case "wink":
      return [open(eyes[0], 0), <path key={1} d={`M${eyes[1] - r} ${cy + r * 0.35}Q${eyes[1]} ${cy - r * 1.1} ${eyes[1] + r} ${cy + r * 0.35}`} {...line} />];
    case "meh": // párpados a media asta
      return eyes.map((ex, k) => (
        <g key={k}>
          <circle cx={ex} cy={cy} r={r} fill={MC.white} />
          <circle cx={ex + dx} cy={cy + r * 0.3} r={r * 0.5} fill={MC.ink} />
          <rect x={ex - r - 1} y={cy - r - 1} width={r * 2 + 2} height={r + 1} fill={color} />
        </g>
      ));
    case "surprised":
      return eyes.map((ex, k) => open(ex, k, 1.25, 0.38));
    default:
      return eyes.map((ex, k) => open(ex, k));
  }
}

/* Boca, mejillas y cejas: lo que da la expresión. */
function Features({ face, cx, cy, gap, r, color, mouth = true }) {
  const sw = Math.max(2.2, r * 0.42);
  const line = { stroke: MC.ink, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  const my = cy + r * 2.1; // altura de la boca
  const mw = gap * 0.42; // media anchura de la boca
  const blush = color === MC.pink ? "#ffb3d9" : MC.pink;
  const cheeks = ["open", "happy", "wink", "dots", "sleepy"].includes(face) && (
    <g opacity={color === MC.pink ? 0.9 : 0.75}>
      <ellipse cx={cx - gap / 2 - r * 0.9} cy={cy + r * 1.55} rx={r * 0.85} ry={r * 0.5} fill={blush} />
      <ellipse cx={cx + gap / 2 + r * 0.9} cy={cy + r * 1.55} rx={r * 0.85} ry={r * 0.5} fill={blush} />
    </g>
  );
  let m = null;
  if (mouth)
    switch (face) {
      case "happy": // boca abierta de alegría, con lengua
        m = (
          <g>
            <path d={`M${cx - mw} ${my - r * 0.3}H${cx + mw}Q${cx + mw} ${my + r * 1.5} ${cx} ${my + r * 1.5}Q${cx - mw} ${my + r * 1.5} ${cx - mw} ${my - r * 0.3}Z`} fill={MC.ink} />
            <path d={`M${cx - mw * 0.55} ${my + r * 1.12}Q${cx} ${my + r * 0.45} ${cx + mw * 0.55} ${my + r * 1.12}Q${cx} ${my + r * 1.5} ${cx - mw * 0.55} ${my + r * 1.12}Z`} fill="#ff6fb5" />
          </g>
        );
        break;
      case "open":
      case "dots":
        m = <path d={`M${cx - mw * 0.7} ${my}Q${cx} ${my + r * 1.1} ${cx + mw * 0.7} ${my}`} {...line} />;
        break;
      case "wink":
        m = <path d={`M${cx - mw * 0.7} ${my + r * 0.2}Q${cx + mw * 0.2} ${my + r * 1.1} ${cx + mw * 0.8} ${my - r * 0.3}`} {...line} />;
        break;
      case "surprised":
        m = <ellipse cx={cx} cy={my + r * 0.4} rx={r * 0.7} ry={r * 0.95} fill={MC.ink} />;
        break;
      case "meh":
        m = <path d={`M${cx - mw * 0.6} ${my + r * 0.35}L${cx + mw * 0.6} ${my - r * 0.05}`} {...line} />;
        break;
      case "sleepy":
        m = <ellipse cx={cx} cy={my + r * 0.2} rx={r * 0.45} ry={r * 0.55} fill={MC.ink} />;
        break;
      case "flat":
        m = <path d={`M${cx - mw * 0.55} ${my}H${cx + mw * 0.55}`} {...line} />;
        break;
      case "dead":
        m = <path d={`M${cx - mw * 0.8} ${my}q${mw * 0.27} ${-r * 0.7} ${mw * 0.53} 0t${mw * 0.53} 0t${mw * 0.53} 0`} {...line} />;
        break;
      default:
    }
  // Cejas: aburrido (caídas), concentrado (rectas y bajas), sorprendido (altas).
  const by = cy - r * 1.7;
  const brows =
    face === "meh" ? (
      <path d={`M${cx - gap / 2 - r} ${by + r * 0.5}L${cx - gap / 2 + r} ${by + r * 0.9}M${cx + gap / 2 + r} ${by + r * 0.5}L${cx + gap / 2 - r} ${by + r * 0.9}`} {...line} />
    ) : face === "flat" ? (
      <path d={`M${cx - gap / 2 - r} ${by + r * 0.7}L${cx - gap / 2 + r} ${by + r * 1.05}M${cx + gap / 2 + r} ${by + r * 0.7}L${cx + gap / 2 - r} ${by + r * 1.05}`} {...line} />
    ) : face === "surprised" ? (
      <path d={`M${cx - gap / 2 - r} ${by - r * 0.2}Q${cx - gap / 2} ${by - r * 1} ${cx - gap / 2 + r} ${by - r * 0.2}M${cx + gap / 2 - r} ${by - r * 0.2}Q${cx + gap / 2} ${by - r * 1} ${cx + gap / 2 + r} ${by - r * 0.2}`} {...line} />
    ) : null;
  return (
    <>
      {cheeks}
      {brows}
      {m}
    </>
  );
}

/* ---------- Un personaje ---------- */
/** cfg: { head: { shape, color, w, h }, hat?: {...}, body?: {...}, face, look, tilt } — coordenadas en un lienzo de 120×150. */
function Character({ cfg, x = 0, blinkDelay, look }) {
  const cx = 60 + x;
  const body = cfg.body;
  const head = cfg.head;
  const hat = cfg.hat;
  const bodyY = 150 - (body?.h || 0);
  const headY = bodyY - head.h + (body ? 2 : 0);
  const hatY = headY - (hat?.h || 0) + 3;
  const part = (p, y, key) => p && <path key={key} d={SHAPES[p.shape](cx - p.w / 2, y, p.w, p.h)} fill={p.color} transform={p.tilt ? `rotate(${p.tilt} ${cx} ${y + p.h / 2})` : undefined} />;
  const eyeY = headY + head.h * (cfg.eyeY ?? (head.shape === "dome" ? 0.5 : head.shape === "pin" || head.shape === "drop" ? 0.36 : head.shape === "house" ? 0.55 : head.shape === "shield" ? 0.32 : head.shape === "diamond" ? 0.48 : 0.4));
  const r = Math.max(4.6, head.w * 0.1);
  const eyeX = cx + (cfg.eyeShift || 0) * head.w;
  return (
    <g transform={cfg.tilt ? `rotate(${cfg.tilt} ${cx} 150)` : undefined}>
      {part(body, bodyY, "b")}
      {part(head, headY, "h")}
      {part(hat, hatY, "t")}
      <Features face={cfg.face} cx={eyeX} cy={eyeY} gap={head.w * 0.36} r={r} color={head.color} mouth={cfg.mouth !== false} />
      <Eyes face={cfg.face} cx={eyeX} cy={eyeY} gap={head.w * 0.36} r={r} look={look || cfg.look} blink={blinkDelay} color={head.color} />
    </g>
  );
}

/* ---------- Generador determinista a partir de un nombre ---------- */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), (s >>> 0) / 4294967296);
}

export function makeCharacter(name, overrides = {}) {
  const r = rng(hash(name));
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const headColor = pick(COLORS);
  const other = () => {
    let c = pick(COLORS);
    if (c === headColor) c = COLORS[(COLORS.indexOf(c) + 1) % COLORS.length];
    return c;
  };
  const headShape = pick(HEAD_SHAPES);
  const hw = 62 + Math.floor(r() * 22);
  const hh = headShape === "dome" ? hw * 0.62 : headShape === "pin" ? hw * 1.05 : 46 + Math.floor(r() * 18);
  const withBody = r() > 0.25;
  const withHat = r() > 0.4;
  const cfg = {
    head: { shape: headShape, color: headColor, w: hw, h: hh },
    body: withBody ? { shape: pick(BODY_SHAPES), color: other(), w: 58 + Math.floor(r() * 30), h: 30 + Math.floor(r() * 14) } : null,
    hat: withHat ? { shape: pick(HAT_SHAPES), color: other(), w: 22 + Math.floor(r() * 30), h: 16 + Math.floor(r() * 14), tilt: r() > 0.7 ? (r() - 0.5) * 30 : 0 } : null,
    face: pick(["open", "open", "open", "happy", "dots", "sleepy", "flat"]),
    look: [Math.round((r() - 0.5) * 2), 0],
    eyeShift: r() > 0.75 ? (r() - 0.5) * 0.3 : 0,
  };
  return { ...cfg, ...overrides, head: { ...cfg.head, ...(overrides.head || {}) } };
}

/* ---------- Personajes con nombre (los que más se ven) ---------- */
const P = MC;
export const CHARACTERS = {
  // La tutora: cúpula rosa con ojos grandes y cuerpo oliva.
  tacita: { head: { shape: "dome", color: P.pink, w: 92, h: 60 }, body: { shape: "bowl", color: P.moss, w: 76, h: 40 }, hat: { shape: "drop", color: P.rust, w: 22, h: 26 }, face: "open", look: [0.4, 0] },
};

/** Configuración de cada ilustración de la app (mismo nombre que el antiguo registro). */
const MOODS = {
  bienvenida: { group: ["tacita", "amigo-1", "amigo-2"], face: "open" },
  simulacro: { group: ["sim-1", "tacita", "sim-2"], face: "flat" },
  "racha-activa": { face: "happy", hat: { shape: "drop", color: P.rust, w: 26, h: 30 } },
  "racha-pendiente": { face: "sleepy", hat: { shape: "drop", color: P.rust, w: 14, h: 18 } },
  "racha-apagada": { face: "meh", head: { color: P.slate } },
  instalar: { face: "surprised" },
  "rango-1-novato": { face: "open", hat: null, body: { shape: "bowl", color: P.moss, w: 56, h: 26 } },
  "rango-2-practicas": { face: "happy", hat: { shape: "dome", color: P.forest, w: 40, h: 20 } },
  "rango-3-jefe-servicio": { face: "open", hat: { shape: "hex", color: P.slate, w: 56, h: 22 } },
  "rango-4-jefe-centro": { face: "flat", hat: { shape: "house", color: P.rust, w: 56, h: 30 } },
  "rango-5-director": { face: "happy", hat: { shape: "crown", color: P.rust, w: 60, h: 30 } },
  ascenso: { face: "happy", hat: { shape: "crown", color: P.rust, w: 56, h: 28 } },
  entregar: { face: "open", look: [1, 0] },
  abandonar: { face: "open", look: [-1, 0] },
  "tiempo-agotado": { face: "dead" },
  "resultado-alto": { face: "happy" },
  "resultado-medio": { face: "dots" },
  "resultado-bajo": { face: "meh" },
  procesando: { face: "flat" },
  "generando-preguntas": { face: "flat" },
  "test-listo": { face: "happy" },
  "todo-temario": { face: "surprised" },
  "caja-las-se": { face: "happy" },
  "caja-no-las-se": { face: "meh" },
  "todo-al-dia": { face: "sleepy" },
  "dia-del-examen": { face: "open", hat: { shape: "crown", color: P.pink, w: 50, h: 24 } },
  reiniciar: { face: "surprised" },
  "bloque-penal": { face: "open", head: { shape: "dome", color: P.slate } },
  "bloque-funcion-publica": { face: "happy", head: { shape: "house", color: P.moss } },
  "bloque-conducta": { face: "dots" },
  "medalla-primer-turno": { face: "happy" },
  "medalla-madrugador": { face: "sleepy" },
  "medalla-imbatible": { face: "flat" },
  "medalla-estudioso-nocturno": { face: "meh", head: { color: P.forest } },
};

export function characterFor(name) {
  if (CHARACTERS[name]) return CHARACTERS[name];
  const m = MOODS[name] || {};
  const { group, ...rest } = m;
  const base = makeCharacter(name);
  return { ...base, ...rest, head: { ...base.head, ...(rest.head || {}) }, hat: "hat" in rest ? rest.hat : base.hat, body: "body" in rest ? rest.body : base.body };
}

/* ---------- Contraste con el fondo ---------- */
const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const near = (a, b) => {
  if (!a || !b || a[0] !== "#" || b[0] !== "#") return false;
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 70;
};
/** Si alguna pieza se confunde con el fondo, la cambia por otro color de la paleta que sí contraste. */
function avoidColor(cfg, bg) {
  if (!bg) return cfg;
  const used = [cfg.head, cfg.hat, cfg.body].filter(Boolean).map((p) => p.color);
  const swap = (p, k) => {
    if (!p || !near(p.color, bg)) return p;
    const alt = COLORS.find((c, j) => j >= k && !near(c, bg) && !used.includes(c)) || COLORS.find((c) => !near(c, bg));
    return { ...p, color: alt };
  };
  return { ...cfg, head: swap(cfg.head, 0), hat: swap(cfg.hat, 2), body: swap(cfg.body, 4) };
}

/* ---------- Componente ---------- */
let followers = 0;
const pointer = { x: 0, y: 0, subs: new Set() };
function usePointer(active) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const sub = () => force((n) => n + 1);
    pointer.subs.add(sub);
    if (++followers === 1) {
      let frame = 0;
      pointer.onMove = (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        if (!frame)
          frame = requestAnimationFrame(() => {
            frame = 0;
            pointer.subs.forEach((f) => f());
          });
      };
      window.addEventListener("pointermove", pointer.onMove);
    }
    return () => {
      pointer.subs.delete(sub);
      if (--followers === 0) window.removeEventListener("pointermove", pointer.onMove);
    };
  }, [active]);
}

/**
 * <Mascot name="tacita" />, <Mascot cfg={...} /> o un grupo (name con «group» en MOODS).
 * face / look sobrescriben la expresión (p. ej. la tutora reacciona a tus respuestas).
 * follow: las pupilas siguen el puntero (escritorio).
 */
export function Mascot({ name = "tacita", cfg, face, look, follow = false, fit = false, bg, className = "", title }) {
  const id = useId();
  const ref = useRef(null);
  usePointer(follow);
  const group = !cfg && MOODS[name]?.group;
  const chars = useMemo(() => {
    if (cfg) return [cfg];
    if (group) return group.map((g, k) => ({ ...characterFor(g), ...(k === 1 && MOODS[name].face ? { face: MOODS[name].face } : {}) }));
    return [characterFor(name)];
  }, [cfg, group, name]);
  const blink = useMemo(() => `${(hash(id + name) % 4000) / 1000}s`, [id, name]);

  let followLook;
  if (follow && ref.current && (pointer.x || pointer.y)) {
    const b = ref.current.getBoundingClientRect();
    const dx = pointer.x - (b.left + b.width / 2);
    const dy = pointer.y - (b.top + b.height * 0.45);
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 160);
    followLook = [(dx / d) * k, (dy / d) * k];
  }
  const w = 120 * chars.length;
  let viewBox = `-20 -10 ${w + 40} 160`;
  if (fit && chars.length === 1) {
    // Lienzo ajustado al personaje (para nodos y avatares pequeños).
    const c = chars[0];
    const parts = [c.body, c.head, c.hat].filter(Boolean);
    const total = parts.reduce((a, p) => a + p.h, 0);
    const maxW = Math.max(...parts.map((p) => p.w));
    viewBox = `${60 - maxW / 2 - 4} ${150 - total - 4} ${maxW + 8} ${total + 8}`;
  }
  return (
    <svg ref={ref} viewBox={viewBox} preserveAspectRatio={fit === "center" ? "xMidYMid meet" : fit ? "xMidYMax meet" : undefined} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {chars.map((c, k) => (
        <Character key={k} cfg={avoidColor(face ? { ...c, face } : c, bg)} x={k * 120} blinkDelay={`calc(${blink} + ${k * 0.7}s)`} look={followLook || look} />
      ))}
    </svg>
  );
}

export const isGroup = (name) => !!MOODS[name]?.group;
