import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, BookOpen, CaretRight, Check, Flag, DeviceMobile, Fire, Headphones, Lightning, SpeakerHigh, SpeakerSlash, Sword, Trophy, X, XCircle } from "@phosphor-icons/react";
import { BLOCKS, DAILY_GOALS, MASTERED_AFTER, dateKey, daysUntil, rankInfo, streakView } from "../lib/logic.js";
import { PAL } from "../lib/palette.js";
import { Button, Folder, Galones, IconButton, ArtIcon, Illustration, Paper, ProgressBar, Segmented, Sheet } from "../ui.jsx";
import { GoalRing } from "./Celebration.jsx";
import { useCountUp } from "../lib/motion.js";
import { greeting, missions, nextLesson, recommend } from "../lib/tutor.js";
import { reviewState } from "../lib/srs.js";
import { retoResult } from "../lib/reto.js";
import { POINTS } from "../lib/liga.js";
import { DUEL_SIZE, duelPoints, duelRecord, duelsOf, newDuelId } from "../lib/duelo.js";
import { learnTemas } from "../lib/bank.js";
import { unitColor } from "./Learn.jsx";
import { Avatar } from "../avatars.jsx";
import { episodesOf, usePodcast } from "../lib/podcast.js";

const WEEKDAY = ["D", "L", "M", "X", "J", "V", "S"];

// El archivador de Inicio «entra» solo la primera vez que se abre en la sesión:
// volver a la pestaña es frecuente y repetir la animación la haría pesada.
let introPlayed = false;

export function RankFolder({ xp, from, tab = "Nivel", intro = false }) {
  return (
    <Folder color={PAL.lilac} tab={tab} className={intro ? "anim-folder" : ""}>
      <RankContent xp={xp} from={from} />
    </Folder>
  );
}

/* XP que ya has visto en Inicio: si al volver hay más, se anima la subida (+XP que vuela, barra que se llena). */
const XP_SEEN_KEY = "tacita-xp-visto.v1";
export const readXpSeen = () => {
  try {
    const v = localStorage.getItem(XP_SEEN_KEY);
    return v === null ? null : Number(v);
  } catch (e) {
    return null;
  }
};
export const writeXpSeen = (xp) => {
  try {
    localStorage.setItem(XP_SEEN_KEY, String(xp));
  } catch (e) {
    /* sin almacenamiento */
  }
};

/**
 * Hoja de nivel. Con `from` (XP anterior) la cifra cuenta desde ahí, la barra se llena desde el
 * punto anterior y un «+N XP» sube y se desvanece. Pasa pocas veces al día: aquí sí hay deleite.
 */
export function RankContent({ xp, from }) {
  const { rank, next, pct, toNext } = rankInfo(xp);
  const gained = from != null && xp > from ? xp - from : 0;
  const startPct = gained ? (rankInfo(from).rank.level === rank.level ? rankInfo(from).pct : 0) : pct;
  const [barPct, setBarPct] = useState(startPct);
  const xpShown = useCountUp(xp, { from: gained ? from : xp, duration: 1.1 });
  useEffect(() => {
    // Un fotograma en el punto de partida y luego al nuevo valor: la transición de la barra hace el resto.
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setBarPct(pct)));
    return () => cancelAnimationFrame(f);
  }, [pct]);
  return (
    <div>
      <div className="p-5 flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="label">Rango · nivel {rank.level} de 5</p>
          <p className="display text-[36px] mt-2">{rank.name}</p>
          <div className="mt-3">
            <Galones level={rank.level} />
          </div>
        </div>
        <div className="w-16 h-16 shrink-0 self-start bg-card blob flex items-center justify-center text-plum">
          <ArtIcon name={rank.illustration} size="50%" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="relative font-mono font-semibold">
            {xpShown} XP
            {gained > 0 && (
              <span className="xp-float absolute left-0 -top-6 whitespace-nowrap rounded-full bg-sun px-2 py-0.5 text-xs font-bold" aria-hidden="true">
                +{gained} XP
              </span>
            )}
          </span>
          <span className="text-sm text-right">{next ? `${toNext} XP para ${next.name}` : "Rango máximo"}</span>
        </div>
        <ProgressBar pct={barPct} color={PAL.plum} track="bg-card/70" className="h-3" label="Progreso hasta el siguiente rango" />
      </div>
    </div>
  );
}

export function StreakContent({ streak }) {
  const view = streakView(streak);
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const k = dateKey(d);
    return { k, label: WEEKDAY[d.getDay()], studied: (streak.days || []).includes(k), isToday: i === 6 };
  });
  const art = view.state === "done" ? "racha-activa" : view.state === "pending" ? "racha-pendiente" : "racha-apagada";
  const message = {
    done: "Hoy ya has cumplido. Vuelve mañana.",
    pending: "Haz una lección o un test hoy para no perder la racha.",
    broken: "La racha se ha cortado. Empieza otra hoy.",
    none: "Termina una lección para encender tu primera racha.",
  }[view.state];

  return (
    <div className="p-5">
      <div className="flex gap-4 items-center">
        <div className="w-28 h-28 p-2.5 shrink-0 bg-card blob-2">
          <Illustration name={art} className="w-full" alt="" />
        </div>
        <div className="min-w-0">
          <p className="brand text-[56px] leading-[0.9]">{view.count}</p>
          <p className="text-lg font-medium leading-tight mt-1">{view.count === 1 ? "día seguido" : "días seguidos"}</p>
          <p className="text-sm mt-1 leading-snug">{message}</p>
        </div>
      </div>
      <ol className="grid grid-cols-7 gap-1 mt-5" aria-label="Últimos 7 días">
        {days.map((d) => (
          <li key={d.k} className="flex flex-col items-center gap-1.5">
            <span className={`text-xs ${d.isToday ? "font-bold" : "font-medium"}`}>{d.label}</span>
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500 ${
                d.studied ? "bg-ink text-peach" : d.isToday ? "border-2 border-dashed border-ink/50" : "bg-card/70"
              }`}
              aria-label={d.studied ? "Estudiado" : "Sin estudiar"}
            >
              {d.studied && <Check size={18} weight="bold" />}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm mt-4 flex items-center gap-1.5">
        <Fire size={16} weight="fill" className={view.count ? "text-plum anim-flicker" : "text-ink/40"} />
        Mejor racha: {streak.best || 0} días
      </p>
    </div>
  );
}

/** «Tu examen»: cuenta atrás y meta de hoy, el gancho diario. */
function PlanContent({ store, onPlan }) {
  const today = dateKey();
  const done = store.daily[today] || 0;
  const goal = store.plan.dailyGoal;
  const left = daysUntil(store.plan.examDate, today);
  const [editing, setEditing] = useState(false);
  const [draftDate, setDraftDate] = useState(store.plan.examDate || "");
  const [draftGoal, setDraftGoal] = useState(goal);
  const examLabel = store.plan.examDate
    ? new Date(`${store.plan.examDate}T12:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    : null;

  // La primera vez que se ve la meta cumplida cada día, el anillo lo celebra.
  const [celebrate] = useState(() => {
    if (done < goal) return false;
    try {
      return localStorage.getItem("tacita-meta-celebrada.v1") !== today;
    } catch (e) {
      return false;
    }
  });
  useEffect(() => {
    if (!celebrate) return;
    try {
      localStorage.setItem("tacita-meta-celebrada.v1", today);
      navigator.vibrate?.([20, 40, 20]);
    } catch (e) {
      /* sin almacenamiento o sin vibración */
    }
  }, [celebrate, today]);

  const openEditor = () => {
    setDraftDate(store.plan.examDate || "");
    setDraftGoal(goal);
    setEditing(true);
  };

  return (
    <>
      <div className="p-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          {left === null ? (
            <>
              <p className="display text-[34px]">¿Cuándo es tu examen?</p>
              <p className="text-[15px] mt-2 leading-snug">Pon la fecha y la meta diaria para llevar la cuenta atrás.</p>
            </>
          ) : left < 0 ? (
            <p className="display text-[34px]">El examen ya pasó</p>
          ) : (
            <>
              <p className="brand text-[80px] leading-[0.85]">{left === 0 ? "Hoy" : left}</p>
              <p className="text-lg font-medium mt-2 leading-tight">{left === 0 ? "¡Mucha suerte!" : `${left === 1 ? "día" : "días"} para el examen`}</p>
              <p className="text-sm mt-1 first-letter:uppercase">{examLabel}</p>
              {left === 0 && (
                <div className="w-24 h-24 mt-3 p-1.5 bg-card blob">
                  <Illustration name="dia-del-examen" fallback="ascenso" className="w-full" alt="" />
                </div>
              )}
            </>
          )}
        </div>
        <GoalRing done={done} goal={goal} size={112} stroke={10} color={PAL.ink} track="rgba(34,34,34,0.12)" celebrate={celebrate}>
          <span className="font-mono text-xl font-semibold">
            {Math.min(done, 999)}/{goal}
          </span>
          <span className={`text-xs font-medium ${celebrate ? "anim-pop" : ""}`}>{done >= goal ? "¡meta!" : "hoy"}</span>
        </GoalRing>
      </div>
      <div className="px-5 pb-5">
        <button type="button" onClick={openEditor} className="tap press h-11 px-5 rounded-full bg-ink text-ground text-sm font-semibold">
          {left === null ? "Poner fecha y meta" : "Cambiar fecha o meta"}
        </button>
      </div>

      <Sheet
        open={editing}
        title="Tu plan"
        onClose={() => setEditing(false)}
        body={
          <div className="flex flex-col gap-4 text-ink pt-1">
            <div>
              <label htmlFor="exam-date" className="label text-ink-soft block mb-2">
                Fecha del examen
              </label>
              <input
                id="exam-date"
                type="date"
                min={today}
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="w-full h-12 rounded-full bg-ground border-2 border-line px-4 font-mono text-ink outline-none focus:border-ink"
              />
            </div>
            <Segmented
              label="Meta diaria (ejercicios)"
              value={draftGoal}
              onChange={setDraftGoal}
              options={DAILY_GOALS.map((g) => ({ value: g, label: String(g), sub: g === 40 ? "recomendada" : g === 20 ? "suave" : g === 60 ? "intensa" : "máxima" }))}
            />
          </div>
        }
        actions={
          <>
            <Button
              variant="blue"
              onClick={() => {
                onPlan({ examDate: draftDate || null, dailyGoal: draftGoal });
                setEditing(false);
              }}
            >
              Guardar plan
            </Button>
            <Button variant="paper" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </>
        }
      />
    </>
  );
}

/* Archivador de Inicio, unido al tutor: «Hoy» (el pollo y lo que toca), «Tu examen», «Racha» y «Nivel».
   Las novedades se avisan en la pestaña: un punto en Racha si ha cambiado y «+N» en Nivel si has ganado XP. */
const HOME_FOLDERS = [
  { id: "hoy", label: "Hoy", color: PAL.navy, dark: true },
  { id: "examen", label: "Examen", color: PAL.sun },
  { id: "racha", label: "Racha", color: PAL.peach },
  { id: "nivel", label: "Nivel", color: PAL.lilac },
];
let lastFolder = "hoy";

function HomeCabinet({ bank, store, onPlan, onAction, intro }) {
  const [active, setActive] = useState(lastFolder);
  const [xpFrom, setXpFrom] = useState(undefined);
  const [seenXp, setSeenXp] = useState(readXpSeen);
  const [streakSeen, setStreakSeen] = useState(readStreakSeen);
  const newXp = seenXp === null ? 0 : Math.max(0, store.xp - seenXp);
  const streakNew = streakView(store.streak).state !== "none" && streakSeen !== streakNoticeKey(store.streak);
  // Al abrir una pestaña con novedades, se marca como vista (y el nivel anima la subida de XP).
  useEffect(() => {
    if (active === "nivel" && (newXp || seenXp === null)) {
      setXpFrom(newXp ? seenXp : undefined);
      writeXpSeen(store.xp);
      setSeenXp(store.xp);
    }
    if (active === "racha" && streakNew) {
      markStreakSeen(store.streak);
      setStreakSeen(streakNoticeKey(store.streak));
    }
  }, [active, newXp, seenXp, streakNew, store.xp, store.streak]);
  const tabs = useRef([]);
  const current = HOME_FOLDERS.find((f) => f.id === active) || HOME_FOLDERS[0];
  const choose = (id) => {
    lastFolder = id;
    if (id !== "nivel") setXpFrom(undefined);
    setActive(id);
  };
  const onKey = (e, k) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (k + dir + HOME_FOLDERS.length) % HOME_FOLDERS.length;
    choose(HOME_FOLDERS[next].id);
    tabs.current[next]?.focus();
  };
  return (
    <section className={intro ? "anim-folder" : ""}>
      {/* Las pestañas ocupan todo el ancho, así que el panel no lleva esquinas de arriba: la activa se funde con
          él y las demás se apoyan justo encima, sin montarse ni dejar asomar el panel entre ellas. */}
      <div role="tablist" aria-label="Hoy y tu progreso" className="flex items-end gap-1">
        {HOME_FOLDERS.map((f, k) => {
          const on = f.id === current.id;
          const badge = f.id === "nivel" && newXp > 0 ? `+${newXp}` : f.id === "racha" && streakNew ? "•" : null;
          return (
            <button
              key={f.id}
              ref={(el) => (tabs.current[k] = el)}
              type="button"
              role="tab"
              id={`carpeta-tab-${f.id}`}
              aria-selected={on}
              aria-controls="carpeta-inicio"
              tabIndex={on ? 0 : -1}
              onClick={() => choose(f.id)}
              onKeyDown={(e) => onKey(e, k)}
              className={`relative min-w-0 flex-1 px-2 rounded-t-[16px] text-[14px] leading-none whitespace-nowrap transition-[height,background-color,color] duration-200 ease-out ${
                on ? `h-[50px] -mb-px z-10 font-semibold ${f.dark ? "text-ground" : "text-ink"}` : "h-11 z-0 font-medium text-ink-soft hover:text-ink"
              }`}
              style={{ background: on ? f.color : PAL.ground2 }}
            >
              {f.label}
              {badge && (
                <span className={`absolute -top-1.5 right-1 rounded-full bg-sky text-ink font-bold ${badge === "•" ? "w-3 h-3" : "px-1.5 py-0.5 text-[10px]"}`} aria-label={badge === "•" ? "novedad" : `${badge} XP`}>
                  {badge === "•" ? "" : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        id="carpeta-inicio"
        role="tabpanel"
        aria-labelledby={`carpeta-tab-${current.id}`}
        className={`rounded-b-folder ${current.dark ? "text-ground" : "text-ink"} transition-colors duration-200 ease-out`}
        style={{ background: current.color }}
      >
        <div key={current.id} className="anim-fade">
          {current.id === "hoy" && <TutorCard bank={bank} store={store} onAction={onAction} bare />}
          {current.id === "examen" && <PlanContent store={store} onPlan={onPlan} />}
          {current.id === "racha" && <StreakContent streak={store.streak} />}
          {current.id === "nivel" && <RankContent key={xpFrom ?? "sin-animar"} xp={store.xp} from={xpFrom} />}
        </div>
      </div>
    </section>
  );
}

/* Racha ya vista: la clave recuerda el estado (día, estado y días seguidos) que ya se enseñó. */
const STREAK_SEEN_KEY = "tacita-racha-vista.v1";
export const streakNoticeKey = (streak) => {
  const v = streakView(streak);
  return `${dateKey()}|${v.state}|${v.count}`;
};
const readStreakSeen = () => {
  try {
    return localStorage.getItem(STREAK_SEEN_KEY);
  } catch (e) {
    return null;
  }
};
export const markStreakSeen = (streak) => {
  try {
    localStorage.setItem(STREAK_SEEN_KEY, streakNoticeKey(streak));
  } catch (e) {
    /* sin almacenamiento */
  }
};

/** El tutor: saludo, lo que te recomienda ahora y otras opciones. */
function TutorCard({ bank, store, onAction, bare = false }) {
  const recs = recommend(bank, store);
  const [main, ...rest] = recs;
  // «¡Buenas tardes! Soy tu tutor…» → titular «¡Buenas tardes!» y el resto como entradilla
  const [, hi, intro] = greeting(store).match(/^(.*?[!?])\s*(.*)$/) || [, greeting(store), ""];
  return (
    <section aria-labelledby="tutor-title" className={`${bare ? "" : "rounded-folder bg-forest"} text-ground p-4 relative overflow-hidden`}>
      {/* Habla el tutor: el saludo sale de su boca en un bocadillo de cómic */}
      <div className="flex items-center gap-1 mb-3">
        <span className="w-[84px] shrink-0 -ml-1 anim-peek" aria-hidden="true">
          <Illustration name="tacita" follow className="w-full" />
        </span>
        <div className="relative min-w-0 flex-1 rounded-[20px] bg-sun text-ink px-4 py-3">
          <span className="absolute -left-[11px] top-1/2 -translate-y-1/2 w-3 h-5 bg-sun" style={{ clipPath: "polygon(100% 0, 0 55%, 100% 100%)" }} aria-hidden="true" />
          <h2 id="tutor-title" className="display text-[24px] leading-[1.05]">
            <span className="sr-only">Opoempollo, tu tutor: </span>
            {hi}
          </h2>
          <p className="text-[14px] leading-snug mt-1">{intro || main.kicker.replace(/[^.!?…]$/, "$&.")}</p>
        </div>
      </div>
      <div className="rounded-[12px] bg-card text-ink p-4 relative">
        {main.tags && (
          <p className="flex flex-wrap gap-1.5 mb-3">
            {main.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </p>
        )}
        <h3 className="display text-[28px]">{main.title}</h3>
        <p className="text-[15px] text-ink-soft leading-snug mt-1.5">{main.text}</p>
        <Button variant="yellow" onClick={() => onAction(main.action)} className="w-full mt-4">
          {main.cta} <CaretRight size={20} weight="bold" />
        </Button>
      </div>
      {rest.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {rest.slice(0, 2).map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onAction(r.action)} className="tap press w-full text-left rounded-[16px] bg-ground/10 hover:bg-ground/15 px-4 py-3 flex items-center gap-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-xs text-sun">{r.kicker}</span>
                  <span className="block font-semibold truncate">{r.title}</span>
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">{r.cta}</span>
                <CaretRight size={18} weight="bold" className="shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Misiones del día (como las de Duolingo): tres metas pequeñas y variadas. */
/** Misiones del día: cada una lleva directamente a hacerla. */
function Missions({ store, bank, onAction, onQuickTest }) {
  const list = missions(store);
  const all = list.every((m) => m.done >= m.goal);
  const go = (id) => {
    if (id === "lessons") {
      const next = nextLesson(bank, store);
      if (next) onAction({ type: "lesson", temaId: next.tema.id, index: next.index });
    } else if (id === "cards") onAction({ type: "cards" });
    else onQuickTest();
  };
  return (
    <section aria-labelledby="misiones-title" className="rounded-folder bg-card paper-shadow p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="misiones-title" className="display text-[24px]">
          Misiones de hoy
        </h2>
        {all && <span className="text-sm font-semibold text-olive anim-pop">¡Todas hechas!</span>}
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {list.map((m) => {
          const ok = m.done >= m.goal;
          return (
            <li key={m.id}>
              <button type="button" onClick={() => go(m.id)} className="tap press w-full text-left flex items-center gap-3 rounded-[14px] -mx-1 px-1 py-2 hover:bg-ground-2">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-ink text-sun" : ""}`} style={ok ? undefined : { background: m.color }} aria-hidden="true">
                  {ok ? <Check size={18} weight="bold" /> : <span className="font-mono text-xs font-semibold">{m.done}</span>}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15px] font-medium leading-tight ${ok ? "line-through text-ink-soft" : ""}`}>{m.label}</span>
                  <ProgressBar pct={(m.done / m.goal) * 100} color={ok ? PAL.olive : PAL.ink} className="h-1.5 mt-1.5" label={m.label} />
                </span>
                <span className="font-mono text-xs text-ink-soft w-10 text-right">
                  {m.done}/{m.goal}
                </span>
                <CaretRight size={16} weight="bold" className="text-ink-soft shrink-0" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Accesos directos: lo que no está en la barra de abajo (pódcast, apuntes, liga…) a un toque. */
function Shortcuts({ bank, onGoTemario, onGoLiga, onGoPodcast }) {
  const pod = usePodcast();
  const playing = pod.queue[pod.index];
  const eps = learnTemas(bank).flatMap((t) => episodesOf(bank, t.id));
  const heard = eps.filter((e) => pod.heard[e.key]).length;
  const items = [
    {
      id: "podcast",
      label: "Pódcast",
      sub: playing ? (pod.playing ? "Sonando ahora" : "En pausa") : eps.length ? `${heard} de ${eps.length} oídos` : "Grabando",
      Icon: Headphones,
      color: PAL.sun,
      onClick: onGoPodcast,
    },
    { id: "apuntes", label: "Apuntes", sub: "Teoría y esquemas", Icon: BookOpen, color: PAL.mint, onClick: onGoTemario },
    { id: "liga", label: "Liga y logros", sub: "Clasificación y medallas", Icon: Trophy, color: PAL.peach, onClick: onGoLiga },
  ];
  return (
    <nav aria-label="Accesos directos" className="grid grid-cols-3 gap-2">
      {items.map(({ id, label, sub, Icon, color, badge, onClick }) => (
        <button key={id} type="button" onClick={onClick} className="tap press relative min-w-0 rounded-folder bg-card paper-shadow p-3 flex flex-col items-start gap-2.5 text-left">
          <span className="w-10 h-10 blob flex items-center justify-center" style={{ background: color }} aria-hidden="true">
            <Icon size={20} weight="fill" />
          </span>
          {badge && <span className="absolute top-2.5 right-2.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-ink text-ground font-mono text-[11px] font-semibold flex items-center justify-center">{typeof badge === "number" && badge > 99 ? "99+" : badge}</span>}
          <span className="w-full min-w-0">
            <span className="block font-semibold text-[15px] leading-tight">{label}</span>
            <span className="block text-xs text-ink-soft leading-tight mt-0.5 line-clamp-2">{sub}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

/* Tarjetas de práctica: mismo formato que el reto y los duelos (título con icono, etiquetas, texto y botón). */
function PracticeCard({ id, color, Icon, title, tags, children, cta, onClick, disabled, secondary }) {
  return (
    <section aria-labelledby={`${id}-title`} className="h-full rounded-folder p-4 flex flex-col" style={{ background: color }}>
      <h2 id={`${id}-title`} className="display text-[26px] flex items-center gap-2">
        <Icon size={22} weight="fill" /> {title}
      </h2>
      <p className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </p>
      <p className="mt-2 mb-3 text-[15px] leading-snug">{children}</p>
      {cta && (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="tap press mt-auto w-full h-12 rounded-full bg-ink text-ground text-sm font-semibold disabled:bg-transparent disabled:text-ink disabled:border disabled:border-ink/40"
        >
          {cta}
        </button>
      )}
      {secondary}
    </section>
  );
}

function ReviewCard({ bank, store, onAction, onGoDominio }) {
  const { due, fresh } = reviewState(bank, store);
  const can = due.length || fresh.length;
  return (
    <PracticeCard
      id="repaso"
      color={PAL.lilac}
      Icon={ArrowCounterClockwise}
      title="Repaso del día"
      tags={[due.length ? `${due.length} pendientes` : fresh.length ? "Preguntas nuevas" : "Al día", "Repaso espaciado"]}
      cta={can ? (due.length ? `Repasar ${due.length} preguntas` : "Empezar el repaso") : "Hoy no hay nada pendiente"}
      disabled={!can}
      onClick={() => onAction({ type: "review" })}
      secondary={
        <button type="button" onClick={onGoDominio} className="mt-2 w-full text-sm font-semibold underline underline-offset-4">
          Ver tu dominio del temario
        </button>
      }
    >
      Lo que toca repasar hoy para no olvidarlo. Cada pregunta que aciertas tarda más en volver; la que fallas vuelve pronto.
    </PracticeCard>
  );
}

function QuickTestCard({ onQuickTest }) {
  return (
    <PracticeCard id="rapido" color={PAL.mint} Icon={Lightning} title="Test rápido" tags={["10 preguntas", "Corrección al momento"]} cta="Hacer un test rápido" onClick={onQuickTest}>
      Preguntas de los temas que ya has empezado, para los ratos muertos: el autobús, la cola del médico…
    </PracticeCard>
  );
}

function MistakesCard({ store, onReview }) {
  const n = Object.keys(store.mistakes || {}).length;
  return (
    <PracticeCard
      id="fallos"
      color={PAL.sky}
      Icon={XCircle}
      title="Tus fallos"
      tags={[n ? `${n} ${n === 1 ? "pendiente" : "pendientes"}` : "Ninguno pendiente", `Fuera al acertar ${MASTERED_AFTER} veces`]}
      cta={n ? `Repasar ${n} ${n === 1 ? "fallo" : "fallos"}` : null}
      onClick={onReview}
    >
      {n
        ? `Las preguntas que has fallado en tests y lecciones. Salen de aquí cuando las aciertas ${MASTERED_AFTER} veces seguidas.`
        : "No tienes fallos pendientes. Cuando falles una pregunta, aparecerá aquí para repasarla."}
    </PracticeCard>
  );
}

/* Carrusel de tarjetas de práctica: en el móvil se pasan deslizando (cada una encaja en su sitio y asoma la
   siguiente) y los puntos de abajo dicen en cuál estás; en el ordenador, rejilla de dos columnas.
   Efecto: la tarjeta centrada a tamaño completo y las de los lados algo más pequeñas y apagadas, siguiendo al dedo. */
function CardRail({ label, children }) {
  const items = [].concat(children).filter(Boolean);
  const rail = useRef(null);
  const [at, setAt] = useState(0);
  useEffect(() => {
    const el = rail.current;
    if (!el) return undefined;
    // La tarjeta activa es la que tiene el centro más cerca del centro del carrusel.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    let frame = 0;
    const paint = () => {
      frame = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      [...el.children].forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < dist) (dist = d), (best = i);
        // 0 en el centro, 1 a una tarjeta de distancia
        const k = desktop.matches || still.matches ? 0 : Math.min(1, d / (c.offsetWidth || 1));
        const inner = c.firstElementChild;
        if (inner) {
          inner.style.transform = k ? `scale(${1 - k * 0.07})` : "";
          inner.style.opacity = k ? String(1 - k * 0.35) : "";
        }
      });
      setAt(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  const go = (i) => {
    const c = rail.current?.children[i];
    if (c) rail.current.scrollTo({ left: c.offsetLeft - (rail.current.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
  };
  return (
    <section aria-label={label} aria-roledescription="carrusel">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="display text-[26px]">{label}</h2>
        <span className="font-mono text-sm text-ink-soft lg:hidden" aria-hidden="true">
          {at + 1}/{items.length}
        </span>
      </div>
      <div
        ref={rail}
        className="-mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 overscroll-x-contain lg:mx-0 lg:px-0 lg:flex-col lg:gap-4 lg:overflow-visible"
      >
        {items.map((c, i) => (
          <div key={i} className="snap-center shrink-0 w-[86%] lg:w-auto" aria-roledescription="tarjeta" aria-label={`${i + 1} de ${items.length}`}>
            <div className="h-full origin-center will-change-transform">{c}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-3 lg:hidden">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ir a la tarjeta ${i + 1}`}
            aria-current={i === at ? "true" : undefined}
            className="tap flex items-center justify-center !min-w-[28px] !min-h-[28px]"
          >
            <span className={`block h-2 rounded-full transition-all duration-200 ${i === at ? "w-6 bg-ink" : "w-2 bg-ink/25"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

const retoPts = (r) => r.c * POINTS.correct + r.w * POINTS.wrong + r.b * POINTS.blank;
const pretty = (u) => u.charAt(0).toUpperCase() + u.slice(1);

/** Reto del día: las mismas 10 preguntas para todos. Se ve quién lo ha hecho ya y cómo le fue. */
function RetoCard({ store, liga, user, onAction }) {
  const mine = retoResult(store.liga);
  const others = (liga?.rows || []).filter((r) => r.usuario !== user).map((r) => ({ u: r.usuario, r: retoResult(r.liga) }));
  return (
    <section aria-labelledby="reto-title" className="h-full rounded-folder bg-sun p-4 flex flex-col">
      <h2 id="reto-title" className="display text-[26px] flex items-center gap-2">
        <Flag size={22} weight="fill" /> Reto del día
      </h2>
      <p className="mt-2 flex flex-wrap gap-1.5">
        <span className="tag">10 preguntas</span>
        <span className="tag">Iguales para todos</span>
      </p>
      {mine ? (
        <p className="mt-2 text-[15px]">
          Hecho: <span className="font-semibold">{mine.c} {mine.c === 1 ? "acierto" : "aciertos"}</span>, {mine.w} {mine.w === 1 ? "fallo" : "fallos"} y {mine.b} en blanco ·{" "}
          <span className="font-mono">{retoPts(mine)} puntos</span> para la liga. Mañana, otro.
        </p>
      ) : (
        <>
          <p className="mt-2 mb-3 text-[15px]">Puntúa en la liga: +20 por acierto, −5 por fallo y −2 en blanco. Solo hay una oportunidad al día.</p>
          <button type="button" onClick={() => onAction({ type: "reto" })} className="tap press mt-auto w-full h-12 rounded-full bg-ink text-ground text-sm font-semibold">
            Jugar el reto de hoy
          </button>
        </>
      )}
      {others.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {others.map(({ u, r }) => (
            <li key={u} className="flex items-center justify-between gap-2 rounded-[12px] bg-card/70 px-2 py-1.5">
              <span className="font-semibold flex items-center gap-2">
                <Avatar user={u} className="w-8 h-8 shrink-0" />
                {pretty(u)}
              </span>
              <span>{r ? (mine ? `${r.c} ${r.c === 1 ? "acierto" : "aciertos"} · ${retoPts(r)} pts` : "Ya lo ha hecho") : "Aún no"}</span>
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && !mine && <p className="text-xs mt-2">Verás las notas de los demás cuando hagas el tuyo.</p>}
    </section>
  );
}

/** Duelos: retar a otra persona a 10 preguntas. Las dos juegan las mismas; gana quien saque más puntos. */
/* Aviso emergente al entrar en Inicio cuando alguien te ha retado: se puede responder ya o dejarlo para luego
   (sigue en la tarjeta de Duelos). Cada reto avisa una sola vez por dispositivo. */
const SEEN_KEY = "opo-duelos-avisados";
const readSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
};

function DuelInvite({ bank, store, liga, user, onAction }) {
  const [seen, setSeen] = useState(readSeen);
  const duel = duelsOf(user, store.liga, liga?.rows || []).find((d) => d.status === "pending" && d.from !== user && !seen.includes(d.id));
  const temas = learnTemas(bank);
  const close = () => {
    if (!duel) return;
    const next = [...seen, duel.id].slice(-50);
    setSeen(next);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    } catch {}
  };
  const tema = duel && (duel.tema === "all" ? "todo el temario" : `«${temas.find((t) => t.id === duel.tema)?.titulo ?? "un tema"}»`);
  return (
    <Sheet
      open={!!duel}
      onClose={close}
      title={duel ? `¡${pretty(duel.from)} te reta!` : ""}
      body={
        duel && (
          <>
            <Avatar user={duel.from} face="happy" className="w-24 h-24 mx-auto mb-3 block anim-hop" />
            Duelo de {DUEL_SIZE} preguntas en {tema}. Las mismas preguntas para las dos personas: gana quien saque más puntos.
          </>
        )
      }
      actions={
        duel && (
          <>
            <Button
              variant="ink"
              onClick={() => {
                const d = duel;
                close();
                onAction({ type: "duel", duel: d });
              }}
            >
              <Sword size={20} weight="fill" /> Responder al reto
            </Button>
            <Button variant="paper" onClick={close}>
              Luego
            </Button>
          </>
        )
      }
    />
  );
}

// Puntos de duelo con el signo menos tipográfico, para que «−25» no parezca un guion.
const fmtPts = (n) => String(n).replace("-", "−");

function DuelCard({ bank, store, liga, user, onAction }) {
  const rivals = (liga?.rows || []).map((r) => r.usuario).filter((u) => u !== user);
  const [rival, setRival] = useState(null);
  const [tema, setTema] = useState("all");
  const [picking, setPicking] = useState(false);
  const duels = duelsOf(user, store.liga, liga?.rows || []);
  const pending = duels.filter((d) => d.status === "pending" && d.from !== user);
  const waiting = duels.filter((d) => d.status === "waiting");
  const done = duels.filter((d) => d.status === "done").slice(0, 3);
  const record = duelRecord(duels);
  const temas = learnTemas(bank);
  const temaName = (id) => (id === "all" ? "todo el temario" : `«${temas.find((t) => t.id === id)?.titulo ?? "un tema"}»`);
  const target = rival && rivals.includes(rival) ? rival : rivals[0];
  const play = (duel) => onAction({ type: "duel", duel });

  return (
    <section aria-labelledby="duel-title" className="h-full rounded-folder bg-peach p-4 flex flex-col">
      <h2 id="duel-title" className="display text-[26px] flex items-center gap-2">
        <Sword size={22} weight="fill" /> Duelos
      </h2>
      <p className="mt-2 flex flex-wrap gap-1.5">
        <span className="tag">{DUEL_SIZE} preguntas</span>
        <span className="tag">Mismas preguntas para ambos</span>
      </p>
      {rivals.length > 0 && (
        <p className="mt-2 mb-3 text-[15px] leading-snug">
          Elige rival y tema: respondéis las mismas preguntas y gana quien saque más puntos (+20 acierto, −5 fallo, −2 en blanco). No cuenta para la liga.
        </p>
      )}

      {pending.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {pending.map((d) => (
            <li key={d.id} className="rounded-[14px] bg-card px-2.5 py-2 flex items-center gap-2">
              <Avatar user={d.from} className="w-8 h-8 shrink-0" />
              <span className="flex-1 min-w-0 leading-tight">
                <span className="block text-[14px] font-semibold truncate">{pretty(d.from)} te reta</span>
                <span className="block text-xs text-ink-soft truncate first-letter:uppercase">{temaName(d.tema)}</span>
              </span>
              <button type="button" onClick={() => play(d)} className="tap press h-9 px-3.5 rounded-full bg-ink text-ground text-sm font-semibold shrink-0">
                Aceptar
              </button>
            </li>
          ))}
        </ul>
      )}

      {rivals.length ? (
        <button type="button" onClick={() => setPicking(true)} className="tap press mt-auto w-full h-12 rounded-full bg-ink text-ground text-sm font-semibold flex items-center justify-center gap-2">
          <Sword size={18} weight="fill" /> Retar a alguien
        </button>
      ) : (
        <p className="mt-2 text-sm">{liga?.status === "ok" ? "Aún no hay nadie más a quien retar." : "Para retar a alguien hace falta conexión con la nube."}</p>
      )}

      <Sheet
        open={picking && rivals.length > 0}
        title="Nuevo duelo"
        onClose={() => setPicking(false)}
        body={
          <div className="flex flex-col gap-4 text-ink pt-1">
            <div className="flex flex-wrap gap-2" role="group" aria-label="A quién retas">
              {rivals.map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={u === target}
                  onClick={() => setRival(u)}
                  className={`tap press h-12 pl-1.5 pr-5 rounded-full text-sm font-semibold flex items-center gap-2 ${u === target ? "bg-ink text-ground" : "bg-ground-2"}`}
                >
                  <Avatar user={u} className="w-9 h-9 shrink-0" />
                  {pretty(u)}
                </button>
              ))}
            </div>
            <div>
              <p className="label text-ink-soft mb-2">Preguntas de</p>
              {/* Lista propia en lugar del desplegable del sistema: mismo aspecto que «Elige tema» de Aprende */}
              <ul className="max-h-[38vh] overflow-y-auto overscroll-contain -mx-1 px-1 flex flex-col gap-1" role="listbox" aria-label="Preguntas de">
                {[{ b: null, list: [{ id: "all", numero: "∗", titulo: "Todo el temario" }] }, ...["comun", "especifico"].map((b) => ({ b, list: temas.filter((t) => t.bloque === b) }))].map(({ b, list }) => (
                  <li key={b || "all"} role="presentation">
                    {b && (
                      <p className="sticky top-0 z-[1] bg-card pt-2 pb-1 flex items-center gap-2 font-semibold text-sm" aria-hidden="true">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: BLOCKS[b].hex }} />
                        {BLOCKS[b].label}
                      </p>
                    )}
                    <ul className="flex flex-col gap-1" role="presentation">
                      {list.map((t) => {
                        const on = t.id === tema;
                        return (
                          <li key={t.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={on}
                              onClick={() => setTema(t.id)}
                              className={`tap press w-full text-left rounded-[12px] px-2 py-2 flex items-center gap-3 ${on ? "bg-ink text-ground" : "hover:bg-ground"}`}
                            >
                              <span
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-ink font-bold ${String(t.numero).length > 3 ? "text-[10px]" : "text-[13px]"}`}
                                style={{ background: t.id === "all" ? PAL.sun : unitColor(bank, t.id) }}
                                aria-hidden="true"
                              >
                                {t.id === "all" ? <Sword size={16} weight="fill" /> : t.numero}
                              </span>
                              <span className="flex-1 min-w-0 text-[15px] font-semibold leading-snug">{t.titulo}</span>
                              {on && <Check size={18} weight="bold" className="shrink-0" aria-hidden="true" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-ink-soft">Juegas tú primero; le llega el aviso y tiene una semana. No suma puntos de liga: es por el honor.</p>
          </div>
        }
        actions={
          <>
            <Button
              variant="ink"
              onClick={() => {
                setPicking(false);
                play({ id: newDuelId(user), from: user, to: target, tema });
              }}
            >
              <Sword size={20} weight="fill" /> Retar a {target ? pretty(target) : ""}
            </Button>
            <Button variant="paper" onClick={() => setPicking(false)}>
              Cancelar
            </Button>
          </>
        }
      />

      {(waiting.length > 0 || done.length > 0) && (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {waiting.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-[12px] bg-card/70 px-3 py-1.5">
              <span className="min-w-0">Esperando a <span className="font-semibold">{pretty(d.rival)}</span></span>
              <span className="font-mono whitespace-nowrap shrink-0">tú: {fmtPts(duelPoints(d.mine))}</span>
            </li>
          ))}
          {done.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-[12px] bg-card/70 px-3 py-1.5">
              <span className="min-w-0">
                {d.result === "win" ? "Ganas a" : d.result === "loss" ? "Pierdes con" : "Empate con"} <span className="font-semibold">{pretty(d.rival)}</span>
              </span>
              <span className="font-mono whitespace-nowrap shrink-0">
                {fmtPts(duelPoints(d.mine))} a {fmtPts(duelPoints(d.theirs))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {Object.keys(record).length > 0 && (
        <ul className="text-xs mt-2 flex flex-col gap-0.5">
          {Object.entries(record).map(([u, r]) => (
            <li key={u}>
              Contra <span className="font-semibold">{pretty(u)}</span>: {r.win} {r.win === 1 ? "victoria" : "victorias"}, {r.loss} {r.loss === 1 ? "derrota" : "derrotas"}
              {r.draw ? `, ${r.draw} ${r.draw === 1 ? "empate" : "empates"}` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Home({ store, bank, install, onDismissInstall, onGoTemario, onGoDominio, onReview, onPlan, onQuickTest, onToggleSound, onAction, onGoLiga, onGoPodcast, sync, liga, user }) {
  const intro = useRef(!introPlayed).current;
  useEffect(() => {
    introPlayed = true;
  }, []);
  const streakCount = streakView(store.streak).count;
  const dateLabel = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  // Debajo del saludo, lo que empuja a estudiar hoy: la cuenta atrás y la meta del día.
  const left = daysUntil(store.plan.examDate, dateKey());
  const doneToday = store.daily[dateKey()] || 0;
  const goal = store.plan.dailyGoal;
  const subtitle =
    doneToday >= goal
      ? "Meta de hoy cumplida. ¿Un poco más?"
      : left > 0
        ? `Faltan ${left} ${left === 1 ? "día" : "días"} · hoy ${doneToday}/${goal}`
        : doneToday
          ? `Vas ${doneToday} de ${goal} hoy`
          : "Toca estudiar";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {user && (
              <button type="button" onClick={onGoLiga} aria-label="Tus logros y la liga" className="tap press shrink-0 rounded-full">
                <Avatar user={user} face="happy" className="w-14 h-14 block" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="display text-[30px] lg:text-[44px] leading-[1.05]">¡Hola{user ? `, ${pretty(user)}` : ""}!</h1>
              <p className="text-[15px] font-semibold mt-0.5">{subtitle}</p>
            </div>
          </div>
          <p className="label text-ink-soft mt-2 first-letter:uppercase">{dateLabel}</p>
          {sync && sync !== "off" && (
            <p className="text-xs text-ink-soft mt-1 flex items-center gap-1.5 lg:hidden">
              <span className={`w-2 h-2 rounded-full ${sync === "ok" ? "bg-olive" : sync === "syncing" ? "bg-sun" : "bg-line-strong"}`} aria-hidden="true" />
              {sync === "ok" ? "Progreso sincronizado" : sync === "syncing" ? "Sincronizando…" : "Sin conexión: se guarda en este móvil"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            label={store.settings.sound ? "Silenciar sonidos" : "Activar sonidos"}
            aria-pressed={!!store.settings.sound}
            onClick={onToggleSound}
            className="w-11 h-11 bg-card paper-shadow text-ink"
          >
            {store.settings.sound ? <SpeakerHigh size={20} weight="fill" /> : <SpeakerSlash size={20} weight="bold" className="text-ink-soft" />}
          </IconButton>
          <button type="button" onClick={onGoLiga} className={`tap press flex items-center gap-1.5 h-11 px-4 rounded-full ${streakCount ? "bg-sun" : "bg-card paper-shadow"}`} aria-label={`Racha de ${streakCount} días: ver en Logros`}>
            <Fire size={20} weight="fill" className={streakCount ? "text-ink" : "text-line-strong"} />
            <span className="font-mono font-semibold">{streakCount}</span>
          </button>
        </div>
      </header>

      {!install.installed && !install.canInstall && !store.installDismissed && install.browser !== "desktop" && (
        <Paper className="p-4 flex gap-3 anim-pop">
          <div className="w-12 h-12 shrink-0 self-start bg-mist blob flex items-center justify-center">
            <ArtIcon name="instalar" size="50%" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">Instálala en tu móvil</p>
            <p className="text-sm text-ink-soft leading-snug mt-1">
              {
                {
                  chrome: "En Chrome: toca ⋮ (arriba a la derecha) → «Instalar aplicación» o «Añadir a pantalla de inicio».",
                  samsung: "En Samsung Internet: toca ≡ (abajo) → «Añadir página a» → «Pantalla de inicio».",
                  firefox: "En Firefox: toca ⋮ → «Instalar» o «Añadir a pantalla de inicio».",
                  ios: "En Safari: toca Compartir → «Añadir a pantalla de inicio».",
                }[install.browser]
              }
            </p>
          </div>
          <IconButton label="Ocultar aviso" onClick={onDismissInstall} className="text-ink-soft -mr-2 -mt-2 self-start">
            <X size={20} weight="bold" />
          </IconButton>
        </Paper>
      )}

      {install.canInstall && !store.installDismissed && (
        <Paper className="p-3 flex items-center gap-3 anim-pop">
          <div className="w-12 h-12 shrink-0 bg-mist blob flex items-center justify-center">
            <ArtIcon name="instalar" size="50%" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">Instala Opoempollo</p>
            <p className="text-sm text-ink-soft leading-snug">Ábrela desde tu pantalla de inicio, también sin conexión.</p>
          </div>
          <button type="button" onClick={install.install} className="tap press h-11 px-4 rounded-full bg-ink text-ground text-sm font-semibold flex items-center gap-1.5">
            <DeviceMobile size={18} weight="bold" /> Instalar
          </button>
          <IconButton label="Ocultar aviso" onClick={onDismissInstall} className="text-ink-soft -mr-1">
            <X size={20} weight="bold" />
          </IconButton>
        </Paper>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {/* Primero, lo que toca ahora; justo debajo, todo lo demás a un toque */}
          <HomeCabinet bank={bank} store={store} onPlan={onPlan} onAction={onAction} intro={intro} />
          <Shortcuts bank={bank} onGoTemario={onGoTemario} onGoLiga={onGoLiga} onGoPodcast={onGoPodcast} />


          <Missions store={store} bank={bank} onAction={onAction} onQuickTest={onQuickTest} />
        </div>
        <div className="flex flex-col gap-6 min-w-0">
          {/* Practicar y retarse: carrusel de tarjetas */}
          <CardRail label="Practica y rétate">
            <ReviewCard bank={bank} store={store} onAction={onAction} onGoDominio={onGoDominio} />
            <QuickTestCard onQuickTest={onQuickTest} />
            <MistakesCard store={store} onReview={onReview} />
            <RetoCard store={store} liga={liga} user={user} onAction={onAction} />
            <DuelCard bank={bank} store={store} liga={liga} user={user} onAction={onAction} />
          </CardRail>
          <DuelInvite bank={bank} store={store} liga={liga} user={user} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}
