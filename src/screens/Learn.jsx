import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CaretLeft, CaretRight, Check, Crown, Exam, Headphones, Play } from "@phosphor-icons/react";
import { Huevo, PolloEnHuevo, doneFace } from "../pollo.jsx";
import { BLOCKS, UNIT_COLORS, lessonKey } from "../lib/logic.js";
import { learnTemas, temaLabel } from "../lib/bank.js";
import { nextLesson, unitDoneCount } from "../lib/tutor.js";
import { Button, Folder, Paper, ProgressBar, Sheet } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import { episodesOf, fmtTime, player } from "../lib/podcast.js";

/* Camino de aprendizaje (como Duolingo): cada tema es una unidad con sus lecciones en zigzag
   y, al final, el examen del tema. Todo está abierto (es tu temario), pero el tutor marca
   la siguiente lección recomendada. Se ve un tema cada vez; la barra de arriba salta entre temas. */

const SEL_KEY = "tacita-aprende-tema";
const chipLabel = (t) => (t.bloque === "comun" && /^\d/.test(String(t.numero)) ? `C${t.numero}` : String(t.numero));

const ZIGZAG = [0, 44, 66, 44, 0, -44, -66, -44];

export const unitColor = (bank, temaId) => {
  const i = learnTemas(bank).findIndex((t) => t.id === temaId);
  return UNIT_COLORS[(i < 0 ? 0 : i) % UNIT_COLORS.length];
};

/* Cada lección del camino es un huevo: dormido si aún no toca, despierto y tambaleándose si es la siguiente.
   Al aprenderla se rompe el cascarón y sale el pollito (cada uno con su cara). El examen del tema lleva corona. */
const SEEN_KEY = "opo-pollitos-nacidos";
const readSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "null");
  } catch (e) {
    return null;
  }
};

function Node({ state, color, label, offset, onClick, isNext, nodeRef, index, crown, hatch }) {
  return (
    <li className="relative flex justify-center" style={{ transform: `translateX(${offset}px)` }}>
      {isNext && (
        <span className={`absolute top-1/2 z-[1] ${offset > 0 ? "right-1/2 mr-14" : "left-1/2 ml-14"}`} aria-hidden="true">
          <span className="block -translate-y-1/2 anim-bob-x relative rounded-full bg-ink text-ground text-sm font-bold px-3.5 py-2 whitespace-nowrap">
            ¡Sigue aquí!
            <span className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-ink ${offset > 0 ? "-right-1" : "-left-1"}`} />
          </span>
        </span>
      )}
      <button
        ref={nodeRef}
        type="button"
        onClick={onClick}
        aria-label={label}
        className="tap press relative w-[92px] h-[100px] flex items-end justify-center"
      >
        {state === "done" ? (
          <PolloEnHuevo face={crown ? "sparkle" : doneFace(index)} tint={color} crown={crown} hatch={hatch} className="w-full h-full" />
        ) : (
          <Huevo state={state === "next" ? "awake" : "sleep"} tint={color} crown={crown} className="w-full h-full" />
        )}
      </button>
    </li>
  );
}

function Unit({ bank, tema, store, color, nextRef, next, onOpenLesson, onTemaExam, onApuntes, fresh }) {
  const done = unitDoneCount(tema, store);
  const total = tema.lecciones.length;
  const exam = store.temaExams?.[tema.id];
  const allDone = done === total;
  return (
    <section aria-labelledby={`unit-${tema.id}`} className="flex flex-col gap-6">
      <Folder color={color} tab={tema.bloque === "comun" ? `Común · Tema ${tema.numero}` : `Tema ${tema.numero}`}>
        <div className="p-5">
          <h3 id={`unit-${tema.id}`} className="display text-[28px] lg:text-[32px]">
            {tema.titulo}
          </h3>
          <p className="text-[15px] leading-snug mt-2">{tema.intro}</p>
          <div className="flex items-center gap-3 mt-4">
            <ProgressBar pct={(done / total) * 100} color={PAL.ink} track="bg-card/60" className="h-2.5 flex-1" label={`Lecciones del tema ${tema.numero}`} />
            <span className="font-mono text-sm font-semibold">
              {done}/{total}
            </span>
            {exam?.passed && <Crown size={22} weight="fill" className="text-plum" aria-label="Examen superado" />}
          </div>
          <button type="button" onClick={() => onApuntes(tema.id)} className="tap press mt-4 h-11 px-4 rounded-full bg-card/80 text-sm font-semibold inline-flex items-center gap-2">
            <BookOpen size={18} weight="bold" /> Apuntes del tema
          </button>
        </div>
      </Folder>
      <ol className="flex flex-col gap-7 py-2" aria-label={`Lecciones de ${tema.titulo}`}>
        {tema.lecciones.map((l, i) => {
          const isDone = !!store.lessons?.[lessonKey(tema.id, i)]?.done;
          const isNext = next && next.tema.id === tema.id && next.index === i;
          return (
            <Node
              key={i}
              nodeRef={isNext ? nextRef : undefined}
              state={isDone ? "done" : isNext ? "next" : "pending"}
              color={color}
              offset={ZIGZAG[i % ZIGZAG.length]}
              index={i}
              isNext={isNext}
              label={`Lección ${i + 1}: ${l.titulo}${isDone ? " (hecha)" : ""}`}
              hatch={isDone && fresh.has(lessonKey(tema.id, i))}
              onClick={() => onOpenLesson(tema.id, i)}
            />
          );
        })}
        <Node
          state={exam?.passed ? "done" : allDone ? "next" : "pending"}
          color="#c4692c"
          offset={ZIGZAG[total % ZIGZAG.length]}
          index={total}
          crown
          hatch={!!exam?.passed && fresh.has(`exam:${tema.id}`)}
          label={`Examen del tema ${tema.numero}${exam?.passed ? ` (superado, mejor nota ${exam.best.toFixed(1)})` : ""}`}
          onClick={() => onTemaExam(tema.id)}
        />
      </ol>
    </section>
  );
}

export default function Learn({ bank, store, onStartLesson, onTemaExam, onApuntes, onPractice }) {
  const temas = learnTemas(bank);
  const next = useMemo(() => nextLesson(bank, store), [bank, store]);
  const [sheet, setSheet] = useState(null); // { temaId, index }
  const nextRef = useRef(null);
  const totalLessons = temas.reduce((a, t) => a + t.lecciones.length, 0);
  const doneLessons = temas.reduce((a, t) => a + unitDoneCount(t, store), 0);

  // Pollitos recién nacidos: lecciones hechas desde la última vez que se vio el camino (se anima su salida una vez).
  const doneKeys = useMemo(
    () => [...temas.flatMap((t) => t.lecciones.map((_, i) => lessonKey(t.id, i)).filter((k) => store.lessons?.[k]?.done)), ...temas.filter((t) => store.temaExams?.[t.id]?.passed).map((t) => `exam:${t.id}`)],
    [temas, store.lessons, store.temaExams]
  );
  const [fresh] = useState(() => {
    const seen = readSeen();
    return seen ? new Set(doneKeys.filter((k) => !seen.includes(k))) : new Set();
  });
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(doneKeys));
      } catch (e) {
        /* sin almacenamiento */
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [doneKeys]);

  // Tema a la vista: el último que abriste o, la primera vez, el de la siguiente lección.
  const [sel, setSelState] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(SEL_KEY);
    } catch (e) {
      /* sin almacenamiento */
    }
    return temas.some((t) => t.id === saved) ? saved : next?.tema.id || temas[0]?.id;
  });
  const topRef = useRef(null);
  const chipsRef = useRef(null);
  const selIndex = Math.max(0, temas.findIndex((t) => t.id === sel));
  const current = temas[selIndex];
  const setSel = (id) => {
    setSelState(id);
    try {
      localStorage.setItem(SEL_KEY, id);
    } catch (e) {
      /* sin almacenamiento */
    }
    requestAnimationFrame(() => topRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" }));
  };

  // El botón del tema elegido, siempre visible en la barra.
  useEffect(() => {
    chipsRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [sel]);

  // Al entrar, el camino se coloca en la siguiente lección (si es de este tema).
  useEffect(() => {
    const t = setTimeout(() => nextRef.current?.scrollIntoView?.({ block: "center", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, []);

  const sheetTema = sheet && temas.find((t) => t.id === sheet.temaId);
  const sheetLesson = sheetTema?.lecciones[sheet.index];
  const sheetDone = sheet && store.lessons?.[lessonKey(sheet.temaId, sheet.index)];
  const steps = sheetLesson?.pasos.length || 0;
  const sheetEp = sheet && episodesOf(bank, sheet.temaId).find((e) => e.i === sheet.index);
  const exercises = sheetLesson?.pasos.filter((p) => p.t !== "teoria").length || 0;

  const groups = ["comun", "especifico"].map((b) => ({ b, temas: temas.filter((t) => t.bloque === b) }));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="display text-[48px]">Aprende</h1>
        <p className="text-[15px] text-ink-soft mt-2">Todo el temario, lección a lección. Cada lección explica, pregunta y repite lo que fallas.</p>
        <div className="flex items-center gap-3 mt-4">
          <ProgressBar pct={(doneLessons / totalLessons) * 100} color={PAL.olive} track="bg-ground-2" className="h-3 flex-1" label="Progreso del temario" />
          <span className="font-mono text-sm font-semibold whitespace-nowrap">
            {doneLessons} de {totalLessons} lecciones
          </span>
        </div>
      </header>

      <nav aria-label="Temas" className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 px-4 lg:-mx-10 lg:px-10 py-2 bg-ground/95 backdrop-blur border-b border-line">
        <div ref={chipsRef} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {groups.map(({ b, temas: list }) => (
            <div key={b} className="flex items-center gap-1.5 shrink-0">
              <span className="label font-semibold text-ink px-1 shrink-0 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: BLOCKS[b].hex }} aria-hidden="true" />
                {BLOCKS[b].short}
              </span>
              {list.map((t) => {
                const done = unitDoneCount(t, store) === t.lecciones.length;
                const on = t.id === current?.id;
                const hasNext = next?.tema.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSel(t.id)}
                    aria-current={on ? "true" : undefined}
                    aria-label={`${temaLabel(bank, t.id)}${done ? " (terminado)" : ""}`}
                    className={`tap press relative h-10 min-w-[44px] px-3 rounded-full text-sm font-semibold font-mono flex items-center justify-center gap-1 shrink-0 ${on ? "bg-ink text-ground" : "bg-card paper-shadow"}`}
                    style={on ? undefined : { boxShadow: `inset 0 -3px 0 ${unitColor(bank, t.id)}` }}
                  >
                    {chipLabel(t)}
                    {done && <Check size={14} weight="bold" aria-hidden="true" />}
                    {hasNext && !on && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-plum" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      {current && (
        <div ref={topRef} className="flex flex-col gap-6 scroll-mt-20">
          <Unit
            key={current.id}
            bank={bank}
            tema={current}
            store={store}
            color={unitColor(bank, current.id)}
            next={next}
            nextRef={nextRef}
            onOpenLesson={(temaId, index) => setSheet({ temaId, index })}
            onTemaExam={onTemaExam}
            onApuntes={onApuntes}
            fresh={fresh}
          />
          <div className="grid grid-cols-2 gap-2">
            {selIndex > 0 ? (
              <button type="button" onClick={() => setSel(temas[selIndex - 1].id)} className="tap press h-14 rounded-full bg-card paper-shadow text-sm font-semibold flex items-center justify-center gap-1.5 px-3">
                <CaretLeft size={18} weight="bold" aria-hidden="true" /> <span className="truncate">Tema {chipLabel(temas[selIndex - 1])}</span>
              </button>
            ) : (
              <span />
            )}
            {selIndex < temas.length - 1 && (
              <button type="button" onClick={() => setSel(temas[selIndex + 1].id)} className="tap press h-14 rounded-full bg-ink text-ground text-sm font-semibold flex items-center justify-center gap-1.5 px-3">
                <span className="truncate">Siguiente: tema {chipLabel(temas[selIndex + 1])}</span> <CaretRight size={18} weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>
          {next && next.tema.id !== current.id && (
            <button type="button" onClick={() => setSel(next.tema.id)} className="text-sm text-ink-soft underline underline-offset-4 self-center">
              Ir a tu siguiente lección (tema {chipLabel(next.tema)})
            </button>
          )}
        </div>
      )}

      <section aria-labelledby="practica-title" className="rounded-folder bg-lilac p-5">
        <h2 id="practica-title" className="display text-[30px]">
          Repasos y casos prácticos
        </h2>
        <p className="text-[15px] mt-2">Cuando lleves varios temas, mézclalos: así es el examen.</p>
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          <Button variant="ink" onClick={() => onPractice({ type: "repaso" })}>
            <Exam size={20} weight="bold" /> Test de repaso
          </Button>
          {(bank.casos || []).map((c) => (
            <Button key={c.id} variant="paper" onClick={() => onPractice({ type: "caso", id: c.id })}>
              {c.titulo}
            </Button>
          ))}
        </div>
      </section>

      <Sheet
        open={!!sheet}
        title={sheetLesson?.titulo || ""}
        onClose={() => setSheet(null)}
        body={
          sheet && (
            <div className="text-ink">
              <p className="text-ink-soft">{temaLabel(bank, sheet.temaId)}</p>
              <p className="mt-2">
                Lección {sheet.index + 1} de {sheetTema.lecciones.length} · {steps} pasos · {exercises} ejercicios
              </p>
              {sheetDone && <p className="mt-2 font-semibold text-olive">Hecha · mejor resultado {sheetDone.best} % a la primera</p>}
            </div>
          )
        }
        actions={
          <>
            <Button
              variant="blue"
              onClick={() => {
                const s = sheet;
                setSheet(null);
                onStartLesson(s.temaId, s.index);
              }}
            >
              <Play size={20} weight="fill" /> {sheetDone ? "Repetir lección" : "Empezar lección"}
            </Button>
            {sheetEp && (
              <Button
                variant="paper"
                onClick={() => {
                  const eps = episodesOf(bank, sheet.temaId);
                  player.play(bank, eps, eps.findIndex((e) => e.i === sheet.index));
                  setSheet(null);
                }}
              >
                <Headphones size={20} weight="bold" /> Escuchar el pódcast ({fmtTime(sheetEp.s)})
              </Button>
            )}
            <Button variant="paper" onClick={() => setSheet(null)}>
              Ahora no
            </Button>
          </>
        }
      />
    </div>
  );
}
