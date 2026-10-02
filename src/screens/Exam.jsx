import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, CaretDown, CaretLeft, CaretRight, Check, Fire, Flag, Minus, Plus, Timer, X } from "@phosphor-icons/react";
import {
  ACHIEVEMENTS,
  mistakePool,
  BLOCKS,
  BLOCK_IDS,
  DEFAULT_PENALTY,
  EXAM_QUESTIONS,
  OFFICIAL_SECONDS_PER_QUESTION,
  PENALTIES,
  scoring,
  fmt2,
  formatClock,
  formatMinutes,
} from "../lib/logic.js";
import { Button, ChoiceTile, Folder, IconButton, ArtIcon, Illustration, Paper, Picker, ProgressBar, Segmented, Sheet } from "../ui.jsx";
import { RankFolder } from "./Home.jsx";
import { casoById, temaLabel, temasOf } from "../lib/bank.js";
import { Rich } from "./Lesson.jsx";
import { useCountUp } from "../lib/motion.js";
import { PAL } from "../lib/palette.js";
import { play } from "../lib/sound.js";

/* ---------------------------------------------------------------------
   Crear el test: pasos numerados (la numeración es el orden real de decisión)
   --------------------------------------------------------------------- */
const COUNTS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100", sub: "simulacro" },
];

function Step({ n, title, hint, children }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`paso-${n}`}>
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-sun font-mono text-sm font-semibold flex items-center justify-center shrink-0">{n}</span>
        <div>
          <h2 id={`paso-${n}`} className="font-semibold text-lg leading-tight">
            {title}
          </h2>
          {hint && <p className="text-sm text-ink-soft mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const num = (x) => (x ? `−${String(x).replace(".", ",")}` : "0");
const penaltyText = (p) => num(scoring(p).wrong);
const blankText = (p) => num(scoring(p).blank);

export function ExamSetup({ store, bank, onSettings, onStart }) {
  const s = store.settings;
  const base = bank.preguntas;
  const penalty = scoring(s.penalty ?? DEFAULT_PENALTY).value;
  const blocks = (s.blocks || []).filter((b) => BLOCK_IDS.includes(b));
  const all = blocks.length === 0;
  const tema = blocks.length === 1 && s.tema && s.tema !== "all" ? s.tema : "all";
  const pendingAll = Object.keys(store.mistakes).length;
  const onlyMistakes = !!s.onlyMistakes && pendingAll > 0;

  const matches = (q) => (all || blocks.includes(q.block)) && (tema === "all" || q.tema === tema);
  const pool = onlyMistakes ? mistakePool(store.mistakes, Infinity).filter(matches) : base.filter(matches);
  const count = Math.min(s.count === "all" ? pool.length : s.count || 20, pool.length);

  const toggleBlock = (id) => {
    const next = blocks.includes(id) ? blocks.filter((b) => b !== id) : [...blocks, id];
    // Marcar los cuatro es lo mismo que «Todo el temario».
    onSettings({ blocks: next.length === BLOCK_IDS.length ? [] : next, tema: "all" });
  };

  const scope = all
    ? "todo el temario"
    : tema !== "all"
      ? temaLabel(bank, tema)
      : blocks.map((b) => BLOCKS[b].short).join(" + ");
  const title = `${onlyMistakes ? "Fallos" : "Test"} · ${all ? "Todo el temario" : tema !== "all" ? temaLabel(bank, tema).split(" · ")[0] + " " + BLOCKS[blocks[0]].short : blocks.map((b) => BLOCKS[b].short).join(" + ")}`;

  const start = () => onStart({ pool, count, feedback: s.feedback, secsPerQ: s.secsPerQ, penalty, source: onlyMistakes ? "mistakes" : "temario", title });
  const simulacro = () =>
    onStart({ pool: base.filter((q) => q.tema !== "casos"), count: EXAM_QUESTIONS, feedback: "final", secsPerQ: s.secsPerQ, penalty, source: "simulacro", title: `Simulacro · ${EXAM_QUESTIONS} preguntas de todo el temario` });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="display text-[48px]">Crea tu test</h1>
        <p className="text-[15px] text-ink-soft mt-2">{base.length} preguntas: las de los tests de la academia (muchas, de exámenes reales de otros ayuntamientos) y las de las lecciones.</p>
      </header>

      <button type="button" onClick={simulacro} className="tap press text-left rounded-folder bg-navy text-ground p-5 flex items-center gap-4">
        <span className="w-12 h-12 blob bg-sun text-ink flex items-center justify-center shrink-0">
          <Timer size={24} weight="fill" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="display text-[26px] block">Simulacro de examen</span>
          <span className="text-sm leading-snug block mt-1 text-ground/85">
            {EXAM_QUESTIONS} preguntas en {EXAM_QUESTIONS} minutos, como el examen, con la corrección de las bases ({penaltyText(penalty)} por fallo y {blankText(penalty)} en blanco)
          </span>
        </span>
        <CaretRight size={22} weight="bold" className="shrink-0" />
      </button>

      <Step n="1" title="¿Qué quieres repasar?" hint="Elige todo el temario o uno o varios bloques.">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5" role="group" aria-label="Qué quieres repasar">
          <ChoiceTile
            wide
            title="Todo el temario"
            note="Común, específica y repasos mezclados"
            color={PAL.sun}
            illustration="todo-temario"
            fallback="simulacro"
            selected={all}
            onClick={() => onSettings({ blocks: [], tema: "all" })}
          />
          {BLOCK_IDS.map((id) => (
            <ChoiceTile
              key={id}
              title={BLOCKS[id].label}
              note={base.some((q) => q.block === id) ? null : "Aún sin preguntas"}
              color={BLOCKS[id].hex}
              illustration={BLOCKS[id].illustration}
              fallback={BLOCKS[id].fallback}
              selected={blocks.includes(id)}
              onClick={() => toggleBlock(id)}
            />
          ))}
        </div>
        {blocks.length === 1 && (
          <Picker
            id="exam-tema"
            label={`Tema de ${BLOCKS[blocks[0]].label}`}
            value={tema}
            onChange={(v) => onSettings({ tema: v })}
            options={[{ value: "all", label: `Todos los temas` }, ...temasOf(bank, blocks[0]).map((t) => ({ value: t.id, num: t.numero, label: t.titulo }))]}
          />
        )}
        <button
          type="button"
          role="switch"
          aria-checked={onlyMistakes}
          disabled={!pendingAll}
          onClick={() => onSettings({ onlyMistakes: !onlyMistakes })}
          className="tap press flex items-center justify-between gap-3 h-16 px-4 rounded-folder bg-card paper-shadow disabled:opacity-40"
        >
          <span className="text-left">
            <span className="block font-semibold text-sm">Solo mis fallos</span>
            <span className="block text-xs text-ink-soft">{pendingAll ? `${pendingAll} preguntas falladas pendientes` : "Aún no tienes fallos guardados"}</span>
          </span>
          <span className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${onlyMistakes ? "bg-plum" : "bg-line-strong"}`} aria-hidden="true">
            <span className={`block w-5 h-5 rounded-full bg-card transition-transform duration-200 ease-out ${onlyMistakes ? "translate-x-5" : ""}`} />
          </span>
        </button>
      </Step>

      <Step n="2" title="¿Cuántas preguntas?">
        <Segmented hideLabel label="Número de preguntas" value={s.count} onChange={(v) => onSettings({ count: v })} options={COUNTS} />
      </Step>

      <Step n="3" title="¿Cuándo ves las respuestas?">
        <Segmented
          hideLabel
          label="Corrección"
          value={s.feedback}
          onChange={(v) => onSettings({ feedback: v })}
          options={[
            { value: "immediate", label: "Al momento", sub: "tras cada pregunta" },
            { value: "final", label: "Al entregar", sub: "como el examen real" },
          ]}
        />
      </Step>

      <Step n="4" title="Tiempo por pregunta">
        <div className="flex items-center gap-3 rounded-full bg-card paper-shadow p-2">
          <IconButton label="Menos tiempo" onClick={() => onSettings({ secsPerQ: Math.max(30, s.secsPerQ - 6) })} className="bg-ground">
            <Minus size={22} weight="bold" />
          </IconButton>
          <div className="flex-1 text-center">
            <p className="font-mono text-2xl font-semibold">{s.secsPerQ} s</p>
            <p className="text-xs text-ink-soft">{s.secsPerQ === OFFICIAL_SECONDS_PER_QUESTION ? "1 minuto por pregunta" : "Ritmo personalizado"}</p>
          </div>
          <IconButton label="Más tiempo" onClick={() => onSettings({ secsPerQ: Math.min(120, s.secsPerQ + 6) })} className="bg-ground">
            <Plus size={22} weight="bold" />
          </IconButton>
        </div>
      </Step>

      <Step n="5" title="¿Cómo se corrige?" hint="Las bases: el fallo resta 0,25 y la pregunta en blanco también resta, 0,10.">
        <Segmented hideLabel label="Penalización" value={penalty} onChange={(v) => onSettings({ penalty: v })} options={PENALTIES.map((p) => ({ value: p.value, label: p.label }))} />
      </Step>

      <div className="rounded-folder bg-sky p-5">
        <span className="w-12 h-12 bg-card blob flex items-center justify-center">
          <ArtIcon name="simulacro" size="50%" />
        </span>
        <p className="display text-[28px] leading-tight mt-3">
          {count} preguntas {onlyMistakes ? "falladas " : ""}de {scope} · {formatMinutes(count * s.secsPerQ)}
        </p>
        {pool.length < (s.count || 0) && pool.length > 0 && (
          <p className="text-sm mt-1">Con esta selección solo hay {pool.length} preguntas.</p>
        )}
        {!pool.length && <p className="text-sm text-plum font-semibold mt-1">No hay preguntas con esta selección. Prueba con otra carpeta.</p>}
        <p className="label mt-5">Corrección</p>
        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
          <div className="rounded-xl bg-mint py-2">
            <p className="font-mono text-xl font-semibold">+1</p>
            <p className="text-xs">Acierto</p>
          </div>
          <div className="rounded-xl bg-card py-2">
            <p className="font-mono text-xl font-semibold">{blankText(penalty)}</p>
            <p className="text-xs">En blanco</p>
          </div>
          <div className="rounded-xl bg-peach py-2">
            <p className="font-mono text-xl font-semibold">{penaltyText(penalty)}</p>
            <p className="text-xs">Fallo</p>
          </div>
        </div>
        <p className="text-sm mt-3">
          {penalty === "none"
            ? "Sin restar: para practicar. Responde siempre."
            : "Nota = aciertos − 0,25 × fallos − 0,10 × en blanco. Como la pregunta en blanco también resta, contesta siempre: aunque dudes entre las cuatro, contestar sale a cuenta."}
        </p>
        <Button variant="blue" onClick={start} disabled={!count} className="w-full mt-5">
          <Timer size={22} weight="bold" />
          Empezar test
        </Button>
      </div>

      {store.history.length > 0 && (
        <section aria-labelledby="historial-title">
          <h2 id="historial-title" className="display text-[30px] mb-3">
            Últimos tests
          </h2>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {store.history.slice(0, 5).map((h) => (
              <li key={h.id} className="py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{h.title}</p>
                  <p className="font-mono text-xs text-ink-soft mt-0.5">
                    {new Date(h.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {h.correct} aciertos · {h.wrong} fallos · {h.blank} en blanco
                  </p>
                </div>
                <p className="font-mono text-lg font-semibold" aria-label={`Nota ${fmt2(h.over10)} sobre 10`}>
                  {fmt2(h.over10)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Examen en curso
   --------------------------------------------------------------------- */
export function ExamRunner({ exam, bank, remainingMs, onSelect, onBlank, onGoto, onFinish, onAbandon }) {
  const [sheet, setSheet] = useState(null); // "finish" | "abandon" | null
  const chipRefs = useRef([]);
  const scrollRef = useRef(null);
  const n = exam.questions.length;
  const i = exam.current;
  const q = exam.questions[i];
  const block = BLOCKS[q.block] || BLOCKS.practica;
  const caso = q.caso ? casoById(bank, q.caso) : null;
  const penalty = exam.penalty ?? DEFAULT_PENALTY;
  const chosen = exam.answers[i];
  const immediate = exam.feedback === "immediate";
  const revealed = immediate && exam.revealed[i];
  const answeredCount = exam.answers.filter((a) => a !== null).length;
  const blankCount = n - answeredCount;
  const timePct = (remainingMs / (n * exam.secsPerQ * 1000)) * 100;
  const critical = remainingMs <= 60000;
  const warning = !critical && timePct <= 20;
  const allRevealed = immediate && exam.revealed.every(Boolean);
  const prevIndex = useRef(i);
  const dir = i >= prevIndex.current ? 1 : -1;
  useEffect(() => {
    prevIndex.current = i;
  }, [i]);

  // Racha de aciertos seguidos (solo con corrección al momento): cuenta hacia atrás desde la última corregida.
  let streak = 0;
  if (immediate) {
    for (let k = i; k >= 0; k--) {
      if (!exam.revealed[k]) {
        if (k === i) continue;
        break;
      }
      if (exam.answers[k] === exam.questions[k].answer) streak++;
      else break;
    }
  }
  // Vibración corta al corregir: un toque si aciertas, doble si fallas y triple cada 5 seguidas.
  const buzzed = useRef(new Set());
  useEffect(() => {
    if (!revealed || buzzed.current.has(i)) return;
    buzzed.current.add(i);
    const ok = chosen === q.answer;
    play(ok ? (streak > 0 && streak % 5 === 0 ? "combo" : "correct") : "wrong");
    try {
      navigator.vibrate?.(ok ? (streak > 0 && streak % 5 === 0 ? [20, 40, 20, 40, 20] : 12) : [30, 60, 30]);
    } catch (e) {
      /* sin vibración */
    }
  }, [revealed, i, chosen, q.answer, streak]);

  useEffect(() => {
    chipRefs.current[i]?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [i]);

  const chipClass = (idx) => {
    const a = exam.answers[idx];
    const ring = idx === i ? "ring-2 ring-ink ring-offset-2 ring-offset-card " : "";
    if (immediate && exam.revealed[idx]) {
      if (a === null) return ring + "bg-line text-ink";
      return ring + (a === exam.questions[idx].answer ? "bg-mint text-ink" : "bg-peach text-ink");
    }
    return ring + (a !== null ? "bg-ink text-ground" : "bg-ground text-ink-soft");
  };

  const optionClass = (idx) => {
    if (revealed) {
      if (idx === q.answer) return `bg-mint border-olive text-ink ${idx === chosen ? "anim-correct" : ""}`;
      if (idx === chosen) return "bg-peach border-plum text-ink anim-shake";
      return "bg-card border-line text-ink-soft opacity-70";
    }
    if (idx === chosen) return "bg-sky border-ink text-ink";
    return "bg-card border-line text-ink hover:border-ink/40";
  };

  const verdict = chosen === q.answer ? { label: "Correcta · +1", cls: "text-olive" } : chosen === null ? { label: `En blanco · ${blankText(penalty)}`, cls: "text-ink-soft" } : { label: `Incorrecta · ${penaltyText(penalty)}`, cls: "text-plum" };

  // Teclado (escritorio): 1-4 o A-D responden, flechas para moverse, Intro para seguir.
  const keys = useRef();
  keys.current = { i, n, revealed, onSelect, onGoto, immediate };
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[role="dialog"]')) return;
      const k = keys.current;
      const key = e.key.toLowerCase();
      const idx = /^[1-4]$/.test(key) ? Number(key) - 1 : "abcd".indexOf(key);
      if (idx >= 0 && key.length === 1) {
        if (!k.revealed) k.onSelect(idx);
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (k.i < k.n - 1) k.onGoto(k.i + 1);
      } else if (e.key === "ArrowLeft") {
        if (k.i > 0) k.onGoto(k.i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  let center;
  if (immediate && !revealed) {
    center = (
      <Button variant="ghost" onClick={onBlank} className="flex-1">
        Dejar en blanco
      </Button>
    );
  } else if (immediate && i < n - 1 && !allRevealed) {
    center = (
      <Button variant="paper" onClick={() => onGoto(i + 1)} className="flex-1">
        Siguiente <CaretRight size={20} weight="bold" />
      </Button>
    );
  } else if (immediate) {
    center = (
      <Button onClick={() => (allRevealed ? onFinish() : setSheet("finish"))} className="flex-1">
        <Flag size={20} weight="bold" /> Ver resultado
      </Button>
    );
  } else if (i === n - 1) {
    center = (
      <Button onClick={() => setSheet("finish")} className="flex-1">
        <Flag size={20} weight="bold" /> Entregar
      </Button>
    );
  } else {
    center = (
      <Button variant="paper" onClick={() => onGoto(i + 1)} className="flex-1">
        Siguiente <CaretRight size={20} weight="bold" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-ground">
      <div className="pt-safe px-4 pb-3 bg-card rounded-b-[28px] paper-shadow">
        <div className="flex items-center justify-between gap-2 max-w-md lg:max-w-2xl mx-auto">
          <IconButton label="Abandonar examen" onClick={() => setSheet("abandon")} className="bg-ground">
            <X size={22} weight="bold" />
          </IconButton>
          <div
            role="timer"
            aria-label={`Tiempo restante ${formatClock(remainingMs)}`}
            className={`flex items-center gap-2 px-4 h-12 rounded-full font-mono text-xl font-semibold tabular-nums transition-colors duration-500 ${
              critical ? "bg-plum text-ground animate-pulse motion-reduce:animate-none" : warning ? "bg-sun text-ink" : "bg-ground text-ink"
            }`}
          >
            <Timer size={22} weight="bold" />
            {formatClock(remainingMs)}
          </div>
          <button type="button" onClick={() => setSheet("finish")} className="tap press h-12 px-5 rounded-full bg-ink text-ground font-semibold text-sm">
            Entregar
          </button>
        </div>
        <div className="max-w-md lg:max-w-2xl mx-auto mt-3">
          <ProgressBar pct={timePct} color={critical ? PAL.plum : PAL.ink} track="bg-ground-2" className="h-1.5" label="Tiempo restante" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 px-1 py-1.5 -mx-1">
            {exam.questions.map((_, idx) => (
              <button
                key={idx}
                ref={(el) => (chipRefs.current[idx] = el)}
                type="button"
                onClick={() => onGoto(idx)}
                aria-label={`Ir a la pregunta ${idx + 1}`}
                aria-current={idx === i ? "step" : undefined}
                className={`tap press w-11 h-11 shrink-0 rounded-full font-mono text-sm font-semibold ${chipClass(idx)}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 scroll-area overflow-x-hidden px-4 pt-4 pb-6">
        {/* La pregunta nueva entra desde el lado hacia el que avanzas. Se ve decenas de veces por
            examen: 180 ms, 16 px y sin animación de salida. */}
        <div key={i} className={`max-w-md lg:max-w-2xl mx-auto ${dir > 0 ? "anim-q-next" : "anim-q-prev"}`}>
          {immediate && (
            <div className="h-9 -mt-1 mb-2 flex justify-end items-center" aria-live="polite">
              {streak >= 2 && (
                <span key={streak} className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-peach text-ink px-3 h-8 text-sm font-semibold">
                  <Fire size={16} weight="fill" className="anim-flicker text-plum" /> {streak} seguidas
                  {streak % 5 === 0 && <span className="text-plum">· ¡imparable!</span>}
                </span>
              )}
            </div>
          )}
          {caso && (
            <details className="mb-4 rounded-folder bg-lilac p-4 group" open={i === 0}>
              <summary className="cursor-pointer font-semibold list-none flex items-center justify-between gap-2">
                Supuesto · {caso.titulo}
                <CaretDown size={18} weight="bold" className="transition-transform group-open:rotate-180" />
              </summary>
              <Rich text={caso.contexto} className="font-serif text-[16px] leading-relaxed mt-2" />
            </details>
          )}
          <Folder color={block.hex} tab={temaLabel(bank, q.tema).split(" · ")[0] || block.short}>
            <div className="p-2.5">
              <Paper className="p-5">
                <p className="label text-ink-soft">
                  Pregunta {i + 1} de {n}
                  {q.origin?.startsWith("Examen real") && <span className="block text-xs mt-0.5 font-normal">{q.origin}</span>}
                </p>
                <h2 className="font-serif text-[21px] leading-snug mt-2" style={{ textWrap: "pretty" }}>
                  {q.q}
                </h2>
              </Paper>
            </div>
          </Folder>

          <div className="flex flex-col gap-2.5 mt-4" role="group" aria-label="Respuestas">
            {q.options.map((opt, idx) => (
              <button
                key={`${i}-${idx}`}
                type="button"
                aria-pressed={chosen === idx}
                onClick={() => onSelect(idx)}
                disabled={revealed}
                className={`tap press min-h-[60px] w-full rounded-[22px] border-2 px-3 py-3 flex items-center gap-3 text-left ${optionClass(idx)}`}
              >
                <span className="w-9 h-9 rounded-full bg-ground/80 flex items-center justify-center font-mono font-semibold shrink-0">
                  {revealed && idx === q.answer ? <Check size={20} weight="bold" /> : revealed && idx === chosen ? <X size={20} weight="bold" /> : "ABCD"[idx]}
                </span>
                <span className="text-base leading-snug">{opt}</span>
              </button>
            ))}
          </div>

          {!immediate && chosen !== null && <p className="text-sm text-ink-soft mt-3">Toca de nuevo tu respuesta para dejarla en blanco.</p>}

          {revealed && (
            <Paper className="mt-4 p-4 anim-pop" aria-live="polite">
              <p className={`label ${verdict.cls}`}>{verdict.label}</p>
              {q.exp ? <p className="font-serif text-[17px] leading-relaxed mt-1">{q.exp}</p> : <p className="font-serif text-[17px] leading-relaxed mt-1">La correcta es la {"ABCD"[q.answer]}: {q.options[q.answer]}</p>}
            </Paper>
          )}
        </div>
      </div>

      <div className="px-4 pt-3 pb-safe bg-ground">
        <div className="max-w-md lg:max-w-2xl mx-auto flex items-center gap-2">
          <IconButton label="Pregunta anterior" disabled={i === 0} onClick={() => onGoto(i - 1)} className="w-14 h-14 bg-card paper-shadow">
            <CaretLeft size={24} weight="bold" />
          </IconButton>
          {center}
          <IconButton label="Pregunta siguiente" disabled={i === n - 1} onClick={() => onGoto(i + 1)} className="w-14 h-14 bg-card paper-shadow">
            <CaretRight size={24} weight="bold" />
          </IconButton>
        </div>
      </div>

      <Sheet
        open={sheet === "finish"}
        title="¿Entregar?"
        illustration="entregar"
        onClose={() => setSheet(null)}
        body={
          <>
            Has respondido <span className="font-mono text-ink">{answeredCount}</span> de <span className="font-mono text-ink">{n}</span>.
            {blankCount > 0 && <> Las {blankCount} sin responder cuentan como blanco y no restan.</>}
            <span className="hidden lg:block mt-2 text-sm">Atajos: 1-4 responde · ← → para moverte.</span>
          </>
        }
        actions={
          <>
            <Button variant="blue" onClick={() => { setSheet(null); onFinish(); }}>
              Entregar y corregir
            </Button>
            <Button variant="paper" onClick={() => setSheet(null)}>
              Seguir respondiendo
            </Button>
          </>
        }
      />
      <Sheet
        open={sheet === "abandon"}
        title="¿Abandonar?"
        illustration="abandonar"
        onClose={() => setSheet(null)}
        body="Perderás las respuestas de este intento. No suma XP ni cuenta para la racha."
        actions={
          <>
            <Button variant="red" onClick={() => { setSheet(null); onAbandon(); }}>
              Abandonar examen
            </Button>
            <Button variant="paper" onClick={() => setSheet(null)}>
              Volver al examen
            </Button>
          </>
        }
      />
    </div>
  );
}

/* ---------------------------------------------------------------------
   Resultado
   --------------------------------------------------------------------- */
export function ExamResults({ result, xp, pendingMistakes, onNew, onHome, onReview }) {
  const { grade, exam, xpGained, rankBefore, rankAfter, earned, reason } = result;
  const [open, setOpen] = useState(() => new Set());
  const promoted = rankAfter.level > rankBefore.level;
  // La nota «cuenta» hasta su valor: se ve una vez por test, es el momento de celebrar.
  const netShown = useCountUp(grade.net, { decimals: 2 });
  const over10Shown = useCountUp(grade.over10, { decimals: 2 });
  const art = reason === "timeout" ? "tiempo-agotado" : promoted ? "ascenso" : grade.over10 >= 7 ? "resultado-alto" : grade.over10 >= 4 ? "resultado-medio" : "resultado-bajo";
  const toggle = (idx) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[48px]">Resultado</h1>
        <p className="text-sm text-ink-soft mt-1">{exam.title}</p>
        {reason === "timeout" && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink bg-sun rounded-full px-4 py-2">
            <Timer size={18} weight="bold" /> Tiempo agotado: se entregó solo.
          </p>
        )}
      </header>

      <div className="rounded-folder bg-sun p-5 anim-pop">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="label">Acta de corrección</p>
            <p className="brand text-[64px] leading-none mt-2" aria-label={`Nota ${fmt2(grade.net)}`}>
              {fmt2(netShown)}
            </p>
            <p className="font-mono text-sm mt-1">
              sobre {grade.n} · {grade.correct} aciertos − {grade.wrong} fallos{grade.penalty === "none" ? " (no restan)" : ` × 0,25 − ${grade.blank} en blanco × 0,10`}
            </p>
          </div>
          <div className="w-28 h-28 p-2 shrink-0 bg-card blob">
            <Illustration name={art} className="w-full" alt="" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span>Nota sobre 10</span>
            <span className="font-mono font-semibold">{fmt2(over10Shown)}</span>
          </div>
          <ProgressBar pct={grade.over10 * 10} color={PAL.ink} track="bg-card/70" className="h-3" label="Nota sobre 10" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <div className="rounded-xl bg-card py-3">
            <p className="font-mono text-2xl font-semibold">{grade.correct}</p>
            <p className="text-xs">Aciertos</p>
          </div>
          <div className="rounded-xl bg-card py-3">
            <p className="font-mono text-2xl font-semibold">{grade.wrong}</p>
            <p className="text-xs">Fallos</p>
          </div>
          <div className="rounded-xl bg-card py-3">
            <p className="font-mono text-2xl font-semibold">{grade.blank}</p>
            <p className="text-xs">En blanco</p>
          </div>
        </div>
      </div>

      <div>
        {promoted && (
          <p className="font-serif text-xl mb-3">
            ¡Ascenso! Ahora eres <span className="font-semibold text-plum">{rankAfter.name}</span>.
          </p>
        )}
        <RankFolder xp={xp} from={xp - xpGained} tab={`+${xpGained} XP en este test`} />
      </div>

      {earned.length > 0 && (
        <section aria-labelledby="medallas-nuevas">
          <h2 id="medallas-nuevas" className="display text-[30px] mb-3">Medallas nuevas</h2>
          <div className="flex flex-col gap-2">
            {earned.map((id, k) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id);
              return (
                <div key={id} className="anim-medal" style={{ animationDelay: `${350 + k * 80}ms` }}>
                  <Paper className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 bg-lilac blob flex items-center justify-center">
                      <ArtIcon name={a.illustration} size="50%" />
                    </div>
                    <div>
                      <p className="font-serif text-lg leading-tight">{a.name}</p>
                      <p className="text-sm text-ink-soft">{a.desc}</p>
                    </div>
                  </Paper>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(grade.wrong > 0 || result.mastered > 0) && (
        <p className="text-[15px] text-ink-soft -mb-3">
          {grade.wrong > 0 && <>Tus {grade.wrong} {grade.wrong === 1 ? "fallo se ha guardado" : "fallos se han guardado"} para repasar. </>}
          {result.mastered > 0 && (
            <>
              <span className="font-semibold text-ink">{result.mastered} {result.mastered === 1 ? "pregunta dominada" : "preguntas dominadas"}</span>: salen del repaso.
            </>
          )}
        </p>
      )}
      {pendingMistakes > 0 && (
        <Button variant="red" onClick={onReview} className="w-full">
          <ArrowCounterClockwise size={20} weight="bold" /> Repasar mis fallos · {pendingMistakes}
        </Button>
      )}
      <div className="grid grid-cols-2 gap-2 -mt-4">
        <Button variant="blue" onClick={onNew}>
          <ArrowCounterClockwise size={20} weight="bold" /> Nuevo test
        </Button>
        <Button variant="ghost" onClick={onHome}>
          Ir a inicio
        </Button>
      </div>

      <section aria-labelledby="revision-title">
        <h2 id="revision-title" className="display text-[30px] mb-3">Revisión</h2>
        <ul className="flex flex-col gap-2">
          {exam.questions.map((q, idx) => {
            const a = exam.answers[idx];
            const status = a === null ? "blank" : a === q.answer ? "ok" : "ko";
            const isOpen = open.has(idx);
            return (
              <li key={q.id + idx} className="rounded-folder bg-card paper-shadow overflow-hidden">
                <button type="button" onClick={() => toggle(idx)} className="tap w-full px-3 py-3 flex items-center gap-3 text-left" aria-expanded={isOpen}>
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      status === "ok" ? "bg-mint text-olive" : status === "ko" ? "bg-peach text-plum" : "bg-ground-2"
                    }`}
                    aria-label={status === "ok" ? "Acierto" : status === "ko" ? "Fallo" : "En blanco"}
                  >
                    {status === "ok" ? <Check size={18} weight="bold" /> : status === "ko" ? <X size={18} weight="bold" /> : <Minus size={18} weight="bold" />}
                  </span>
                  <span className="flex-1 text-[15px] leading-snug">
                    <span className="font-mono text-ink-soft mr-1">{idx + 1}.</span>
                    {q.q}
                  </span>
                  <CaretDown size={20} weight="bold" className={`text-ink-soft shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 anim-fade">
                    <div className="rounded-xl bg-ground p-3">
                      <ul className="flex flex-col gap-1">
                        {q.options.map((opt, oi) => (
                          <li
                            key={oi}
                            className={`text-sm rounded-xl px-2.5 py-2 ${
                              oi === q.answer ? "bg-mint text-ink" : oi === a ? "bg-peach text-ink" : "text-ink-soft"
                            }`}
                          >
                            <span className="font-mono font-semibold mr-2">{"ABCD"[oi]}</span>
                            {opt}
                          </li>
                        ))}
                      </ul>
                      <p className="font-serif text-[16px] leading-relaxed mt-3">{q.exp}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
