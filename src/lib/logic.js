/* ---------------------------------------------------------------------
   CONFIGURACIÓN
   --------------------------------------------------------------------- */
import { ligaInfo, ligaTotals } from "./liga.js";

export const STORAGE_KEY = "tacita.v1";
// XP: una lección son ~15-30 XP; 40 ejercicios al día dan unos 300-350 XP diarios.
export const XP_PER_CORRECT = 10;
export const XP_TEST_BONUS = 20; // por terminar un test de 10 o más preguntas
export const XP_GOAL_BONUS = 50; // por cumplir la meta diaria
export const DAILY_GOALS = [20, 40, 60, 100];
export const XP_LESSON = 15; // por terminar una lección
export const XP_PER_STEP = 2; // por ejercicio acertado a la primera dentro de una lección
export const XP_PERFECT = 10; // lección sin fallos
export const DEFAULT_DAILY_GOAL = 40;
// Ritmo por defecto: 1 minuto por pregunta. Ajústalo cuando salgan las bases de la convocatoria.
export const OFFICIAL_SECONDS_PER_QUESTION = 60;
// Penalización por fallo (las bases dirán cuál; por defecto, la habitual de un tercio).
/* Corrección del examen (bases, BOP de Cádiz n.º 165 de 27/08/2026): acierto +1, fallo −0,25 y en blanco −0,10;
   60 preguntas en 60 minutos y nota pasada a 0-10. Con cuatro opciones, contestar al azar sale a +0,06 de media y
   dejarla en blanco a −0,10: siempre compensa contestar. «none» queda para practicar sin restar. */
export const PENALTIES = [
  { value: "cadiz", label: "Como el examen", wrong: 0.25, blank: 0.1 },
  { value: "none", label: "Sin restar", wrong: 0, blank: 0 },
];
export const DEFAULT_PENALTY = "cadiz";
/** Reglas de corrección de un ajuste (los valores antiguos −¼ y −⅓ pasan a las del examen). */
export const scoring = (p) => (p === "none" || p === 0 ? PENALTIES[1] : PENALTIES[0]);
export const EXAM_QUESTIONS = 60;
export const NIGHT_START_HOUR = 23;
export const NIGHT_END_HOUR = 6;
export const EARLY_END_HOUR = 8;
// Una pregunta fallada sale del repaso tras acertarla estas veces seguidas.
export const MASTERED_AFTER = 2;
export const REVIEW_SIZE = 20;

/* Cada bloque es una carpeta de un pastel. Clases completas para que Tailwind las detecte. */
export const BLOCKS = {
  comun: {
    id: "comun",
    label: "Parte común",
    short: "Común",
    hex: "#ff614c",
    bg: "bg-sky",
    illustration: "bloque-penal",
  },
  especifico: {
    id: "especifico",
    label: "Parte específica",
    short: "Específica",
    hex: "#05aa82",
    bg: "bg-mint",
    illustration: "bloque-funcion-publica",
  },
  practica: {
    id: "practica",
    label: "Repasos y casos prácticos",
    short: "Práctica",
    hex: "#b4dcdc",
    bg: "bg-lilac",
    illustration: "simulacro",
  },
};
export const BLOCK_IDS = ["comun", "especifico", "practica"];

/* Colores de las unidades del camino de aprendizaje (se reparten en ciclo). */
export const UNIT_COLORS = ["#ff614c", "#ffc828", "#05aa82", "#b4dcdc", "#ed91fa"];

export const RANKS = [
  { level: 1, name: "Aspirante", min: 0, illustration: "rango-1-novato" },
  // Con ~300 XP al día: Llavero ~día 2, Conserje ~día 7, Negociado ~día 17, Leyenda ~día 30.
  { level: 2, name: "Subalterno en prácticas", min: 600, illustration: "rango-2-practicas" },
  { level: 3, name: "Conserje mayor", min: 2000, illustration: "rango-3-jefe-servicio" },
  { level: 4, name: "Jefe de Negociado", min: 5000, illustration: "rango-4-jefe-centro" },
  { level: 5, name: "Leyenda del Opoempollo", min: 9000, illustration: "rango-5-director" },
];

export const ACHIEVEMENTS = [
  { id: "primer-turno", name: "Primer día", desc: "Completa tu primer test.", icon: "key", illustration: "medalla-primer-turno" },
  { id: "madrugador", name: "Madrugador", desc: "Termina un test entre las 6:00 y las 8:00.", icon: "sun", illustration: "medalla-madrugador", fallback: "medalla-primer-turno" },
  { id: "imbatible", name: "Imbatible", desc: "Test de más de 10 preguntas sin fallos ni blancos.", icon: "shield", illustration: "medalla-imbatible" },
  { id: "nocturno", name: "Estudioso Nocturno", desc: "Termina un test entre las 23:00 y las 6:00.", icon: "moon", illustration: "medalla-estudioso-nocturno" },
];

/* Medallas por niveles (estilo Duolingo): cada familia tiene umbrales repartidos a lo largo del mes
   y siempre muestra cuánto falta para el siguiente nivel. `value` lee el progreso del estado guardado. */
export const MEDAL_FAMILIES = [
  { id: "lecciones", name: "Alumno aplicado", icon: "graduation", color: "#ed91fa", unit: "lecciones completadas", tiers: [5, 20, 50, 90, 121], value: (s) => Object.values(s.lessons || {}).filter((l) => l.done).length },
  { id: "racha", illustration: "medalla-racha", name: "En racha", icon: "fire", color: "#ed91fa", unit: "días seguidos", tiers: [3, 7, 14, 21, 30], value: (s) => s.streak.best || 0 },
  { id: "meta", illustration: "medalla-meta", name: "Meta cumplida", icon: "target", color: "#05aa82", unit: "días con la meta diaria", tiers: [1, 5, 10, 20, 28], value: (s) => s.goalDays.length },
  { id: "respondidas", illustration: "medalla-respondidas", name: "Fondo de armario", icon: "books", color: "#ff614c", unit: "preguntas respondidas", tiers: [100, 300, 700, 1200, 2000], value: (s) => s.totals.answered },
  { id: "maraton", illustration: "medalla-maraton", name: "Maratón", icon: "timer", color: "#ffc828", unit: "tests de 30 o más preguntas", tiers: [1, 5, 10, 20], value: (s) => s.counters.marathons },
  { id: "repaso", illustration: "medalla-repaso", name: "Sin cuentas pendientes", icon: "repeat", color: "#b4dcdc", unit: "fallos dominados", tiers: [5, 20, 50, 100], value: (s) => s.counters.mastered },
  { id: "tarjetero", illustration: "medalla-tarjetero", name: "Tarjetero", icon: "cards", color: "#ffc828", unit: "tarjetas dominadas", tiers: [20, 100, 300, 600, 900], value: (s) => Object.values(s.cards || {}).filter((c) => c.box >= 4).length },
  { id: "matricula", illustration: "medalla-matricula", name: "Matrícula", icon: "star", color: "#ff614c", unit: "tests de 20+ con nota ≥ 8", tiers: [1, 5, 15], value: (s) => s.counters.highScores },
  {
    id: "especialista",
    illustration: "medalla-especialista",
    name: "Tema a tema",
    icon: "scales",
    color: "#05aa82",
    unit: "temas terminados (todas sus lecciones)",
    tiers: [1, 3, 6, 10, 15],
    value: (s) => Object.keys(s.units || {}).length,
  },
];

/** Nivel alcanzado en una familia y progreso hacia el siguiente. */
export function medalProgress(family, store) {
  const value = family.value(store);
  const level = family.tiers.filter((t) => value >= t).length;
  const next = family.tiers[level] ?? null;
  // La barra muestra lo mismo que el texto «valor/siguiente umbral».
  return { value, level, max: family.tiers.length, next, pct: next ? Math.min(100, (value / next) * 100) : 100 };
}

export const ROMAN = ["", "I", "II", "III", "IV", "V"];

/** Días que faltan hasta el examen (0 = hoy). null si no hay fecha. */
export function daysUntil(examDate, today = dateKey()) {
  return examDate ? daysBetween(today, examDate) : null;
}

/* ---------------------------------------------------------------------
   LÓGICA PURA
   --------------------------------------------------------------------- */
export const pad2 = (n) => String(n).padStart(2, "0");
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const keyToUTC = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const daysBetween = (a, b) => Math.round((keyToUTC(b) - keyToUTC(a)) / 86400000);
export const uniq = (arr) => Array.from(new Set(arr));
export const fmt2 = (x) => x.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const uid = () => Math.random().toString(36).slice(2, 10);

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function formatMinutes(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** Estado visible de la racha: se rompe si pasa más de un día sin estudiar. */
export function streakView(streak, today = dateKey()) {
  if (!streak.last) return { count: 0, state: "none" };
  const diff = daysBetween(streak.last, today);
  if (diff <= 0) return { count: streak.count, state: "done" };
  if (diff === 1) return { count: streak.count, state: "pending" };
  return { count: 0, state: "broken" };
}

export function bumpStreak(streak, today) {
  const diff = streak.last ? daysBetween(streak.last, today) : null;
  const count = diff === 0 ? streak.count : diff === 1 ? streak.count + 1 : 1;
  return {
    count,
    last: today,
    best: Math.max(streak.best || 0, count),
    days: uniq([...(streak.days || []), today]).slice(-60),
  };
}

export function rankInfo(xp) {
  let idx = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.min) idx = i;
  });
  const rank = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  const pct = next ? ((xp - rank.min) / (next.min - rank.min)) * 100 : 100;
  return { rank, next, pct: Math.min(100, Math.max(0, pct)), toNext: next ? next.min - xp : 0 };
}

/** Baraja las 4 alternativas y recalcula el índice correcto. */
export function prepareQuestion(q) {
  const order = shuffle([0, 1, 2, 3]);
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

export function createExam({ pool, count, feedback, secsPerQ, source, title, penalty = DEFAULT_PENALTY, ordered = false, temaExam = null, caso = null, reto = null, duel = null }) {
  const questions = (ordered ? pool : shuffle(pool)).slice(0, Math.min(count, pool.length)).map(prepareQuestion);
  const now = Date.now();
  return {
    id: uid(),
    title,
    source,
    feedback, // "immediate" | "final"
    secsPerQ,
    penalty,
    temaExam, // id del tema si es el «examen del tema» del camino
    caso, // id del caso práctico, para mostrar su supuesto
    reto, // fecha del reto del día, si lo es
    duel, // { id, from, to, tema } si es un duelo
    startedAt: now,
    endsAt: now + questions.length * secsPerQ * 1000,
    questions,
    answers: questions.map(() => null),
    revealed: questions.map(() => false),
    current: 0,
  };
}

/** Preguntas del repaso: primero las más falladas y, a igualdad, las falladas más recientemente. */
export function mistakePool(mistakes, limit = REVIEW_SIZE) {
  // limit puede ser Infinity (el creador de tests filtra y recorta después)
  return Object.values(mistakes || {})
    .sort((a, b) => b.wrong - a.wrong || b.last.localeCompare(a.last))
    .slice(0, limit)
    .map((m) => m.q);
}

export function gradeExam(exam) {
  let correct = 0, wrong = 0, blank = 0, run = 0, maxWrongRun = 0;
  exam.questions.forEach((q, i) => {
    const a = exam.answers[i];
    if (a === null) {
      blank++;
      run = 0;
    } else if (a === q.answer) {
      correct++;
      run = 0;
    } else {
      wrong++;
      run++;
      maxWrongRun = Math.max(maxWrongRun, run);
    }
  });
  const n = exam.questions.length;
  const sc = scoring(exam.penalty ?? DEFAULT_PENALTY);
  const penalty = sc.value;
  const net = correct - wrong * sc.wrong - blank * sc.blank;
  const over10 = n ? (Math.max(0, net) / n) * 10 : 0;
  return { n, correct, wrong, blank, net, over10, maxWrongRun, penalty };
}

/** Aplica el resultado de un examen al progreso guardado. Devuelve el nuevo estado y un informe. */

/* ---------------------------------------------------------------------
   Progreso común a tests y tarjetas: meta diaria, racha y celebraciones
   --------------------------------------------------------------------- */
/** Registro de actividad por día (para las misiones diarias del tutor). */
function logActivity(store, today, patch) {
  const prev = store.log?.[today] || {};
  const day = { ...prev };
  for (const [k, v] of Object.entries(patch)) day[k] = (day[k] || 0) + v;
  return Object.fromEntries(Object.entries({ ...(store.log || {}), [today]: day }).slice(-30));
}

function studyProgress(store, n, today) {
  const goal = store.plan.dailyGoal;
  const doneBefore = store.daily[today] || 0;
  const doneAfter = doneBefore + n;
  const goalMet = doneBefore < goal && doneAfter >= goal;
  return {
    goal,
    doneAfter,
    goalMet,
    daily: Object.fromEntries(Object.entries({ ...store.daily, [today]: doneAfter }).slice(-60)),
    goalDays: goalMet ? [...store.goalDays, today] : store.goalDays,
    streak: bumpStreak(store.streak, today),
  };
}

/** Cola de celebraciones, en el orden en que se muestran al terminar. */
function celebrationsFor(store, nextStore, { first, today, goalMet, goal, earned = [] }) {
  const list = [{ type: first }];
  // La racha se celebra con la primera sesión de estudio de cada día (como Duolingo).
  if (store.streak.last !== today) list.push({ type: "streak", count: nextStore.streak.count });
  if (goalMet) list.push({ type: "goal", goal });
  earned.forEach((id) => list.push({ type: "special", id }));
  MEDAL_FAMILIES.forEach((f) => {
    const before = medalProgress(f, store).level;
    const after = medalProgress(f, nextStore).level;
    for (let level = before + 1; level <= after; level++) list.push({ type: "tier", family: f.id, level });
  });
  const rankBefore = rankInfo(store.xp).rank;
  const rankAfter = rankInfo(nextStore.xp).rank;
  if (rankAfter.level > rankBefore.level) list.push({ type: "rank", level: rankAfter.level });
  return list;
}

/* ---------------------------------------------------------------------
   Tarjetas (flashcards) con repetición espaciada tipo Leitner
   Caja 1..5; «Lo sé» sube de caja y aplaza, «Difícil» mantiene, «Otra vez» vuelve a la caja 1.
   --------------------------------------------------------------------- */
export const CARD_INTERVALS = [0, 1, 3, 7, 14, 30]; // días hasta volver a verla, por caja
export const XP_PER_CARD = { good: 3, hard: 1, again: 1 };
export const MASTERED_BOX = 4;

const addDays = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days));
};

export function scheduleCard(prev, rating, today) {
  const box = prev?.box || 0;
  const nextBox = rating === "good" ? Math.min(5, box + 1) : rating === "hard" ? Math.max(1, box) : 1;
  const days = rating === "again" ? 0 : CARD_INTERVALS[nextBox];
  return { box: nextBox, due: addDays(today, days), seen: (prev?.seen || 0) + 1, last: rating };
}

/** Tarjetas para hoy: primero las vencidas (las más atrasadas antes) y después nuevas al azar. */
export function cardsForSession(cards, state, today, limit = 20, newLimit = 10) {
  const due = cards.filter((c) => state[c.id] && state[c.id].due <= today).sort((a, b) => state[a.id].due.localeCompare(state[b.id].due));
  // Nuevas al azar entre todo lo elegido (no en el orden del temario).
  const fresh = shuffle(cards.filter((c) => !state[c.id])).slice(0, newLimit);
  return [...due, ...fresh].slice(0, limit);
}

/** Cajas según la última respuesta: «Las sé» (Lo sé) y «No las sé» (Otra vez o Difícil). */
export function cardPiles(cards, state) {
  const known = [];
  const unknown = [];
  for (const c of cards) {
    const last = state[c.id]?.last;
    if (last === "good") known.push(c);
    else if (last === "again" || last === "hard") unknown.push(c);
  }
  return { known, unknown };
}

/** Bonus por racha dentro de una sesión: +5 XP por cada 5 «Lo sé» seguidos. */
export const COMBO_STEP = 5;
export const COMBO_BONUS = 5;
function comboBonus(results) {
  let run = 0;
  let bonus = 0;
  let best = 0;
  for (const r of results) {
    run = r.rating === "good" ? run + 1 : 0;
    best = Math.max(best, run);
    if (run && run % COMBO_STEP === 0) bonus += COMBO_BONUS;
  }
  return { bonus, best };
}

export function applyCardsResult(store, results, date, live = null) {
  const today = dateKey(date);
  const cards = { ...store.cards };
  results.forEach((r) => (cards[r.id] = scheduleCard(cards[r.id], r.rating, today)));
  const { goal, doneAfter, goalMet, daily, goalDays, streak } = studyProgress(store, results.length, today);
  // Si la sesión trae su racha en vivo (incluye tarjetas repetidas), se usa esa para que cuadre con lo que se vio.
  const combo = live || comboBonus(results);
  const xpParts = {
    cards: results.reduce((acc, r) => acc + XP_PER_CARD[r.rating], 0),
    combo: combo.bonus,
    goal: goalMet ? XP_GOAL_BONUS : 0,
  };
  const xpGained = xpParts.cards + xpParts.combo + xpParts.goal;
  const known = results.filter((r) => r.rating === "good").length;
  const nextStore = {
    ...store,
    cards,
    daily,
    goalDays,
    streak,
    xp: store.xp + xpGained,
    log: logActivity(store, today, { cards: results.length }),
    totals: { ...store.totals, cards: (store.totals.cards || 0) + results.length },
    cardsHistory: [
      { id: uid(), date: date.toISOString(), n: results.length, known, xp: xpGained, bestCombo: combo.best },
      ...(store.cardsHistory || []),
    ].slice(0, 30),
  };
  const report = {
    kind: "cards",
    n: results.length,
    known,
    bestCombo: combo.best,
    xpGained,
    xpParts,
    dailyDone: doneAfter,
    dailyGoal: goal,
    celebrations: celebrationsFor(store, nextStore, { first: "cards", today, goalMet, goal }),
  };
  return { report, store: nextStore };
}

export function applyExamResult(store, exam, reason, date) {
  const grade = gradeExam(exam);
  const today = dateKey(date);

  // Meta diaria: cuenta todas las preguntas del test (también las dejadas en blanco).
  const { goal, doneAfter, goalMet, daily, goalDays, streak } = studyProgress(store, grade.n, today);

  const xpParts = {
    correct: grade.correct * XP_PER_CORRECT,
    test: grade.n >= 10 ? XP_TEST_BONUS : 0,
    goal: goalMet ? XP_GOAL_BONUS : 0,
  };
  const xpGained = xpParts.correct + xpParts.test + xpParts.goal;
  const rankBefore = rankInfo(store.xp).rank;
  const xp = store.xp + xpGained;
  const rankAfter = rankInfo(xp).rank;

  const blockStats = { ...store.blockStats };
  exam.questions.forEach((q, i) => {
    const prev = blockStats[q.block] || { c: 0, t: 0 };
    blockStats[q.block] = { c: prev.c + (exam.answers[i] === q.answer ? 1 : 0), t: prev.t + 1 };
  });

  // Fallos para repasar: se añade cada pregunta fallada (no las dejadas en blanco) y se retira
  // cuando se acierta MASTERED_AFTER veces seguidas. Se guarda la pregunta entera porque las de
  // «Mis apuntes» desaparecen al generar otro test.
  const mistakes = { ...store.mistakes };
  let mastered = 0;
  exam.questions.forEach((q, i) => {
    const a = exam.answers[i];
    const prev = mistakes[q.id];
    if (a !== null && a !== q.answer) {
      const { id, block, tema, q: text, options, answer, exp, origin, caso } = q;
      mistakes[q.id] = { q: { id, block, tema, q: text, options, answer, exp, origin, caso }, wrong: (prev?.wrong || 0) + 1, right: 0, last: date.toISOString() };
    } else if (a === q.answer && prev) {
      if (prev.right + 1 >= MASTERED_AFTER) {
        delete mistakes[q.id];
        mastered++;
      } else {
        mistakes[q.id] = { ...prev, right: prev.right + 1 };
      }
    }
  });

  const earned = [];
  const unlock = (id, cond) => {
    if (cond && !store.achievements[id]) earned.push(id);
  };
  const hour = date.getHours();
  unlock("primer-turno", true);
  unlock("madrugador", hour >= NIGHT_END_HOUR && hour < EARLY_END_HOUR);
  unlock("imbatible", grade.n > 10 && grade.wrong === 0 && grade.blank === 0);
  unlock("nocturno", hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR);

  const achievements = { ...store.achievements };
  earned.forEach((id) => (achievements[id] = date.toISOString()));

  const counters = {
    ...store.counters,
    marathons: store.counters.marathons + (grade.n >= 30 ? 1 : 0),
    mastered: store.counters.mastered + mastered,
    highScores: store.counters.highScores + (grade.n >= 20 && grade.over10 >= 8 ? 1 : 0),
  };
  const totals = {
    tests: store.totals.tests + 1,
    answered: store.totals.answered + grade.correct + grade.wrong,
    correct: store.totals.correct + grade.correct,
  };
  // Aciertos por tema: el tutor los usa para detectar temas flojos.
  const temaStats = { ...(store.temaStats || {}) };
  exam.questions.forEach((q, i) => {
    if (!q.tema) return;
    const prev = temaStats[q.tema] || { c: 0, t: 0 };
    temaStats[q.tema] = { c: prev.c + (exam.answers[i] === q.answer ? 1 : 0), t: prev.t + (exam.answers[i] === null ? 0 : 1) };
  });
  // Examen de tema superado (nota ≥ 5 sobre 10 con al menos 10 preguntas).
  const temaExams = { ...(store.temaExams || {}) };
  if (exam.temaExam && grade.n >= 10) {
    const prev = temaExams[exam.temaExam];
    temaExams[exam.temaExam] = { best: Math.max(prev?.best || 0, grade.over10), passed: !!prev?.passed || grade.over10 >= 5, last: date.toISOString() };
  }
  // Liga: cada examen de tema queda apuntado con sus aciertos, fallos y blancos.
  const liga = { ...(store.liga || {}) };
  let ligaReport = null;
  if ((exam.temaExam || exam.reto) && grade.n >= 10) {
    const before = ligaTotals(liga);
    liga[exam.id] = { t: exam.temaExam || "reto", c: grade.correct, w: grade.wrong, b: grade.blank, d: date.toISOString() };
    const after = ligaTotals(liga);
    // Si el tema ya puntuó hoy, este intento no cuenta (counted: false).
    ligaReport = { gained: after.points - before.points, counted: after.exams > before.exams, before: before.points, after: after.points, up: ligaInfo(after.points).index > ligaInfo(before.points).index };
  }
  // Duelo: se apunta para que el rival lo vea (no suma puntos de liga).
  if (exam.duel) liga[exam.id] = { t: "duelo", c: grade.correct, w: grade.wrong, b: grade.blank, d: date.toISOString(), du: exam.duel };
  const log = logActivity(store, today, { questions: grade.correct + grade.wrong });
  const nextStore = { ...store, xp, blockStats, temaStats, temaExams, liga, log, achievements, streak, totals, counters, daily, goalDays, mistakes };

  const celebrations = celebrationsFor(store, nextStore, { first: "test", today, goalMet, goal, earned });
  if (ligaReport) celebrations.splice(1, 0, { type: "liga", ...ligaReport });

  const report = {
    exam,
    grade,
    xpGained,
    xpParts,
    celebrations,
    dailyDone: doneAfter,
    dailyGoal: goal,
    rankBefore,
    rankAfter,
    earned,
    reason,
    mastered,
    pendingMistakes: Object.keys(mistakes).length,
    finishedAt: date.toISOString(),
  };

  return {
    report,
    store: {
      ...nextStore,
      history: [
        {
          id: exam.id,
          date: date.toISOString(),
          title: exam.title,
          n: grade.n,
          correct: grade.correct,
          wrong: grade.wrong,
          blank: grade.blank,
          net: grade.net,
          over10: grade.over10,
        },
        ...store.history,
      ].slice(0, 30),
      activeExam: null,
      lastResult: report,
    },
  };
}




/* ---------------------------------------------------------------------
   Lecciones (camino de aprendizaje tipo Duolingo)
   --------------------------------------------------------------------- */
export const lessonKey = (temaId, index) => `${temaId}:${index}`;

/** Pasos con respuesta (los de teoría no cuentan para la meta ni para la nota). */
export const isInteractive = (step) => step.t !== "teoria";

/**
 * Aplica una lección terminada. `result`: { temaId, index, totalLessons, interactive, firstTry, mistakes }.
 * Marca la lección como hecha, suma XP y cuenta los ejercicios para la meta diaria y la racha.
 */
export function applyLessonResult(store, result, date) {
  const today = dateKey(date);
  const { temaId, index, totalLessons, interactive, firstTry, title } = result;
  const key = lessonKey(temaId, index);
  const prev = store.lessons?.[key];
  const pct = interactive ? Math.round((firstTry / interactive) * 100) : 100;
  const lessons = { ...(store.lessons || {}), [key]: { done: true, best: Math.max(prev?.best || 0, pct), times: (prev?.times || 0) + 1, last: date.toISOString() } };
  const units = { ...(store.units || {}) };
  const unitDone = Array.from({ length: totalLessons }, (_, i) => lessons[lessonKey(temaId, i)]?.done).every(Boolean);
  const newUnit = unitDone && !units[temaId];
  if (unitDone) units[temaId] = units[temaId] || date.toISOString();

  const { goal, doneAfter, goalMet, daily, goalDays, streak } = studyProgress(store, interactive, today);
  // Repetir una lección ya hecha da la mitad: compensa repasar, pero avanzar compensa más.
  const repeat = !!prev?.done;
  const xpParts = {
    lesson: repeat ? Math.round(XP_LESSON / 2) : XP_LESSON,
    steps: firstTry * XP_PER_STEP,
    perfect: interactive && firstTry === interactive ? XP_PERFECT : 0,
    goal: goalMet ? XP_GOAL_BONUS : 0,
  };
  const xpGained = xpParts.lesson + xpParts.steps + xpParts.perfect + xpParts.goal;
  const nextStore = {
    ...store,
    lessons,
    units,
    daily,
    goalDays,
    streak,
    xp: store.xp + xpGained,
    log: logActivity(store, today, { lessons: 1 }),
    lastLesson: { temaId, index, date: date.toISOString() },
  };
  const report = {
    kind: "lesson",
    title,
    temaId,
    index,
    interactive,
    firstTry,
    pct,
    repeat,
    newUnit,
    xpGained,
    xpParts,
    dailyDone: doneAfter,
    dailyGoal: goal,
    celebrations: celebrationsFor(store, nextStore, { first: "lesson", today, goalMet, goal }),
  };
  return { store: nextStore, report };
}
