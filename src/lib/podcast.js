/* Pódcast de las lecciones: Carmen explica y Pepe pregunta (audio generado con voces de Gemini, cifrado como los
   apuntes). Hay un solo reproductor para toda la app: sigue sonando al cambiar de pantalla y se controla también
   desde la pantalla de bloqueo del móvil (Media Session). */
import { useSyncExternalStore } from "react";
import { loadAudio } from "./docs.js";

const RATE_KEY = "tacita-pod-velocidad";
const HEARD_KEY = "tacita-pod-oidos";
export const RATES = [1, 1.25, 1.5, 0.85];

const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch (e) {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    /* sin almacenamiento */
  }
};

/** Episodios de un tema: [{ key, tema, i, title, f, s }] (solo las lecciones que ya tienen audio). */
export function episodesOf(bank, temaId) {
  const t = bank?.temas?.find((x) => x.id === temaId);
  const pod = bank?.docs?.podcast?.[temaId] || {};
  return (t?.lecciones || []).map((l, i) => pod[i] && { key: `${temaId}-${i}`, tema: temaId, numero: t.numero, i, title: l.titulo, f: pod[i].f, s: pod[i].s }).filter(Boolean);
}
export const hasPodcast = (bank, temaId) => Object.keys(bank?.docs?.podcast?.[temaId] || {}).length > 0;
export const fmtTime = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

let state = { queue: [], index: -1, playing: false, loading: false, time: 0, dur: 0, rate: read(RATE_KEY, 1), heard: read(HEARD_KEY, {}), error: false };
let bankRef = null;
const subs = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};
const audio = typeof Audio !== "undefined" ? new Audio() : null;
const ms = typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null;

if (audio) {
  audio.preload = "auto";
  audio.addEventListener("timeupdate", () => set({ time: audio.currentTime, dur: audio.duration || state.dur }));
  audio.addEventListener("play", () => set({ playing: true }));
  audio.addEventListener("pause", () => set({ playing: false }));
  audio.addEventListener("ended", () => {
    const ep = state.queue[state.index];
    if (ep) {
      const heard = { ...state.heard, [ep.key]: true };
      write(HEARD_KEY, heard);
      set({ heard });
    }
    if (state.index < state.queue.length - 1) go(state.index + 1);
    else set({ playing: false });
  });
}

async function go(index) {
  const ep = state.queue[index];
  if (!audio || !ep) return;
  set({ index, loading: true, time: 0, dur: ep.s, error: false });
  try {
    const url = await loadAudio(bankRef, ep.f);
    if (state.queue[state.index] !== ep) return; // ya se eligió otro
    audio.src = url;
    audio.playbackRate = state.rate;
    await audio.play();
  } catch (e) {
    set({ error: true, playing: false });
  } finally {
    set({ loading: false });
  }
  if (ms) {
    try {
      ms.metadata = new MediaMetadata({ title: ep.title, artist: `Tacita · Tema ${ep.numero}`, album: "Pódcast del temario" });
    } catch (e) {
      /* sin metadatos */
    }
  }
}

export const player = {
  /** Pone una lista y empieza por `start`. */
  play(bank, queue, start = 0) {
    bankRef = bank;
    set({ queue });
    go(start);
  },
  toggle() {
    if (!audio || state.index < 0) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  },
  seek(delta) {
    if (audio && state.index >= 0) audio.currentTime = Math.max(0, Math.min((audio.duration || 0) - 0.5, audio.currentTime + delta));
  },
  seekTo(t) {
    if (audio && state.index >= 0) audio.currentTime = t;
  },
  next: () => state.index < state.queue.length - 1 && go(state.index + 1),
  prev: () => (audio && audio.currentTime > 5 ? (audio.currentTime = 0) : state.index > 0 && go(state.index - 1)),
  cycleRate() {
    const rate = RATES[(RATES.indexOf(state.rate) + 1) % RATES.length];
    write(RATE_KEY, rate);
    if (audio) audio.playbackRate = rate;
    set({ rate });
  },
  stop() {
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    set({ queue: [], index: -1, playing: false, time: 0 });
  },
};

if (ms) {
  const h = (a, f) => {
    try {
      ms.setActionHandler(a, f);
    } catch (e) {
      /* acción no admitida */
    }
  };
  h("play", () => player.toggle());
  h("pause", () => player.toggle());
  h("seekbackward", () => player.seek(-15));
  h("seekforward", () => player.seek(15));
  h("previoustrack", () => player.prev());
  h("nexttrack", () => player.next());
}

export const usePodcast = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state);
