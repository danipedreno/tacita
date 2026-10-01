/* Movimiento (criterios de Emil Kowalski):
   - ease-out fuerte para lo que entra o responde; ease-in-out para lo que se desplaza. Nunca ease-in.
   - 150–300 ms en interfaz; las salidas, más rápidas que las entradas.
   - Solo transform y opacity. Nada aparece desde scale(0): como mínimo 0.9.
   - Rebote solo en celebraciones poco frecuentes.
   Todo lo predefinido va en CSS (src/index.css): corre fuera del hilo principal y no pesa en el bundle. */
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const [reduce, setReduce] = useState(() => typeof window !== "undefined" && window.matchMedia?.(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

// Aproximación de la curva ease-out fuerte cubic-bezier(0.23, 1, 0.32, 1).
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

/** Cifra que cuenta hasta su valor (nota del resultado). Con «reducir movimiento» salta directamente. */
/** `from`: valor desde el que empieza a contar (por defecto 0). */
export function useCountUp(value, { duration = 0.9, decimals = 0, from = 0 } = {}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : from);
  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      setDisplay(Number((from + (value - from) * easeOutQuint(t)).toFixed(decimals)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, decimals, reduce, from]);
  return display;
}
