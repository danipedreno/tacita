/* Repaso espaciado de las preguntas (lo que hace que el temario se quede):
   - Cada pregunta que ves en una lección o en un test entra en store.srs con una «caja».
   - Si la aciertas sube de caja y vuelve más tarde (1, 3, 7, 15, 30 y 60 días); si la fallas, vuelve mañana.
   - El «Repaso del día» junta lo que toca hoy, mezclado entre temas, más unas pocas nuevas de lo ya estudiado.
   - El dominio de un tema sale de en qué caja están sus preguntas. */
import { dateKey, lessonKey, shuffle } from "./logic.js";

export const SRS_DAYS = [0, 1, 3, 7, 15, 30, 60]; // días hasta volver a verla, según la caja
export const MASTERED = 4; // desde la caja 4 (15 días) se considera dominada
export const REVIEW_MAX = 20; // preguntas pendientes por repaso
export const REVIEW_MIN = 12; // si hay pocas pendientes, se completa con nuevas…
export const NEW_PER_DAY = 8; // …hasta este número de nuevas

const addDays = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days));
};

/** Nueva caja de una pregunta tras responderla. */
export function scheduleQuestion(prev, ok, today) {
  const box = ok ? Math.min((prev?.box || 0) + 1, SRS_DAYS.length - 1) : 1;
  return { box, due: addDays(today, SRS_DAYS[box]), seen: (prev?.seen || 0) + 1, right: (prev?.right || 0) + (ok ? 1 : 0), last: today };
}

/** Actualiza store.srs con las respuestas de un examen (los blancos cuentan como fallo). */
export function srsAfterExam(srs = {}, exam, today) {
  const next = { ...srs };
  exam.questions.forEach((q, i) => {
    if (!q.id) return;
    next[q.id] = scheduleQuestion(next[q.id], exam.answers[i] === q.answer, today);
  });
  return next;
}

/** Al terminar una lección, sus preguntas tipo test entran en el repaso (para mañana). */
export function srsAfterLesson(srs = {}, bank, temaId, lessonTitle, today) {
  const origin = `Lección «${lessonTitle}»`;
  const next = { ...srs };
  for (const q of bank?.preguntas || []) {
    if (q.tema === temaId && q.origin === origin && !next[q.id]) next[q.id] = { box: 0, due: addDays(today, 1), seen: 0, right: 0, last: today };
  }
  return next;
}

const studied = (bank, store) =>
  new Set((bank?.temas || []).filter((t) => t.lecciones?.some((_, i) => store.lessons?.[lessonKey(t.id, i)]?.done)).map((t) => t.id));

/** Preguntas que tocan hoy y nuevas candidatas (de temas ya empezados). */
export function reviewState(bank, store, today = dateKey()) {
  const srs = store.srs || {};
  const qs = (bank?.preguntas || []).filter((q) => q.tema !== "casos");
  const due = qs.filter((q) => srs[q.id] && srs[q.id].due <= today).sort((a, b) => srs[a.id].due.localeCompare(srs[b.id].due) || srs[a.id].box - srs[b.id].box);
  const temas = studied(bank, store);
  const fresh = qs.filter((q) => !srs[q.id] && temas.has(q.tema));
  return { due, fresh };
}

/** Las preguntas del «Repaso del día»: lo pendiente (lo más atrasado primero) y unas nuevas, todo mezclado. */
export function dailyReviewPool(bank, store, today = dateKey()) {
  const { due, fresh } = reviewState(bank, store, today);
  const pending = due.slice(0, REVIEW_MAX);
  const extra = pending.length < REVIEW_MIN ? shuffle(fresh).slice(0, Math.min(NEW_PER_DAY, REVIEW_MIN - pending.length + 3)) : [];
  return shuffle([...pending, ...extra]);
}

/** Repaso de un tema: primero lo pendiente, luego lo más flojo y lo no visto. */
export function temaReviewPool(bank, store, temaId, size = 15, today = dateKey()) {
  const srs = store.srs || {};
  const qs = (bank?.preguntas || []).filter((q) => q.tema === temaId);
  const score = (q) => {
    const s = srs[q.id];
    if (!s) return 2; // sin ver
    if (s.due <= today) return 0; // toca hoy
    return 3 + s.box; // cuanto más dominada, más tarde
  };
  return shuffle([...qs].sort((a, b) => score(a) - score(b) || Math.random() - 0.5).slice(0, size));
}

export const LEVELS = [
  { id: "nueva", label: "Sin ver", color: "var(--color-line, #e4dbcc)" },
  { id: "aprendiendo", label: "Aprendiendo", color: "#f2b48c" },
  { id: "casi", label: "Casi", color: "#c3ca85" },
  { id: "dominada", label: "Dominada", color: "#5f6b25" },
];

export const levelOf = (s) => (!s ? "nueva" : s.box >= MASTERED ? "dominada" : s.box === MASTERED - 1 ? "casi" : "aprendiendo");

/** Recuento por nivel y porcentaje de dominio de un grupo de preguntas. */
export function masteryOf(questions, srs = {}) {
  const c = { nueva: 0, aprendiendo: 0, casi: 0, dominada: 0 };
  questions.forEach((q) => c[levelOf(srs[q.id])]++);
  const total = questions.length;
  const pct = total ? Math.round(((c.dominada + c.casi * 0.6 + c.aprendiendo * 0.25) / total) * 100) : 0;
  return { ...c, total, pct };
}

/** Dominio de un tema, desglosado por lección (preguntas de cada lección) y el resto (tests de la academia). */
export function temaMastery(bank, store, tema) {
  const srs = store.srs || {};
  const qs = (bank?.preguntas || []).filter((q) => q.tema === tema.id);
  const parts = (tema.lecciones || []).map((l, i) => ({ titulo: l.titulo, index: i, ...masteryOf(qs.filter((q) => q.origin === `Lección «${l.titulo}»`), srs) }));
  const others = qs.filter((q) => !q.origin?.startsWith("Lección «"));
  return { ...masteryOf(qs, srs), parts, others: masteryOf(others, srs) };
}
