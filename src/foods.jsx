/* Iconos de las categorías de la liga: comidas de Cádiz con ojos, en el mismo estilo plano que los personajes. */
import { MC } from "./mascots.jsx";

function Eye({ cx, cy, r = 6.5, delay }) {
  return (
    <g className="mascot-eye" style={{ animationDelay: delay }}>
      <circle cx={cx} cy={cy} r={r} fill={MC.white} />
      <circle cx={cx + r * 0.15} cy={cy + r * 0.1} r={r * 0.56} fill={MC.ink} />
    </g>
  );
}

const ICONS = {
  // Churro de la Guapa: una rueda de churro en lazo, con azúcar.
  churro: (
    <>
      <g transform="rotate(-28 60 60)">
        <rect x="6" y="40" width="108" height="40" rx="20" fill={MC.rust} />
        {[22, 38, 54, 70, 86, 100].map((x) => (
          <path key={x} d={`M${x} 44V76`} stroke="#a9521f" strokeWidth="3.5" strokeLinecap="round" />
        ))}
      </g>
      {[[30, 34], [86, 26], [22, 90], [98, 76], [64, 100], [48, 22]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2.6" fill={MC.white} />
      ))}
      <Eye cx={49} cy={63} r={8} />
      <Eye cx={71} cy={52} r={8} delay="0.15s" />
    </>
  ),
  // Cazón en adobo: un pescado.
  pescado: (
    <>
      <path d="M86 60L110 40V80Z" fill={MC.forest} />
      <ellipse cx="54" cy="60" rx="40" ry="25" fill={MC.slate} />
      <path d="M44 36Q56 22 70 37Z" fill={MC.forest} />
      <path d="M62 50Q70 60 62 70" stroke={MC.forest} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <Eye cx={32} cy={54} r={7.5} />
      <path d="M20 68Q26 72 32 69" stroke={MC.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  // Garbanzos con choco: una sepia.
  sepia: (
    <>
      {[34, 46, 58, 70, 82].map((x, i) => (
        <path key={x} d={`M${x} 74Q${x + (i % 2 ? 6 : -6)} 92 ${x} 106`} stroke={MC.taupe} strokeWidth="8" strokeLinecap="round" fill="none" />
      ))}
      <path d="M26 78V50A34 34 0 0 1 94 50V78Z" fill={MC.taupe} />
      <path d="M22 44Q12 60 26 74Z M98 44Q108 60 94 74Z" fill={MC.pink} />
      <Eye cx={48} cy={56} r={7.5} />
      <Eye cx={72} cy={56} r={7.5} delay="0.15s" />
      {[[50, 32], [66, 28], [74, 40]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3" fill={MC.pink} />
      ))}
    </>
  ),
  // Chicharrón: un cerdito.
  cerdo: (
    <>
      <path d="M26 34L22 12L46 26Z M94 34L98 12L74 26Z" fill="#e0559f" />
      <circle cx="60" cy="62" r="40" fill={MC.pink} />
      <ellipse cx="60" cy="76" rx="18" ry="12" fill="#e0559f" />
      <ellipse cx="54" cy="76" rx="3.4" ry="4.4" fill={MC.ink} />
      <ellipse cx="66" cy="76" rx="3.4" ry="4.4" fill={MC.ink} />
      <Eye cx={45} cy={52} r={7} />
      <Eye cx={75} cy={52} r={7} delay="0.15s" />
    </>
  ),
};

/** Icono de una categoría de la liga (`name`: churro | pescado | sepia | cerdo). */
export function FoodIcon({ name, className = "", dim = false }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" style={dim ? { opacity: 0.35, filter: "grayscale(1)" } : undefined}>
      {ICONS[name]}
    </svg>
  );
}
