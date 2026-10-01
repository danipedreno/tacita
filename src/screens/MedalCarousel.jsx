import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Lock } from "@phosphor-icons/react";
import { ROMAN } from "../lib/logic.js";
import { Illustration, MedalBadge, ProgressBar } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import { useReducedMotion } from "../lib/motion.js";

const ITEM = 206; // ancho de cada diapositiva (px): deja asomar las vecinas

/**
 * Carrusel de medallas (a la manera de AllTrails):
 * - desplazamiento nativo con snap; cada medalla lleva su ficha debajo y todo se desliza junto;
 * - el fondo del panel funde al color de la medalla del centro;
 * - la del centro «flota» (se inclina en 3D despacio); las vecinas se ven más pequeñas y giradas.
 * El transform se escribe directamente en cada nodo en un rAF: sin renders de React por fotograma.
 *
 * items: [{ id, kind: "tier" | "special", title, color, locked, family?, level?, progress?, illustration?, fallback?, desc?, date? }]
 */
export default function MedalCarousel({ items }) {
  const scroller = useRef(null);
  const refs = useRef([]);
  const frame = useRef(0);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const paint = useCallback(() => {
    frame.current = 0;
    const el = scroller.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    refs.current.forEach((node, i) => {
      if (!node) return;
      const d = (node.offsetLeft + node.offsetWidth / 2 - center) / ITEM; // -1 = una a la izquierda
      const a = Math.min(Math.abs(d), 1.5);
      if (Math.abs(d) < best) {
        best = Math.abs(d);
        nearest = i;
      }
      node.style.opacity = String(1 - Math.min(a, 1) * 0.45);
      const sticker = node.firstElementChild;
      if (reduce || !sticker) return;
      const c = Math.max(-1.5, Math.min(1.5, d));
      sticker.style.transform = `perspective(700px) rotateY(${c * -28}deg) rotate(${c * 8}deg) scale(${1 - a * 0.22})`;
    });
    if (nearest !== activeRef.current) {
      activeRef.current = nearest;
      setActive(nearest);
      try {
        navigator.vibrate?.(6); // toque al encajar (solo Android)
      } catch (e) {
        /* sin vibración */
      }
    }
  }, [reduce]);

  const onScroll = () => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };
  useLayoutEffect(() => {
    paint();
  }, [paint, items.length]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const goTo = (i) => {
    const node = refs.current[i];
    const el = scroller.current;
    if (!node || !el) return;
    el.scrollTo({ left: node.offsetLeft + node.offsetWidth / 2 - el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  };

  const bg = items[active]?.locked ? PAL.ground2 : items[active]?.color;

  return (
    <section
      aria-labelledby="carrusel-title"
      className="rounded-[28px] pt-5 pb-5 overflow-hidden transition-colors duration-500 ease-out"
      style={{ background: bg }}
    >
      <h2 id="carrusel-title" className="display text-[26px] text-center">
        Tus medallas
      </h2>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory pt-4"
        style={{ paddingInline: `calc(50% - ${ITEM / 2}px)`, scrollPaddingInline: `calc(50% - ${ITEM / 2}px)` }}
      >
        {items.map((m, i) => {
          const on = i === active;
          return (
            <button
              key={m.id}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              onClick={() => goTo(i)}
              onFocus={() => goTo(i)}
              aria-current={on ? "true" : undefined}
              className="snap-center shrink-0 flex flex-col items-center text-center px-2 outline-offset-4"
              style={{ width: ITEM }}
            >
              {/* La pegatina: el transform de la inclinación va aquí; el de «flotar», en el hijo */}
              <span className="block will-change-transform" aria-hidden="true">
                <span className={`relative w-[156px] h-[156px] blob bg-card flex items-center justify-center shadow-[0_18px_30px_-16px_rgba(33,38,51,0.55)] ${on && !reduce ? "medal-float" : ""}`}>
                  {m.kind === "tier" ? (
                    <MedalBadge family={m.family} level={m.level} size={108} />
                  ) : (
                    <span className={`w-[120px] h-[120px] blob-2 p-2 ${m.locked ? "bg-ground-2" : ""}`} style={m.locked ? undefined : { background: PAL.lilac }}>
                      <Illustration name={m.illustration} fallback={m.fallback} alt="" className={`w-full ${m.locked ? "opacity-30" : ""}`} />
                    </span>
                  )}
                  {m.locked && m.kind === "special" && (
                    <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card paper-shadow flex items-center justify-center">
                      <Lock size={16} weight="bold" />
                    </span>
                  )}
                </span>
              </span>

              {/* Su ficha, que viaja con ella */}
              <span className="block mt-5 w-full">
                <span className="block font-semibold text-[19px] leading-tight">{m.title}</span>
                {m.kind === "tier" ? (
                  <>
                    <span className="block text-sm mt-1">{m.level ? `Nivel ${ROMAN[m.level]} de ${m.progress.max}` : "Aún sin empezar"}</span>
                    <span className="block display font-mono text-[32px] leading-none mt-3">
                      {Math.min(m.progress.value, m.progress.next || m.progress.value)}
                      {m.progress.next ? <span className="text-ink/45"> / {m.progress.next}</span> : null}
                    </span>
                    <span className="block text-xs mt-1 leading-snug">{m.progress.next ? m.family.unit : `¡Nivel máximo! · ${m.family.unit}`}</span>
                    <span className="block w-36 mx-auto mt-3">
                      <ProgressBar pct={m.progress.pct} color={PAL.ink} track="bg-card/70" className="h-2" label={`Progreso de ${m.title}`} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-sm mt-1">
                      {m.date ? `Conseguida el ${new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}` : "Especial · bloqueada"}
                    </span>
                    <span className="block text-sm mt-3 leading-snug">{m.desc}</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5 mt-5" aria-hidden="true">
        {items.map((m, i) => (
          <span key={m.id} className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out ${i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/25"}`} />
        ))}
      </div>
    </section>
  );
}
