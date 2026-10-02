/* Reto del día: las mismas 10 preguntas para todos los usuarios cada día (salen de una semilla con la fecha).
   Se juega una vez al día, puntúa en la liga como un examen (+3 / −1 / 0) y se compara con los demás. */
import { dateKey } from "./logic.js";

export const RETO_SIZE = 10;

function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Las preguntas del reto de un día: iguales para todos (mismo banco y misma fecha). */
export function retoQuestions(bank, day = dateKey()) {
  const pool = (bank?.preguntas || []).filter((q) => q.tema !== "casos" && q.tema !== "rep").sort((a, b) => a.id.localeCompare(b.id));
  const rnd = seeded(`tacita-reto-${day}`);
  const out = [];
  const used = new Set();
  while (out.length < Math.min(RETO_SIZE, pool.length)) {
    const i = Math.floor(rnd() * pool.length);
    if (!used.has(i)) used.add(i), out.push(pool[i]);
  }
  return out;
}

const localDay = (iso = "") => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateKey(d);
};

/** Resultado del reto de un día dentro de la liga de un usuario ({ c, w, b } o null). */
export const retoResult = (liga = {}, day = dateKey()) => Object.values(liga).find((a) => a.t === "reto" && localDay(a.d) === day) || null;
