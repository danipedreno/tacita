/* Liga gaditana: competición entre los usuarios de Opoempollo con los exámenes de tema.
   - Cada examen de tema (15 preguntas) suma puntos con la misma proporción que el examen real (+1, −0,25 y
     −0,10) multiplicada por 20 para que sean enteros: acierto +20, fallo −5, en blanco −2. El total nunca baja de 0.
   - Cada tema puntúa una vez al día (el primer intento): repetir el mismo examen hasta sabérselo no da puntos.
   - El reto del día (t: "reto") también puntúa, una vez al día. Los duelos (t: "duelo") no puntúan.
   - Los puntos llevan por tramos: 4 categorías (comidas de Cádiz) con 3 niveles cada una. Los tramos son
     anchos a propósito: lo normal es compartir categoría con alguien, así que ir tercero no se nota. */
import { PAL } from "./palette.js";

export const CATEGORIES = [
  { id: "churro", name: "Churro de la Guapa", icon: "churro", color: PAL.peach, levels: [0, 300, 700] },
  { id: "cazon", name: "Cazón en adobo", icon: "pescado", color: PAL.sky, levels: [1200, 1800, 2500] },
  { id: "garbanzos", name: "Garbanzos con choco", icon: "sepia", color: PAL.mint, levels: [3300, 4200, 5200] },
  { id: "chicharron", name: "Chicharrón", icon: "cerdo", color: PAL.sun, levels: [6300, 7500, 8800] },
];

/** Todos los tramos en orden: { cat, level (1-3), min }. */
export const TRAMOS = CATEGORIES.flatMap((cat) => cat.levels.map((min, i) => ({ cat, level: i + 1, min })));

export const POINTS = { correct: 20, wrong: -5, blank: -2 };
const dayOf = (iso = "") => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Suma de los intentos guardados en store.liga ({ [examId]: { t, c, w, b, d } }): solo el primero de cada tema y día. */
export function ligaTotals(liga = {}) {
  const tot = { exams: 0, correct: 0, wrong: 0, blank: 0 };
  const seen = new Set();
  const list = Object.values(liga).sort((x, y) => (x.d || "").localeCompare(y.d || ""));
  for (const a of list) {
    if (a.t === "duelo") continue; // los duelos no suman puntos
    const key = `${a.t}|${dayOf(a.d)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tot.exams++;
    tot.correct += a.c || 0;
    tot.wrong += a.w || 0;
    tot.blank += a.b || 0;
  }
  return { ...tot, points: Math.max(0, tot.correct * POINTS.correct + tot.wrong * POINTS.wrong + tot.blank * POINTS.blank) };
}

/** Tramo en el que está una puntuación y cuánto falta para el siguiente. */
export function ligaInfo(points) {
  let idx = 0;
  TRAMOS.forEach((t, i) => {
    if (points >= t.min) idx = i;
  });
  const tramo = TRAMOS[idx];
  const next = TRAMOS[idx + 1] || null;
  const pct = next ? ((points - tramo.min) / (next.min - tramo.min)) * 100 : 100;
  return { ...tramo, index: idx, next, toNext: next ? next.min - points : 0, pct: Math.min(100, Math.max(0, pct)) };
}

export const tramoLabel = (t) => `${t.cat.name} ${["", "I", "II", "III"][t.level]}`;
