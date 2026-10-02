import { useEffect, useState } from "react";
import { POLLO, PolloShape } from "../pollo.jsx";

/* Arranque de Opoempollo: cae un huevo, se tambalea, se agrieta y sale el pollito de un salto (primero sorprendido,
   luego feliz) entre chispas; después se escribe el nombre letra a letra. Dura ~2,6 s; un toque lo salta.
   Con «reducir movimiento» no se muestra. */
const NAME = "Opoempollo";
const TOTAL = 2600;
const OUT = 320;

// Huevo (centrado en 100, 112) y la línea de la grieta.
const EGG = "M100 16C140 16 176 74 176 128C176 174 143 200 100 200C57 200 24 174 24 128C24 74 60 16 100 16Z";
const CRACK = "M24 116L44 104L60 122L78 102L94 124L112 100L128 122L146 102L162 120L176 108";
const TOP = `M0 0H200V108L176 108L162 120L146 102L128 122L112 100L94 124L78 102L60 122L44 104L24 116L0 116Z`;
const BOTTOM = `M0 220H200V108L176 108L162 120L146 102L128 122L112 100L94 124L78 102L60 122L44 104L24 116L0 116Z`;
const SPARKS = [
  [-70, -40, POLLO.feet],
  [72, -46, "#f2b48c"],
  [-86, 18, "#c3ca85"],
  [88, 14, POLLO.feet],
  [-40, -78, "#a9bccf"],
  [44, -80, "#f2b48c"],
  [0, -96, POLLO.feet],
];

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const [face, setFace] = useState("surprised");

  useEffect(() => {
    const t0 = setTimeout(() => setFace("happy"), 1500);
    const t1 = setTimeout(() => setLeaving(true), TOTAL);
    const t2 = setTimeout(onDone, TOTAL + OUT);
    return () => (clearTimeout(t0), clearTimeout(t1), clearTimeout(t2));
  }, [onDone]);

  const skip = () => {
    setLeaving(true);
    setTimeout(onDone, OUT);
  };

  const egg = (clip) => (
    <g clipPath={`url(#${clip})`}>
      <path d={EGG} fill="#fffaf0" />
      <ellipse cx="74" cy="66" rx="13" ry="20" fill="#fff" transform="rotate(24 74 66)" opacity="0.9" />
      <path d={EGG} fill="none" stroke={POLLO.line} strokeWidth="4.4" />
      <circle cx="132" cy="150" r="5" fill={POLLO.shade} opacity="0.55" />
      <circle cx="62" cy="160" r="3.4" fill={POLLO.shade} opacity="0.55" />
    </g>
  );

  return (
    <div
      onPointerDown={skip}
      aria-hidden="true"
      className={`splash fixed inset-0 z-[90] bg-ground flex flex-col items-center justify-center overflow-hidden ${leaving ? "splash-out" : ""}`}
    >
      <div className="w-56 relative">
        <svg viewBox="0 -10 200 230" className="w-full h-auto overflow-visible">
          <defs>
            <clipPath id="sp-top">
              <path d={TOP} />
            </clipPath>
            <clipPath id="sp-bottom">
              <path d={BOTTOM} />
            </clipPath>
          </defs>
          <ellipse cx="100" cy="206" rx="70" ry="8" fill={POLLO.shadow} className="sp-shadow" />
          {/* chispas al romperse */}
          <g transform="translate(100 120)">
            {SPARKS.map(([x, y, c], i) => (
              <circle key={i} r={i % 2 ? 5 : 7} fill={c} className="sp-spark" style={{ "--x": `${x}px`, "--y": `${y}px`, animationDelay: `${1180 + i * 25}ms` }} />
            ))}
          </g>
          {/* el pollito sale de un salto */}
          <g className="sp-chick">
            <g transform="translate(6 18) scale(0.94)">
              <PolloShape face={face} shadow={false} uid="splash" />
            </g>
          </g>
          {/* el huevo: cae, se tambalea, se agrieta y se abre */}
          <g className="sp-egg">
            <g className="sp-wobble">
              <g className="sp-bottom">{egg("sp-bottom")}</g>
              <g className="sp-top">{egg("sp-top")}</g>
              <path d={CRACK} fill="none" stroke={POLLO.line} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" className="sp-crack" pathLength="1" />
            </g>
          </g>
        </svg>
      </div>
      <p className="brand text-[54px] mt-1 leading-none tracking-tight">
        {[...NAME].map((c, i) => (
          <span key={i} className="splash-letter" style={{ animationDelay: `${1500 + i * 55}ms`, color: i < 3 ? POLLO.feetDark : undefined }}>
            {c}
          </span>
        ))}
      </p>
      <p className="label text-ink-soft mt-3 sp-tag">Subalterno · Ayuntamiento de Cádiz</p>
    </div>
  );
}

export const shouldShowSplash = () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
