/* El tutor: decide qué te conviene hacer ahora, como haría un profesor particular.
   Orden de prioridades:
   1. Tarjetas vencidas (si se acumulan, se olvidan): repasarlas primero.
   2. Muchos fallos pendientes: repasarlos.
   3. Tema con todas las lecciones hechas y sin examen superado: examen del tema.
   4. La siguiente lección del camino.
   5. Un tema flojo (menos del 60 % de aciertos): test de ese tema.
   Además, tres misiones diarias: lecciones, tarjetas y preguntas de test. */
import { MASTERED_BOX, dateKey, lessonKey } from "./logic.js";
import { learnTemas, temaLabel } from "./bank.js";

export const unitDoneCount = (tema, store) => tema.lecciones.filter((_, i) => store.lessons?.[lessonKey(tema.id, i)]?.done).length;

/** Primera lección sin hacer, siguiendo el orden recomendado del temario. */
export function nextLesson(bank, store) {
  for (const tema of learnTemas(bank)) {
    const i = tema.lecciones.findIndex((_, k) => !store.lessons?.[lessonKey(tema.id, k)]?.done);
    if (i >= 0) return { tema, index: i };
  }
  return null;
}

/** Temas en los que ya has empezado a aprender (para sacar tarjetas nuevas de lo estudiado). */
export const studiedTemas = (bank, store) => new Set(learnTemas(bank).filter((t) => unitDoneCount(t, store) > 0).map((t) => t.id));

export function dueCards(bank, store, today = dateKey()) {
  return (bank?.flashcards || []).filter((c) => store.cards[c.id] && store.cards[c.id].due <= today).length;
}

export function weakTemas(bank, store) {
  return learnTemas(bank)
    .map((t) => ({ tema: t, s: store.temaStats?.[t.id] }))
    .filter(({ s }) => s && s.t >= 10 && s.c / s.t < 0.6)
    .sort((a, b) => a.s.c / a.s.t - b.s.c / b.s.t);
}

export const MISSIONS = [
  { id: "lessons", label: "Completa 2 lecciones", goal: 2, color: "#c3ca85" },
  { id: "cards", label: "Repasa 20 tarjetas", goal: 20, color: "#f2b48c" },
  { id: "questions", label: "Responde 20 preguntas de test", goal: 20, color: "#8da4ba" },
];

export function missions(store, today = dateKey()) {
  const day = store.log?.[today] || {};
  return MISSIONS.map((m) => ({ ...m, done: Math.min(m.goal, day[m.id] || 0) }));
}

/**
 * Recomendación principal y alternativas. Cada una: { id, kicker, title, text, action, cta }.
 * `action`: { type: "lesson", temaId, index } | { type: "cards" } | { type: "mistakes" } | { type: "temaExam", temaId } | { type: "weak", temaId }
 */
export function recommend(bank, store, today = dateKey()) {
  const recs = [];
  const due = dueCards(bank, store, today);
  const mistakes = Object.keys(store.mistakes || {}).length;
  const next = nextLesson(bank, store);
  const lessonsToday = store.log?.[today]?.lessons || 0;

  if (due >= 10) {
    recs.push({
      id: "cards",
      kicker: "Primero, lo que toca repasar",
      title: `${due} tarjetas te esperan`,
      text: "Si las dejas acumular se te olvidan. Son unos minutos y luego seguimos avanzando.",
      cta: "Repasar tarjetas",
      action: { type: "cards" },
    });
  }
  if (mistakes >= 15) {
    recs.push({
      id: "mistakes",
      kicker: "Tus fallos",
      title: `${mistakes} preguntas por dominar`,
      text: "Vamos a por ellas: salen del repaso cuando las aciertas dos veces seguidas.",
      cta: "Repasar fallos",
      action: { type: "mistakes" },
    });
  }
  const pendingExam = learnTemas(bank).find((t) => unitDoneCount(t, store) === t.lecciones.length && !store.temaExams?.[t.id]?.passed);
  if (pendingExam) {
    recs.push({
      id: "exam",
      kicker: "Pon a prueba lo aprendido",
      title: `Examen del ${temaLabel(bank, pendingExam.id).split(" · ")[0]}`,
      text: `Has terminado las lecciones de «${pendingExam.titulo}». Saca un 5 en el examen del tema para darlo por superado.`,
      cta: "Hacer el examen",
      action: { type: "temaExam", temaId: pendingExam.id },
    });
  }
  if (next) {
    const started = unitDoneCount(next.tema, store) > 0;
    recs.push({
      id: "lesson",
      kicker: lessonsToday ? "¿Otra más?" : started ? "Seguimos donde lo dejaste" : next.index === 0 && !Object.keys(store.lessons || {}).length ? "Empezamos por el principio" : "Tema nuevo",
      title: next.tema.lecciones[next.index].titulo,
      text: `${temaLabel(bank, next.tema.id)} · lección ${next.index + 1} de ${next.tema.lecciones.length}.`,
      cta: started || next.index > 0 ? "Continuar" : "Empezar",
      action: { type: "lesson", temaId: next.tema.id, index: next.index },
    });
  }
  const weak = weakTemas(bank, store)[0];
  if (weak) {
    recs.push({
      id: "weak",
      kicker: "Un punto flojo",
      title: weak.tema.titulo,
      text: `Llevas un ${Math.round((weak.s.c / weak.s.t) * 100)} % de aciertos en este tema. Un test corto te ayudará a afianzarlo.`,
      cta: "Test de 10",
      action: { type: "weak", temaId: weak.tema.id },
    });
  }
  if (!recs.length) {
    recs.push({
      id: "simulacro",
      kicker: "¡Has terminado el camino!",
      title: "Toca hacer simulacros",
      text: "Ya has visto todo el temario. Ahora, exámenes completos con tiempo para llegar fino al día del examen.",
      cta: "Hacer un simulacro",
      action: { type: "simulacro" },
    });
  }
  return recs;
}

/** Saludo del tutor según la hora y tu racha. */
export function greeting(store, now = new Date()) {
  const h = now.getHours();
  const hi = h < 6 ? "¿Estudiando a estas horas?" : h < 13 ? "¡Buenos días!" : h < 21 ? "¡Buenas tardes!" : "¡Buenas noches!";
  const done = Object.values(store.lessons || {}).filter((l) => l.done).length;
  if (!done && !store.totals.answered) return `${hi} Soy tu tutor. Te voy a enseñar todo el temario poco a poco, lección a lección.`;
  return hi;
}

export const masteredCards = (bank, store) => (bank?.flashcards || []).filter((c) => (store.cards[c.id]?.box || 0) >= MASTERED_BOX).length;
