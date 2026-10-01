/* Sincronización del progreso entre dispositivos (móvil y ordenador) con Supabase.
   - La tabla `progreso` no es accesible directamente (RLS sin políticas): solo por dos funciones
     (`leer_progreso` y `guardar_progreso`) que comprueban la clave de cada usuario.
   - La clave que viaja es sha256("tacita-sync:usuario:contraseña"); en la base solo se guarda su hash.
   - Al abrir la app, al volver a ella y al recuperar conexión se descarga el progreso y se FUSIONA
     con el local (lecciones, tarjetas, XP, racha…): no se pierde lo hecho sin conexión en ningún aparato.
   - Cada cambio se sube a los pocos segundos. Sin conexión, la app sigue funcionando con lo local. */
import { useEffect, useRef, useState } from "react";

// Proyecto de Supabase. La clave «publishable/anon» es pública por diseño (va en el navegador).
export const SUPABASE_URL = "https://epkmnclbxqbegfkzctlq.supabase.co";
export const SUPABASE_KEY = "";

const enabled = () => !!SUPABASE_KEY;

async function sha256hex(text) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const syncSecret = (user, pass) => sha256hex(`tacita-sync:${user.trim().toLowerCase()}:${pass.trim()}`);

async function rpc(fn, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  return res.json();
}

/* ---------- Fusión de dos progresos ---------- */
const maxBy = (a, b, f) => (!a ? b : !b ? a : f(b) > f(a) ? b : a);
const mergeMap = (a = {}, b = {}, pick) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v;
  return out;
};
const unionById = (a = [], b = [], limit = 30) => {
  const seen = new Map();
  for (const x of [...a, ...b]) if (!seen.has(x.id)) seen.set(x.id, x);
  return [...seen.values()].sort((x, y) => (y.date || "").localeCompare(x.date || "")).slice(0, limit);
};
const maxFields = (a = {}, b = {}) => mergeMap(a, b, (x, y) => (typeof x === "number" && typeof y === "number" ? Math.max(x, y) : y ?? x));

/** Fusiona el progreso de dos dispositivos. `newer` decide ajustes, plan y examen en curso. */
export function mergeStores(local, remote, localNewer) {
  if (!remote) return local;
  const [base, other] = localNewer ? [local, remote] : [remote, local];
  const sa = local.streak || {};
  const sb = remote.streak || {};
  const lastStreak = (sa.last || "") === (sb.last || "") ? maxBy(sa, sb, (s) => s.count || 0) : maxBy(sa, sb, (s) => s.last || "");
  return {
    ...other,
    ...base,
    xp: Math.max(local.xp || 0, remote.xp || 0),
    streak: {
      ...lastStreak,
      best: Math.max(sa.best || 0, sb.best || 0),
      days: [...new Set([...(sa.days || []), ...(sb.days || [])])].sort().slice(-60),
    },
    achievements: mergeMap(local.achievements, remote.achievements, (x, y) => (x < y ? x : y)),
    history: unionById(local.history, remote.history),
    cardsHistory: unionById(local.cardsHistory, remote.cardsHistory),
    totals: maxFields(local.totals, remote.totals),
    counters: maxFields(local.counters, remote.counters),
    blockStats: mergeMap(local.blockStats, remote.blockStats, (x, y) => maxBy(x, y, (s) => s.t || 0)),
    temaStats: mergeMap(local.temaStats, remote.temaStats, (x, y) => maxBy(x, y, (s) => s.t || 0)),
    daily: maxFields(local.daily, remote.daily),
    log: mergeMap(local.log, remote.log, maxFields),
    goalDays: [...new Set([...(local.goalDays || []), ...(remote.goalDays || [])])].sort(),
    mistakes: mergeMap(local.mistakes, remote.mistakes, (x, y) => maxBy(x, y, (m) => m.last || "")),
    cards: mergeMap(local.cards, remote.cards, (x, y) => maxBy(x, y, (c) => c.seen || 0)),
    lessons: mergeMap(local.lessons, remote.lessons, (x, y) => ({
      done: !!(x.done || y.done),
      best: Math.max(x.best || 0, y.best || 0),
      times: Math.max(x.times || 0, y.times || 0),
      last: (x.last || "") > (y.last || "") ? x.last : y.last,
    })),
    units: mergeMap(local.units, remote.units, (x, y) => (x < y ? x : y)),
    temaExams: mergeMap(local.temaExams, remote.temaExams, (x, y) => ({
      best: Math.max(x.best || 0, y.best || 0),
      passed: !!(x.passed || y.passed),
      last: (x.last || "") > (y.last || "") ? x.last : y.last,
    })),
    onboarded: !!(local.onboarded || remote.onboarded),
  };
}

/* ---------- Hook ---------- */
const stampKey = (user) => `tacita-sync-t:${user}`;
const readStamp = (user) => {
  try {
    return Number(localStorage.getItem(stampKey(user)) || 0);
  } catch (e) {
    return 0;
  }
};
const writeStamp = (user, t) => {
  try {
    localStorage.setItem(stampKey(user), String(t));
  } catch (e) {
    /* sin almacenamiento */
  }
};

/**
 * Mantiene el progreso sincronizado. Devuelve el estado: "off" | "syncing" | "ok" | "offline".
 * `access`: { user, pass } guardados al iniciar sesión.
 */
export function useSync(access, store, setStore) {
  const [status, setStatus] = useState(enabled() && access ? "syncing" : "off");
  const secret = useRef(null);
  const ready = useRef(false); // no subir nada hasta haber descargado una vez
  const applying = useRef(false); // el cambio viene de la nube: marcarlo, pero no volver a subirlo al instante
  const storeRef = useRef(store);
  storeRef.current = store;
  const timer = useRef(null);

  const push = async (data) => {
    if (!secret.current) return;
    const t = Date.now();
    try {
      setStatus("syncing");
      const ok = await rpc("guardar_progreso", { p_usuario: access.user, p_secreto: secret.current, p_datos: { t, store: data } });
      if (ok === false) throw new Error("credenciales");
      writeStamp(access.user, t);
      setStatus("ok");
    } catch (e) {
      setStatus("offline");
    }
  };

  const pull = async () => {
    if (!secret.current) return;
    try {
      setStatus("syncing");
      const res = await rpc("leer_progreso", { p_usuario: access.user, p_secreto: secret.current });
      if (!res) throw new Error("credenciales");
      const remote = res.datos;
      const local = storeRef.current;
      const localT = readStamp(access.user);
      // Un examen en curso en este aparato no se toca hasta terminarlo.
      const merged = mergeStores(local, remote?.store, !remote || localT >= (remote.t || 0) || !!local.activeExam);
      ready.current = true;
      if (JSON.stringify(merged) !== JSON.stringify(local)) {
        applying.current = true;
        setStore(merged);
      }
      await push(merged);
    } catch (e) {
      ready.current = true; // sin conexión: se trabaja en local y se sube al volver
      setStatus("offline");
    }
  };

  useEffect(() => {
    if (!enabled() || !access) return undefined;
    let alive = true;
    (async () => {
      secret.current = await syncSecret(access.user, access.pass);
      if (alive) pull();
    })();
    const onVisible = () => document.visibilityState === "visible" && pull();
    window.addEventListener("online", pull);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.removeEventListener("online", pull);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cada cambio local se sube a los 3 s (agrupando ráfagas). Lo que llega de la nube no se resube.
  useEffect(() => {
    if (!enabled() || !access || !ready.current) return undefined;
    if (applying.current) {
      applying.current = false;
      return undefined;
    }
    writeStamp(access.user, Date.now());
    clearTimeout(timer.current);
    timer.current = setTimeout(() => push(storeRef.current), 3000);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  return status;
}
