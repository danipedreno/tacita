import { useEffect, useState } from "react";
import { DEFAULT_DAILY_GOAL, DEFAULT_PENALTY, OFFICIAL_SECONDS_PER_QUESTION, STORAGE_KEY } from "./logic.js";

export const DEFAULT_STORE = {
  version: 1,
  xp: 0,
  streak: { count: 0, last: null, best: 0, days: [] },
  achievements: {},
  history: [],
  blockStats: {},
  totals: { tests: 0, answered: 0, correct: 0 },
  settings: { feedback: "immediate", count: 20, secsPerQ: OFFICIAL_SECONDS_PER_QUESTION, penalty: DEFAULT_PENALTY, blocks: [], tema: "all", onlyMistakes: false, sound: false },
  mistakes: {},
  plan: { examDate: null, dailyGoal: DEFAULT_DAILY_GOAL },
  daily: {}, // ejercicios hechos por día (YYYY-MM-DD → n)
  log: {}, // actividad por día para las misiones: { lessons, cards, questions }
  lessons: {}, // lecciones hechas: "tema:índice" → { done, best, times, last }
  units: {}, // temas con todas sus lecciones hechas → fecha
  temaStats: {}, // aciertos por tema en los tests: { c, t }
  temaExams: {}, // examen de cada tema: { best, passed, last }
  lastLesson: null,
  goalDays: [], // días en que se cumplió la meta
  counters: { marathons: 0, mastered: 0, highScores: 0 },
  cards: {}, // estado de cada tarjeta: { box, due, seen, last }
  cardsHistory: [], // repasos de tarjetas terminados
  activeExam: null,
  lastResult: null,
  installDismissed: false,
  onboarded: false, // bienvenida de primera vez vista
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const s = JSON.parse(raw);
    return {
      ...DEFAULT_STORE,
      ...s,
      streak: { ...DEFAULT_STORE.streak, ...s.streak },
      totals: { ...DEFAULT_STORE.totals, ...s.totals },
      settings: { ...DEFAULT_STORE.settings, ...s.settings },
      plan: { ...DEFAULT_STORE.plan, ...s.plan },
      counters: { ...DEFAULT_STORE.counters, ...s.counters },
    };
  } catch (e) {
    return DEFAULT_STORE;
  }
}

/** Todo el progreso vive en un único objeto en localStorage. */
export function usePersistentStore() {
  const [store, setStore] = useState(loadStore);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      /* almacenamiento no disponible (modo privado): la app sigue en memoria */
    }
  }, [store]);
  return [store, setStore];
}

/** Reloj basado en timestamps: sigue siendo exacto aunque el móvil congele la pestaña. */
export function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active]);
  return now;
}

/** Captura el aviso de instalación de Chrome en Android para ofrecer un botón propio. */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches
  );
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
  };
  // Navegador, para dar las instrucciones manuales correctas cuando no hay aviso automático.
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /SamsungBrowser/i.test(ua) ? "samsung" : /Firefox/i.test(ua) ? "firefox" : /iPhone|iPad/i.test(ua) ? "ios" : /Android/i.test(ua) ? "chrome" : "desktop";
  return { canInstall: !!promptEvent && !installed, installed, install, browser };
}
