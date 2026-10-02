/* Modo escuchar: lee los apuntes en voz alta con la síntesis de voz del propio dispositivo (sin servicios externos).
   Lee un fragmento cada vez; al acabar pasa al siguiente. Se puede pausar, parar y cambiar la velocidad. */
import { useEffect, useRef, useState } from "react";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

let voice = null;
function spanishVoice() {
  if (voice) return voice;
  const voices = window.speechSynthesis.getVoices();
  voice = voices.find((v) => v.lang === "es-ES") || voices.find((v) => v.lang?.startsWith("es")) || null;
  return voice;
}
if (canSpeak()) window.speechSynthesis.onvoiceschanged = () => (voice = null);

/** Limpia el texto para leerlo: sin **negritas**, con abreviaturas habituales desarrolladas. */
export const speakable = (t = "") =>
  t
    .replace(/\*\*/g, "")
    .replace(/\bart\.\s*/gi, "artículo ")
    .replace(/\barts\.\s*/gi, "artículos ")
    .replace(/\bnº\s*/gi, "número ")
    .replace(/\bp\. ej\./gi, "por ejemplo")
    .replace(/\s+/g, " ")
    .trim();

/**
 * items: [{ id, text }]. Devuelve { index, playing, rate, play(from), pause, resume, stop, setRate }.
 * `index` es el fragmento que se está leyendo (o -1).
 */
export function useReader(items) {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const ref = useRef({ items, rate, index: -1, active: false });
  ref.current.items = items;
  ref.current.rate = rate;

  const speakFrom = (i) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const list = ref.current.items;
    if (i >= list.length) {
      ref.current.active = false;
      setPlaying(false);
      setIndex(-1);
      return;
    }
    ref.current.index = i;
    ref.current.active = true;
    setIndex(i);
    setPlaying(true);
    const u = new SpeechSynthesisUtterance(speakable(list[i].text));
    const v = spanishVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "es-ES";
    u.rate = ref.current.rate;
    u.onend = () => {
      if (ref.current.active && ref.current.index === i) speakFrom(i + 1);
    };
    synth.speak(u);
  };

  const play = (from = 0) => canSpeak() && speakFrom(Math.max(0, from));
  const pause = () => {
    window.speechSynthesis.pause();
    setPlaying(false);
  };
  const resume = () => {
    window.speechSynthesis.resume();
    setPlaying(true);
  };
  const stop = () => {
    ref.current.active = false;
    window.speechSynthesis.cancel();
    setPlaying(false);
    setIndex(-1);
  };
  const setRate = (r) => {
    setRateState(r);
    ref.current.rate = r;
    if (ref.current.active) speakFrom(ref.current.index); // vuelve a empezar el fragmento con la nueva velocidad
  };

  useEffect(() => () => canSpeak() && window.speechSynthesis.cancel(), []);
  return { index, playing, rate, play, pause, resume, stop, setRate };
}
