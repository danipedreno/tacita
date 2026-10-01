import { useEffect, useState } from "react";
import logo from "../assets/logo.svg?raw";

/* Logo reveal al abrir la app: la mancha amarilla aparece, la figura se destapa de abajo arriba
   (nido → libro → opositora) y el nombre se escribe letra a letra. Dura ~1,4 s; un toque lo salta.
   Con «reducir movimiento» no se muestra. */
const NAME = "Tacita";
const TOTAL = 1400;
const OUT = 260;

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), TOTAL);
    const t2 = setTimeout(onDone, TOTAL + OUT);
    return () => (clearTimeout(t1), clearTimeout(t2));
  }, [onDone]);

  const skip = () => {
    setLeaving(true);
    setTimeout(onDone, OUT);
  };

  return (
    <div
      onPointerDown={skip}
      aria-hidden="true"
      className={`splash fixed inset-0 z-[90] bg-ground flex flex-col items-center justify-center ${leaving ? "splash-out" : ""}`}
    >
      <div className="splash-logo w-44" dangerouslySetInnerHTML={{ __html: logo }} />
      <p className="brand text-[52px] mt-5 leading-none">
        {[...NAME].map((c, i) => (
          <span key={i} className="splash-letter" style={{ animationDelay: `${720 + i * 45}ms` }}>
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}

export const shouldShowSplash = () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
