/* Duelos: una persona reta a otra a 10 preguntas (de todo el temario o de un tema). Las preguntas salen de una
   semilla con el id del duelo, así que las dos juegan exactamente las mismas. Cada intento se guarda en
   store.liga con t: "duelo" (es lo único que se comparte entre usuarios) y no suma puntos de liga.
   Gana quien saque más puntos (+20 acierto, −5 fallo, −2 en blanco); si empatan, empate. */
import { seeded } from "./reto.js";
import { POINTS } from "./liga.js";

export const DUEL_SIZE = 10;
export const DUEL_DAYS = 7; // un reto sin contestar caduca a la semana

export const duelPoints = (a) => (a.c || 0) * POINTS.correct + (a.w || 0) * POINTS.wrong + (a.b || 0) * POINTS.blank;

/** Las preguntas de un duelo: las mismas para quien reta y para quien acepta. */
export function duelQuestions(bank, id, tema = "all") {
  const pool = (bank?.preguntas || [])
    .filter((q) => q.tema !== "casos" && q.tema !== "rep" && (tema === "all" || q.tema === tema))
    .sort((a, b) => a.id.localeCompare(b.id));
  const rnd = seeded(`tacita-duelo-${id}`);
  const out = [];
  const used = new Set();
  while (out.length < Math.min(DUEL_SIZE, pool.length)) {
    const i = Math.floor(rnd() * pool.length);
    if (!used.has(i)) used.add(i), out.push(pool[i]);
  }
  return out;
}

export const newDuelId = (user) => `${user}-${Date.now().toString(36)}`;

const entries = (liga = {}) => Object.values(liga).filter((a) => a.t === "duelo" && a.du?.id);

/**
 * Todos los duelos en los que participa `user`, con lo que ha jugado cada uno.
 * myLiga: la liga de este dispositivo; rows: la clasificación de la nube ({ usuario, liga }).
 * Devuelve [{ id, from, to, tema, d, rival, mine, theirs, status, result }] del más reciente al más antiguo.
 * status: "pending" (te retan y no has jugado) · "waiting" (has jugado, falta el rival) · "done" · "expired".
 */
export function duelsOf(user, myLiga = {}, rows = []) {
  const map = new Map();
  const add = (who, a) => {
    const { id, from, to, tema } = a.du;
    if (from !== user && to !== user) return;
    const m = map.get(id) || { id, from, to, tema: tema || "all", d: a.d, plays: {} };
    if (!m.plays[who] || (a.d || "") < (m.plays[who].d || "")) m.plays[who] = a;
    if ((a.d || "") < (m.d || "")) m.d = a.d;
    map.set(id, m);
  };
  entries(myLiga).forEach((a) => add(user, a));
  rows.filter((r) => r.usuario !== user).forEach((r) => entries(r.liga).forEach((a) => add(r.usuario, a)));
  const old = Date.now() - DUEL_DAYS * 864e5;
  return [...map.values()]
    .map((m) => {
      const rival = m.from === user ? m.to : m.from;
      const mine = m.plays[user] || null;
      const theirs = m.plays[rival] || null;
      let status = mine && theirs ? "done" : mine ? "waiting" : "pending";
      if (status !== "done" && new Date(m.d).getTime() < old) status = "expired";
      let result = null;
      if (status === "done") {
        const a = duelPoints(mine), b = duelPoints(theirs);
        result = a > b ? "win" : a < b ? "loss" : "draw";
      }
      return { id: m.id, from: m.from, to: m.to, tema: m.tema, d: m.d, rival, mine, theirs, status, result };
    })
    .sort((x, y) => (y.d || "").localeCompare(x.d || ""));
}

/** Victorias, derrotas y empates contra cada rival. */
export function duelRecord(duels) {
  const rec = {};
  duels.filter((d) => d.status === "done").forEach((d) => {
    const r = (rec[d.rival] ||= { win: 0, loss: 0, draw: 0 });
    r[d.result]++;
  });
  return rec;
}
