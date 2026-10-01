/* Sonidos opcionales, sintetizados con Web Audio (sin archivos que descargar).
   Cortos y suaves: un «tic» al acertar, un tono grave al fallar y una pequeña fanfarria al celebrar.
   Van apagados por defecto; se activan con el altavoz de Inicio. */

let enabled = false;
let ctx = null;

export function setSoundEnabled(on) {
  enabled = !!on;
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/** Una nota con ataque rápido y caída suave (sin clics). */
function note(ac, freq, start, dur, { type = "sine", gain = 0.12 } = {}) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

const SOUNDS = {
  // Acierto: dos notas ascendentes muy cortas.
  correct: (ac, t) => {
    note(ac, 880, t, 0.09);
    note(ac, 1320, t + 0.06, 0.12);
  },
  // Fallo: un tono grave y breve, sin dramatismo.
  wrong: (ac, t) => note(ac, 196, t, 0.16, { type: "triangle", gain: 0.1 }),
  // Tarjeta sabida: un «pop» suave.
  card: (ac, t) => note(ac, 660, t, 0.08, { gain: 0.08 }),
  // Racha de 5: tres notas rápidas.
  combo: (ac, t) => [784, 988, 1175].forEach((f, k) => note(ac, f, t + k * 0.07, 0.12)),
  // Celebración: arpegio mayor.
  celebrate: (ac, t) => [523, 659, 784, 1047].forEach((f, k) => note(ac, f, t + k * 0.09, k === 3 ? 0.4 : 0.16, { gain: 0.1 })),
};

export function play(name) {
  if (!enabled) return;
  try {
    const ac = audio();
    if (!ac || !SOUNDS[name]) return;
    SOUNDS[name](ac, ac.currentTime + 0.01);
  } catch (e) {
    /* sin audio */
  }
}
