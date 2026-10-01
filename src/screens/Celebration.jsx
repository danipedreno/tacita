import { useEffect, useMemo, useRef, useState } from "react";
import { Fire } from "@phosphor-icons/react";
import { ACHIEVEMENTS, MEDAL_FAMILIES, RANKS, ROMAN, fmt2, medalProgress } from "../lib/logic.js";
import { useCountUp, useReducedMotion } from "../lib/motion.js";
import { Button, Galones, Illustration, MedalBadge } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import { play } from "../lib/sound.js";
import { ligaInfo, tramoLabel } from "../lib/liga.js";
import { FoodIcon } from "../foods.jsx";

/* Pantallas de celebración a pantalla completa (bucle de Duolingo): al terminar un test se
   encadenan test completado → racha → meta diaria → medallas → ascenso, cada una con «Continuar».
   Son poco frecuentes, así que aquí sí hay deleite: confeti, rebote suave y vibración en Android. */

const CONFETTI_COLORS = [PAL.sun, PAL.sky, PAL.peach, PAL.mint, PAL.lilac, PAL.plum, PAL.ink];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, k) => ({
        left: Math.random() * 100,
        delay: Math.random() * 250,
        duration: 1600 + Math.random() * 1100,
        drift: (Math.random() - 0.5) * 120,
        spin: 360 + Math.random() * 540,
        color: CONFETTI_COLORS[k % CONFETTI_COLORS.length],
        w: 6 + Math.random() * 6,
      })),
    []
  );
  return (
    <div className="confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, k) => (
        <span
          key={k}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 1.6,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            "--drift": `${p.drift}px`,
            "--spin": `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** Anillo de progreso de la meta diaria. */
const BURST = Array.from({ length: 14 }, (_, k) => {
  const angle = (k / 14) * Math.PI * 2;
  const dist = 78 + (k % 3) * 14;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist)}px`,
    rot: `${(k % 2 ? 1 : -1) * (120 + k * 20)}deg`,
    color: CONFETTI_COLORS[k % CONFETTI_COLORS.length],
    delay: `${120 + (k % 4) * 30}ms`,
  };
});

/** Anillo de progreso de la meta diaria. Con `celebrate`, da un pulso y suelta una ráfaga de confeti (una vez). */
export function GoalRing({ done, goal, size = 132, stroke = 12, color = PAL.ink, track = "rgba(34,34,34,0.12)", celebrate = false, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, goal ? done / goal : 0);
  return (
    <div className={`relative shrink-0 ${celebrate ? "goal-pop" : ""}`} style={{ width: size, height: size }}>
      {celebrate &&
        BURST.map((p, k) => (
          <span
            key={k}
            className="burst-piece"
            aria-hidden="true"
            style={{ background: p.color, "--dx": p.dx, "--dy": p.dy, "--rot": p.rot, animationDelay: p.delay }}
          />
        ))}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function CountUp({ value }) {
  return useCountUp(value, { duration: 1 });
}

function testScreen(report) {
  const { grade, xpParts } = report;
  const art = grade.over10 >= 7 ? "resultado-alto" : grade.over10 >= 4 ? "resultado-medio" : "resultado-bajo";
  return {
    bg: PAL.sky,
    kicker: "Test completado",
    title: grade.over10 >= 7 ? "¡Muy bien!" : grade.over10 >= 4 ? "¡Buen trabajo!" : "¡A seguir!",
    confetti: grade.over10 >= 7,
    visual: (
      <div className="w-48 h-48 anim-hop">
        <Illustration name={art} className="w-full" alt="" />
      </div>
    ),
    body: (
      <>
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
          <div className="rounded-folder bg-sun text-ink py-3">
            <p className="font-mono text-2xl font-semibold">
              +<CountUp value={report.xpGained} />
            </p>
            <p className="text-xs font-semibold">XP</p>
          </div>
          <div className="rounded-folder bg-card py-3">
            <p className="font-mono text-2xl font-semibold">
              {grade.correct}/{grade.n}
            </p>
            <p className="text-xs">Aciertos</p>
          </div>
          <div className="rounded-folder bg-card py-3">
            <p className="font-mono text-2xl font-semibold">{fmt2(grade.over10)}</p>
            <p className="text-xs">Sobre 10</p>
          </div>
        </div>
        <p className="font-mono text-xs text-ink mt-3">
          {xpParts.correct} por aciertos{xpParts.test ? ` · +${xpParts.test} por terminar` : ""}
          {xpParts.goal ? ` · +${xpParts.goal} meta diaria` : ""}
        </p>
        <p className="text-sm text-ink mt-2">
          Hoy llevas {report.dailyDone} de {report.dailyGoal} ejercicios de tu meta.
        </p>
      </>
    ),
  };
}

function cardsScreen(report) {
  const ratio = report.n ? report.known / report.n : 0;
  return {
    bg: PAL.peach,
    kicker: "Repaso completado",
    title: ratio >= 0.7 ? "¡Muy bien!" : "¡Buen repaso!",
    confetti: ratio >= 0.9,
    visual: (
      <div className="w-48 h-48 anim-hop">
        <Illustration name="test-listo" className="w-full" alt="" />
      </div>
    ),
    body: (
      <>
        <div className="grid grid-cols-2 gap-2 w-full max-w-[16rem]">
          <div className="rounded-folder bg-sun text-ink py-3">
            <p className="font-mono text-2xl font-semibold">
              +<CountUp value={report.xpGained} />
            </p>
            <p className="text-xs font-semibold">XP</p>
          </div>
          <div className="rounded-folder bg-card py-3">
            <p className="font-mono text-2xl font-semibold">
              {report.known}/{report.n}
            </p>
            <p className="text-xs">Te las sabías</p>
          </div>
        </div>
        <p className="font-mono text-xs text-ink mt-3">
          {report.xpParts.cards} por tarjetas{report.xpParts.combo ? ` · +${report.xpParts.combo} por rachas` : ""}
          {report.xpParts.goal ? ` · +${report.xpParts.goal} meta diaria` : ""}
          {report.bestCombo >= 2 ? ` · mejor racha ×${report.bestCombo}` : ""}
        </p>
        <p className="text-sm text-ink mt-2">
          Hoy llevas {report.dailyDone} de {report.dailyGoal} de tu meta.
        </p>
      </>
    ),
  };
}

function lessonScreen(report) {
  const perfect = report.interactive && report.firstTry === report.interactive;
  return {
    bg: report.newUnit ? PAL.sun : PAL.mint,
    kicker: report.newUnit ? "¡Tema terminado!" : report.repeat ? "Lección repasada" : "Lección completada",
    title: perfect ? "¡Perfecta!" : report.pct >= 70 ? "¡Muy bien!" : "¡Hecho!",
    confetti: perfect || report.newUnit,
    visual: (
      <div className="w-48 h-48 anim-hop">
        <Illustration name={perfect ? "resultado-alto" : "test-listo"} className="w-full" alt="" />
      </div>
    ),
    body: (
      <>
        <p className="font-serif text-[20px] leading-snug max-w-xs mb-3">{report.title}</p>
        <div className="grid grid-cols-2 gap-2 w-full max-w-[16rem]">
          <div className="rounded-folder bg-sun text-ink py-3">
            <p className="font-mono text-2xl font-semibold">
              +<CountUp value={report.xpGained} />
            </p>
            <p className="text-xs font-semibold">XP</p>
          </div>
          <div className="rounded-folder bg-card py-3">
            <p className="font-mono text-2xl font-semibold">{report.pct} %</p>
            <p className="text-xs">A la primera</p>
          </div>
        </div>
        <p className="text-sm text-ink mt-3 max-w-xs">
          {report.newUnit
            ? "Has visto todas las lecciones del tema. Ahora toca su examen: lo tienes al final del camino."
            : `Hoy llevas ${report.dailyDone} de ${report.dailyGoal} ejercicios de tu meta.`}
        </p>
      </>
    ),
  };
}

function screenFor(item, report, store) {
  if (item.type === "lesson") return lessonScreen(report);
  if (item.type === "test") return testScreen(report);
  if (item.type === "cards") return cardsScreen(report);

  if (item.type === "streak") {
    const racha = MEDAL_FAMILIES.find((f) => f.id === "racha");
    const next = medalProgress(racha, store).next;
    return {
      bg: PAL.sun,
      kicker: "Racha de estudio",
      title: `¡${item.count} ${item.count === 1 ? "día" : "días"}!`,
      confetti: item.count > 1,
      visual: (
        <div className="relative">
          <div className="w-48 h-48 anim-hop">
            <Illustration name="racha-activa" className="w-full" alt="" />
          </div>
          <span className="absolute -bottom-2 -right-2 w-14 h-14 blob-2 bg-ink text-sun flex items-center justify-center">
            <Fire size={30} weight="fill" className="anim-flicker" />
          </span>
        </div>
      ),
      body: (
        <p className="text-base max-w-xs">
          {item.count === 1 ? "Has encendido la racha. Vuelve mañana para que crezca." : "Vuelve mañana para mantenerla."}
          {next && <span className="block font-mono text-sm mt-2">Medalla «En racha» {ROMAN[medalProgress(racha, store).level + 1]} a los {next} días</span>}
        </p>
      ),
    };
  }

  if (item.type === "liga") {
    const info = ligaInfo(item.after);
    return {
      bg: info.cat.color,
      kicker: item.up ? "¡Subes en la liga!" : "Liga gaditana",
      title: item.up ? tramoLabel(info) : `${item.gained >= 0 ? "+" : ""}${item.gained} ${Math.abs(item.gained) === 1 ? "punto" : "puntos"}`,
      confetti: item.up,
      visual: (
        <div className="w-44 h-44 blob bg-card flex items-center justify-center">
          <FoodIcon name={info.cat.icon} className={`w-32 h-32 ${item.up ? "anim-hop" : ""}`} />
        </div>
      ),
      body: (
        <>
          <p className="text-base max-w-xs">
            {item.up ? `${item.gained >= 0 ? "+" : ""}${item.gained} puntos en este examen. ` : `Sigues en ${tramoLabel(info)}. `}
            Llevas {item.after} {item.after === 1 ? "punto" : "puntos"}.
          </p>
          <p className="font-mono text-sm mt-2">{info.next ? `${tramoLabel(info.next)} a los ${info.next.min}` : "¡Lo más alto de la liga!"}</p>
        </>
      ),
    };
  }

  if (item.type === "goal") {
    return {
      bg: PAL.mint,
      kicker: "Meta diaria",
      title: "¡Meta cumplida!",
      confetti: true,
      visual: (
        <GoalRing done={item.goal} goal={item.goal} size={160}>
          <span className="font-mono text-3xl font-semibold">{item.goal}</span>
          <span className="text-xs">ejercicios</span>
        </GoalRing>
      ),
      body: <p className="text-base max-w-xs">+50 XP extra. Mañana, otra vez: así se llega al examen.</p>,
    };
  }

  if (item.type === "special") {
    const a = ACHIEVEMENTS.find((x) => x.id === item.id);
    return {
      bg: PAL.lilac,
      kicker: "¡Enhorabuena!",
      title: "Nueva medalla",
      confetti: true,
      visual: (
        <div className="w-48 h-48 anim-hop">
          <Illustration name={a.illustration} fallback={a.fallback} className="w-full" alt="" />
        </div>
      ),
      body: (
        <>
          <p className="font-serif text-[26px] leading-tight">{a.name}</p>
          <p className="text-base text-ink mt-1 max-w-xs">{a.desc}</p>
        </>
      ),
    };
  }

  if (item.type === "tier") {
    const f = MEDAL_FAMILIES.find((x) => x.id === item.family);
    const next = f.tiers[item.level];
    return {
      bg: f.color,
      kicker: "¡Enhorabuena!",
      title: `Nivel ${ROMAN[item.level]}`,
      confetti: true,
      visual: (
        <div className="w-44 h-44 blob bg-card flex items-center justify-center">
          <MedalBadge family={f} level={item.level} size={104} />
        </div>
      ),
      body: (
        <>
          <p className="font-serif text-[26px] leading-tight">{f.name}</p>
          <p className="text-base mt-1 max-w-xs">
            {f.tiers[item.level - 1]} {f.unit}.
          </p>
          <p className="font-mono text-sm mt-2">{next ? `Siguiente nivel: ${next} ${f.unit}` : "¡Nivel máximo!"}</p>
        </>
      ),
    };
  }

  // rank
  const rank = RANKS.find((r) => r.level === item.level);
  return {
    bg: PAL.plum,
    dark: true,
    kicker: "¡Ascenso!",
    title: rank.name,
    confetti: true,
    visual: (
      <div className="w-48 h-48 anim-hop">
        <Illustration name={rank.illustration} className="w-full" alt="" />
      </div>
    ),
    body: (
      <>
        <Galones level={rank.level} onDark />
        <p className="text-base mt-3 max-w-xs">Nivel {rank.level} de 5. Sigue sumando XP para el siguiente rango.</p>
      </>
    ),
  };
}

export default function Celebrations({ queue, report, store, onDone }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const dialogRef = useRef(null);
  const item = queue[i];

  // El foco entra en el diálogo (para lectores de pantalla y teclado) sin marcar ningún botón.
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    play("celebrate");
    // Vibración corta en Android (en iOS la web no puede vibrar).
    try {
      navigator.vibrate?.(item.type === "test" ? 20 : [30, 60, 40]);
    } catch (e) {
      /* sin vibración */
    }
  }, [i, item.type]);

  // Intro o espacio también continúan (escritorio).
  const nextRef = useRef();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nextRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const s = screenFor(item, report, store);
  const dark = s.dark === true;
  const next = () => (i + 1 < queue.length ? setI(i + 1) : onDone());
  nextRef.current = next;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className={`fixed inset-0 z-[70] flex flex-col outline-none transition-colors duration-300 ${dark ? "text-ground" : "text-ink"}`}
      style={{ background: s.bg }}
      role="dialog"
      aria-modal="true"
      aria-label={`${s.kicker}: ${s.title}`}
    >
      {s.confetti && !reduce && <Confetti key={i} />}
      <div key={i} className="relative flex-1 flex flex-col items-center justify-center text-center gap-5 px-6 pt-safe">
        <p className="label celebrate-in">{s.kicker}</p>
        <h2 className={`display text-[54px] celebrate-pop max-w-sm ${dark ? "text-lilac" : ""}`}>{s.title}</h2>
        <div className="celebrate-in" style={{ animationDelay: "120ms" }}>
          {s.visual}
        </div>
        <div className="celebrate-in flex flex-col items-center" style={{ animationDelay: "220ms" }}>
          {s.body}
        </div>
      </div>
      <div className="relative px-6 pb-safe pt-4 w-full max-w-md mx-auto">
        {queue.length > 1 && (
          <div className="flex justify-center gap-1.5 mb-4" aria-label={`Pantalla ${i + 1} de ${queue.length}`}>
            {queue.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-[width,opacity] duration-300 ease-out ${k === i ? "w-6 opacity-100" : "w-1.5 opacity-40"} ${dark ? "bg-lilac" : "bg-ink"}`} />
            ))}
          </div>
        )}
        <Button variant={dark ? "yellow" : "ink"} onClick={next} className="w-full">
          {i + 1 < queue.length ? "Continuar" : report.kind === "cards" || report.kind === "lesson" ? "Terminar" : "Ver resultado"}
        </Button>
      </div>
    </div>
  );
}
