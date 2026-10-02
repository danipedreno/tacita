import { PAL } from "./lib/palette.js";

/* Cajón de archivo abierto con carpetas (recortado de una ilustración de Freepik, solo el cajón).
   «known» = verde (las que te sabes) · «unknown» = coral (las que no). */
const TONES = {
  known: { front: PAL.mint, side: PAL.olive },
  unknown: { front: PAL.sky, side: PAL.plum },
};
const FOLDER = (x) =>
  `M${x + 65.052} 177.581l-1.975-2.445c-1.164-1.695-3.086-2.71-5.142-2.716l-11.001-0.03l-0.027 9.847l-0.066 23.758l43.911 0.121l0.078-28.464Z`;

export function Cajon({ tone = "known", className = "" }) {
  const t = TONES[tone] || TONES.known;
  return (
    <svg viewBox="200 168 146 90" className={className} aria-hidden="true">
      <path d={FOLDER(237.368)} fill={PAL.peach} />
      <path d={FOLDER(205.058)} fill={PAL.lilac} />
      <path d={FOLDER(172.316)} fill={PAL.peach} />
      <rect x="278.937" y="204.036" width="62.632" height="51.256" fill={t.side} />
      <rect x="204.542" y="197.383" width="79.839" height="57.909" fill={t.front} />
      <rect x="226.118" y="221.401" width="36.755" height="4.937" rx="2.4" fill="#fff" opacity="0.85" />
    </svg>
  );
}
