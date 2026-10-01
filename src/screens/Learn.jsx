import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Crown, Exam, Lock, Play, Star, Trophy } from "@phosphor-icons/react";
import { BLOCKS, UNIT_COLORS, lessonKey } from "../lib/logic.js";
import { learnTemas, temaLabel } from "../lib/bank.js";
import { nextLesson, unitDoneCount } from "../lib/tutor.js";
import { Button, Folder, Paper, ProgressBar, Sheet } from "../ui.jsx";
import { PAL } from "../lib/palette.js";

/* Camino de aprendizaje (como Duolingo): cada tema es una unidad con sus lecciones en zigzag
   y, al final, el examen del tema. Todo está abierto (es tu temario), pero el tutor marca
   la siguiente lección recomendada. */

const ZIGZAG = [0, 44, 66, 44, 0, -44, -66, -44];

export const unitColor = (bank, temaId) => {
  const i = learnTemas(bank).findIndex((t) => t.id === temaId);
  return UNIT_COLORS[(i < 0 ? 0 : i) % UNIT_COLORS.length];
};

function Node({ state, color, label, offset, onClick, icon, isNext, nodeRef }) {
  const Icon = icon;
  return (
    <li className="relative flex justify-center" style={{ transform: `translateX(${offset}px)` }}>
      {isNext && (
        <span className={`absolute top-1/2 z-[1] ${offset > 0 ? "right-1/2 mr-12" : "left-1/2 ml-12"}`} aria-hidden="true">
          <span className="block -translate-y-1/2 anim-bob-x relative rounded-[12px] bg-ink text-ground text-sm font-semibold px-3 py-1.5 whitespace-nowrap">
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
        className={`tap press relative w-[72px] h-[66px] rounded-[50%] flex items-center justify-center ${isNext ? "ring-4 ring-ink/15 ring-offset-4 ring-offset-ground" : ""}`}
        style={{
          background: state === "done" ? color : state === "next" ? color : PAL.ground2,
          boxShadow: `0 7px 0 ${state === "pending" ? "#e2d3ae" : "rgba(34,34,34,0.28)"}`,
        }}
      >
        <Icon size={30} weight={state === "pending" || Icon === Check ? "bold" : "fill"} className={state === "pending" ? "text-line-strong" : "text-ink"} />
      </button>
    </li>
  );
}

function Unit({ bank, tema, store, color, nextRef, next, onOpenLesson, onTemaExam, onApuntes }) {
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
              icon={isDone ? Check : isNext ? Play : i % 3 === 2 ? Star : BookOpen}
              isNext={isNext}
              label={`Lección ${i + 1}: ${l.titulo}${isDone ? " (hecha)" : ""}`}
              onClick={() => onOpenLesson(tema.id, i)}
            />
          );
        })}
        <Node
          state={exam?.passed ? "done" : allDone ? "next" : "pending"}
          color={PAL.sun}
          offset={ZIGZAG[total % ZIGZAG.length]}
          icon={exam?.passed ? Crown : allDone ? Trophy : Lock}
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

  // Al entrar, el camino se coloca en la siguiente lección.
  useEffect(() => {
    const t = setTimeout(() => nextRef.current?.scrollIntoView?.({ block: "center", behavior: "smooth" }), 250);
    return () => clearTimeout(t);
  }, []);

  const sheetTema = sheet && temas.find((t) => t.id === sheet.temaId);
  const sheetLesson = sheetTema?.lecciones[sheet.index];
  const sheetDone = sheet && store.lessons?.[lessonKey(sheet.temaId, sheet.index)];
  const steps = sheetLesson?.pasos.length || 0;
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

      {groups.map(({ b, temas: list }) => (
        <section key={b} aria-labelledby={`grupo-${b}`} className="flex flex-col gap-10">
          <h2 id={`grupo-${b}`} className="display text-[34px] flex items-center gap-3">
            <span className="w-5 h-5 blob" style={{ background: BLOCKS[b].hex }} aria-hidden="true" />
            {BLOCKS[b].label}
          </h2>
          {list.map((t) => (
            <Unit
              key={t.id}
              bank={bank}
              tema={t}
              store={store}
              color={unitColor(bank, t.id)}
              next={next}
              nextRef={nextRef}
              onOpenLesson={(temaId, index) => setSheet({ temaId, index })}
              onTemaExam={onTemaExam}
              onApuntes={onApuntes}
            />
          ))}
        </section>
      ))}

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
            <Button variant="paper" onClick={() => setSheet(null)}>
              Ahora no
            </Button>
          </>
        }
      />
    </div>
  );
}
