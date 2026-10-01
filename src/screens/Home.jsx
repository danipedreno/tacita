import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, BookOpen, CaretRight, Check, DeviceMobile, Fire, Lightning, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { DAILY_GOALS, MASTERED_AFTER, dateKey, daysUntil, rankInfo, streakView } from "../lib/logic.js";
import { PAL } from "../lib/palette.js";
import { Button, Folder, Galones, IconButton, Illustration, Paper, ProgressBar, Segmented, Sheet } from "../ui.jsx";
import { GoalRing } from "./Celebration.jsx";
import { useCountUp } from "../lib/motion.js";
import { greeting, missions, recommend } from "../lib/tutor.js";

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
const readXpSeen = () => {
  try {
    const v = localStorage.getItem(XP_SEEN_KEY);
    return v === null ? null : Number(v);
  } catch (e) {
    return null;
  }
};
const writeXpSeen = (xp) => {
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
function RankContent({ xp, from }) {
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
        <div className="w-28 h-28 p-2.5 shrink-0 self-start bg-card blob">
          <Illustration name={rank.illustration} alt={rank.name} className="w-full" />
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

function StreakContent({ streak }) {
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

/* Archivador de Inicio: tres carpetas y una sola delante; se cambia tocando su pestaña.
   Se recuerda la última elegida mientras la app esté abierta. */
const HOME_FOLDERS = [
  { id: "examen", label: "Tu examen", color: PAL.sun },
  { id: "racha", label: "Racha", color: PAL.peach },
  { id: "hoja", label: "Nivel", color: PAL.lilac },
];
let lastFolder = "examen";

function HomeCabinet({ store, onPlan, intro }) {
  const [active, setActive] = useState(lastFolder);
  // XP visto la última vez: la primera vez no hay animación; después, lo ganado se celebra al abrir «Nivel».
  const [xpSeen, setXpSeen] = useState(() => {
    const v = readXpSeen();
    if (v === null) writeXpSeen(store.xp);
    return v === null ? store.xp : v;
  });
  const [animFrom, setAnimFrom] = useState(undefined); // XP desde el que animar la hoja abierta
  const pendingXp = Math.max(0, store.xp - xpSeen);
  useEffect(() => {
    if (active !== "hoja" || !pendingXp) return;
    setAnimFrom(xpSeen);
    setXpSeen(store.xp);
    writeXpSeen(store.xp);
  }, [active, pendingXp, xpSeen, store.xp]);
  const tabs = useRef([]);
  const current = HOME_FOLDERS.find((f) => f.id === active);
  const choose = (id) => {
    lastFolder = id;
    if (id !== "hoja") setAnimFrom(undefined);
    setActive(id);
  };
  // Patrón de pestañas: flechas para moverse entre ellas.
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
      <div role="tablist" aria-label="Tu progreso" className="flex items-end gap-1">
        {HOME_FOLDERS.map((f, k) => {
          const on = f.id === active;
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
              className={`relative shrink-0 -mb-px px-4 rounded-t-[16px] text-[15px] leading-none whitespace-nowrap transition-[height,background-color,color] duration-200 ease-out ${
                on ? "h-[52px] z-10 font-semibold text-ink" : "h-11 z-0 font-medium text-ink-soft hover:text-ink"
              }`}
              style={{ background: on ? f.color : PAL.ground2 }}
            >
              {f.label}
              {f.id === "hoja" && !on && pendingXp > 0 && (
                <span className="ml-1.5 rounded-full bg-sun px-1.5 py-0.5 text-[11px] font-bold text-ink align-middle">+{pendingXp}</span>
              )}
            </button>
          );
        })}
      </div>
      <div
        id="carpeta-inicio"
        role="tabpanel"
        aria-labelledby={`carpeta-tab-${active}`}
        className="rounded-folder rounded-tl-none text-ink transition-colors duration-200 ease-out"
        style={{ background: current.color }}
      >
        <div key={active} className="anim-fade">
          {active === "examen" && <PlanContent store={store} onPlan={onPlan} />}
          {active === "racha" && <StreakContent streak={store.streak} />}
          {active === "hoja" && <RankContent key={animFrom ?? "sin-animar"} xp={store.xp} from={animFrom} />}
        </div>
      </div>
    </section>
  );
}

/** El tutor: saludo, lo que te recomienda ahora y otras opciones. */
function TutorCard({ bank, store, onAction }) {
  const recs = recommend(bank, store);
  const [main, ...rest] = recs;
  return (
    <section aria-labelledby="tutor-title" className="rounded-folder bg-forest text-ground p-5 relative overflow-hidden">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1 pb-2">
          <p className="label text-pink">Tacita, tu tutora</p>
          <p className="text-[16px] leading-snug mt-1 text-ground/90">{greeting(store)}</p>
        </div>
        <span className="w-28 shrink-0 -mb-1 anim-peek" aria-hidden="true">
          <Illustration name="tacita" follow className="w-full" />
        </span>
      </div>
      <div className="rounded-[20px] bg-card text-ink p-4 relative">
        <p className="label text-ink-soft">{main.kicker}</p>
        <h2 id="tutor-title" className="display text-[32px] mt-1">
          {main.title}
        </h2>
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
function Missions({ store }) {
  const list = missions(store);
  const all = list.every((m) => m.done >= m.goal);
  return (
    <section aria-labelledby="misiones-title" className="rounded-folder bg-card paper-shadow p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="misiones-title" className="display text-[24px]">
          Misiones de hoy
        </h2>
        {all && <span className="text-sm font-semibold text-olive anim-pop">¡Todas hechas!</span>}
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {list.map((m) => {
          const ok = m.done >= m.goal;
          return (
            <li key={m.id} className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-ink text-sun" : ""}`} style={ok ? undefined : { background: m.color }} aria-hidden="true">
                {ok ? <Check size={18} weight="bold" /> : <span className="font-mono text-xs font-semibold">{m.done}</span>}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[15px] font-medium leading-tight ${ok ? "line-through text-ink-soft" : ""}`}>{m.label}</p>
                <ProgressBar pct={(m.done / m.goal) * 100} color={ok ? PAL.olive : PAL.ink} className="h-1.5 mt-1.5" label={m.label} />
              </div>
              <span className="font-mono text-xs text-ink-soft w-12 text-right">
                {m.done}/{m.goal}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Home({ store, bank, install, onDismissInstall, onGoTemario, onReview, onPlan, onQuickTest, onToggleSound, onAction, sync }) {
  const intro = useRef(!introPlayed).current;
  useEffect(() => {
    introPlayed = true;
  }, []);
  const streakCount = streakView(store.streak).count;
  const pendingMistakes = Object.keys(store.mistakes).length;
  const dateLabel = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="brand text-[46px] lg:hidden">Tacita</h1>
          <h1 className="hidden lg:block display text-[48px]">Inicio</h1>
          <p className="label text-ink-soft mt-1.5 first-letter:uppercase">{dateLabel}</p>
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
          <div className={`flex items-center gap-1.5 h-11 px-4 rounded-full ${streakCount ? "bg-sun" : "bg-card paper-shadow"}`} aria-label={`Racha de ${streakCount} días`}>
            <Fire size={20} weight="fill" className={streakCount ? "text-ink" : "text-line-strong"} />
            <span className="font-mono font-semibold">{streakCount}</span>
          </div>
        </div>
      </header>

      {!install.installed && !install.canInstall && !store.installDismissed && install.browser !== "desktop" && (
        <Paper className="p-4 flex gap-3 anim-pop">
          <div className="w-16 h-16 p-1.5 shrink-0 self-start bg-mist blob">
            <Illustration name="instalar" className="w-full" />
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
          <div className="w-14 h-14 p-1 shrink-0 bg-mist blob">
            <Illustration name="instalar" className="w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">Instala Tacita</p>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <TutorCard bank={bank} store={store} onAction={onAction} />
          <Missions store={store} />
        </div>
        <div className="flex flex-col gap-6">
          <HomeCabinet store={store} onPlan={onPlan} intro={intro} />

          {/* Test rápido de un toque: para los ratos muertos */}
          <button type="button" onClick={onQuickTest} className="tap press text-left rounded-folder bg-ink text-ground p-5 flex items-center gap-4">
            <span className="w-12 h-12 blob bg-sun text-ink flex items-center justify-center shrink-0">
              <Lightning size={24} weight="fill" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="display text-[26px] block">Test rápido</span>
              <span className="text-sm leading-snug block mt-1 text-ground/85">10 preguntas de lo que ya has estudiado, con la corrección al momento</span>
            </span>
            <CaretRight size={22} weight="bold" className="shrink-0" />
          </button>

          {pendingMistakes > 0 && (
            <button type="button" onClick={onReview} className="tap press text-left rounded-folder bg-plum text-ground p-5 flex items-center gap-4">
              <span className="w-12 h-12 blob bg-lilac text-plum flex items-center justify-center shrink-0">
                <ArrowCounterClockwise size={24} weight="bold" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="display text-[28px] block text-lilac">Repasar fallos</span>
                <span className="text-sm leading-snug block mt-1">Salen del repaso cuando las aciertas {MASTERED_AFTER} veces seguidas</span>
              </span>
              <span className="brand text-[44px] text-lilac" aria-label={`${pendingMistakes} pendientes`}>
                {pendingMistakes}
              </span>
            </button>
          )}

          <button type="button" onClick={onGoTemario} className="tap press w-full text-left flex items-center gap-3 rounded-folder bg-card paper-shadow px-4 py-3 lg:hidden">
            <span className="w-11 h-11 blob bg-mint flex items-center justify-center shrink-0">
              <BookOpen size={22} weight="fill" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold">Apuntes</span>
              <span className="block text-sm text-ink-soft">La teoría de cada tema, para leerla del tirón</span>
            </span>
            <CaretRight size={20} weight="bold" className="text-ink-soft shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
