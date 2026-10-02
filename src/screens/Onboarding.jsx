import { useEffect, useRef, useState } from "react";
import { Button, Illustration } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import { Cajon } from "../cajon.jsx";

/* Bienvenida de primera vez: tres pantallas ilustradas que cuentan cómo sacar partido a la app.
   Solo se ve una vez (se marca `onboarded` al terminar o saltarla). */
const SLIDES = [
  {
    bg: PAL.mint,
    art: "tacita",
    title: "Tu tutor del temario",
    text: "Todo el temario de Subalterno del Ayuntamiento de Cádiz en lecciones cortas: te explico, te pregunto y repetimos lo que falles. En Inicio te digo siempre qué toca.",
  },
  {
    bg: PAL.sky,
    art: "simulacro",
    title: "Tests como el examen",
    text: "Más de mil preguntas, muchas de exámenes reales, con cronómetro y penalización por fallo. Al terminar cada tema, su examen. Los fallos se guardan para repasarlos.",
  },
  {
    bg: PAL.peach,
    art: "caja-las-se",
    fallback: "test-listo",
    title: "Tarjetas en un gesto",
    text: "Gira la tarjeta y desliza: a la derecha si te la sabes, a la izquierda si no. Las que fallas vuelven antes.",
  },
  {
    bg: PAL.sun,
    art: "racha-activa",
    title: "Un poco cada día",
    text: "Cumple tu meta diaria, mantén la racha, sube de rango y gana medallas. Pon la fecha de tu examen para contar los días.",
  },
];

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0);
  const dialog = useRef(null);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;

  useEffect(() => {
    dialog.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a Opoempollo"
      className="fixed inset-0 z-[80] flex flex-col outline-none transition-colors duration-300 ease-out"
      style={{ background: s.bg }}
    >
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col px-6 pt-safe pb-safe">
        <div className="flex justify-end h-12 items-center">
          {!last && (
            <button type="button" onClick={onDone} className="tap press px-4 rounded-full text-sm font-semibold">
              Saltar
            </button>
          )}
        </div>
        <div key={i} className="flex-1 flex flex-col justify-center anim-q-next">
          <div className="w-56 h-56 mx-auto p-4 bg-card blob">
            {s.art === "caja-las-se" ? (
              <div className="w-full h-full flex flex-col justify-center gap-3">
                <Cajon tone="known" className="w-full max-w-[140px] h-auto mx-auto" />
                <Cajon tone="unknown" className="w-full max-w-[140px] h-auto mx-auto" />
              </div>
            ) : (
              <Illustration name={s.art} fallback={s.fallback} className="w-full" alt="" />
            )}
          </div>
          <h2 className="display text-[40px] mt-8">{s.title}</h2>
          <p className="text-[17px] leading-relaxed mt-3">{s.text}</p>
        </div>
        <div className="flex justify-center gap-1.5 mb-5" aria-label={`Pantalla ${i + 1} de ${SLIDES.length}`}>
          {SLIDES.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out ${k === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25"}`} />
          ))}
        </div>
        <Button variant="blue" onClick={() => (last ? onDone() : setI(i + 1))} className="w-full mb-2">
          {last ? "Empezar" : "Siguiente"}
        </Button>
      </div>
    </div>
  );
}
