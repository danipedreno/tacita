import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, Check, CheckCircle, Lightbulb, X, XCircle } from "@phosphor-icons/react";
import { isInteractive, shuffle } from "../lib/logic.js";
import { Button, IconButton, Paper, ProgressBar, Sheet } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import { play } from "../lib/sound.js";
import { Mascot } from "../mascots.jsx";

/* ---------------------------------------------------------------------
   Reproductor de lecciones (como Duolingo): una tarjeta por paso, comprobar y continuar.
   Los pasos fallados vuelven al final de la lección hasta acertarlos (máximo dos repeticiones).
   Teclado: 1-4 / A-D eligen, Enter comprueba y continúa, V/F en verdadero o falso.
   --------------------------------------------------------------------- */

/** Texto con **negritas** y saltos de línea. */
export function Rich({ text, className = "" }) {
  const lines = String(text).split("\n");
  return (
    <div className={className}>
      {lines.map((line, k) => (
        <p key={k} className={k ? "mt-2" : ""}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-semibold text-ink">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            )
          )}
        </p>
      ))}
    </div>
  );
}

const KIND_LABEL = {
  teoria: "Aprende",
  test: "Elige la respuesta",
  vf: "¿Verdadero o falso?",
  hueco: "Completa el hueco",
  pares: "Une las parejas",
  orden: "Ordena",
};

/* ---------- Pasos ---------- */

function Theory({ step }) {
  return (
    <Paper className="p-5 lg:p-7">
      <h2 className="display text-[30px] lg:text-[36px]">{step.titulo}</h2>
      <Rich text={step.texto} className="font-serif text-[18px] lg:text-[19px] leading-relaxed mt-4 text-ink" />
      {step.puntos?.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {step.puntos.map((p, k) => (
            <li key={k} className="flex gap-2.5 font-serif text-[17px] leading-snug">
              <span className="w-2 h-2 rounded-full bg-ink mt-2.5 shrink-0" aria-hidden="true" />
              <Rich text={p} />
            </li>
          ))}
        </ul>
      )}
      {step.truco && (
        <div className="mt-5 rounded-[16px] bg-sun p-4 flex gap-3">
          <Lightbulb size={24} weight="fill" className="shrink-0" />
          <div>
            <p className="label">Truco para recordarlo</p>
            <Rich text={step.truco} className="text-[16px] leading-snug mt-0.5" />
          </div>
        </div>
      )}
    </Paper>
  );
}

function Option({ letter, text, state, onClick, disabled }) {
  const cls =
    state === "right"
      ? "bg-mint border-olive anim-correct"
      : state === "wrong"
        ? "bg-peach border-plum anim-shake"
        : state === "chosen"
          ? "bg-sky border-ink"
          : state === "dim"
            ? "bg-card border-line text-ink-soft opacity-70"
            : "bg-card border-line hover:border-ink/40";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "chosen"}
      className={`tap press min-h-[56px] w-full rounded-[20px] border-2 px-3 py-3 flex items-center gap-3 text-left text-ink ${cls}`}
    >
      {letter && (
        <span className="w-8 h-8 rounded-full bg-ground/80 flex items-center justify-center font-mono text-sm font-semibold shrink-0">
          {state === "right" ? <Check size={18} weight="bold" /> : state === "wrong" ? <X size={18} weight="bold" /> : letter}
        </span>
      )}
      <span className="text-[16px] leading-snug">{text}</span>
    </button>
  );
}

function Choice({ step, answer, setAnswer, checked, order }) {
  const isHueco = step.t === "hueco";
  const [before, after] = isHueco ? step.q.split("___") : [step.q, ""];
  const filled = isHueco && answer !== null ? step.o[answer] : null;
  return (
    <>
      <Paper className="p-5">
        <h2 className="font-serif text-[21px] leading-snug" style={{ textWrap: "pretty" }}>
          {isHueco ? (
            <>
              {before}
              <span
                className={`inline-block min-w-[5.5rem] px-2 mx-0.5 rounded-lg border-b-[3px] text-center ${
                  checked ? (answer === step.a ? "bg-mint border-olive" : "bg-peach border-plum") : filled ? "bg-sky border-ink" : "border-ink/40"
                }`}
              >
                {filled || " "}
              </span>
              {after}
            </>
          ) : (
            step.q
          )}
        </h2>
      </Paper>
      <div className={`mt-4 ${isHueco ? "flex flex-wrap gap-2" : "flex flex-col gap-2.5"}`} role="group" aria-label="Respuestas">
        {order.map((idx, k) => {
          const state = checked ? (idx === step.a ? "right" : idx === answer ? "wrong" : "dim") : idx === answer ? "chosen" : "idle";
          return isHueco ? (
            <button
              key={idx}
              type="button"
              disabled={checked}
              onClick={() => setAnswer(idx === answer ? null : idx)}
              className={`tap press min-h-12 px-4 rounded-full border-2 font-semibold text-[15px] ${
                state === "right" ? "bg-mint border-olive" : state === "wrong" ? "bg-peach border-plum" : state === "chosen" ? "bg-sky border-ink" : state === "dim" ? "bg-card border-line opacity-60" : "bg-card border-line hover:border-ink/40"
              }`}
            >
              <span className="font-mono text-ink-soft mr-1.5 text-xs">{k + 1}</span>
              {step.o[idx]}
            </button>
          ) : (
            <Option key={idx} letter={"ABCDEF"[k]} text={step.o[idx]} state={state} disabled={checked} onClick={() => setAnswer(idx)} />
          );
        })}
      </div>
    </>
  );
}

function TrueFalse({ step, answer, setAnswer, checked }) {
  const btn = (value, label) => {
    const state = checked ? (value === step.a ? "right" : value === answer ? "wrong" : "dim") : value === answer ? "chosen" : "idle";
    return (
      <button
        type="button"
        disabled={checked}
        onClick={() => setAnswer(value)}
        className={`tap press h-20 rounded-[22px] border-2 font-semibold text-lg flex items-center justify-center gap-2 ${
          state === "right" ? "bg-mint border-olive anim-correct" : state === "wrong" ? "bg-peach border-plum anim-shake" : state === "chosen" ? "bg-sky border-ink" : state === "dim" ? "bg-card border-line opacity-60" : "bg-card border-line hover:border-ink/40"
        }`}
      >
        {value ? <CheckCircle size={26} weight="fill" className="text-olive" /> : <XCircle size={26} weight="fill" className="text-plum" />}
        {label}
      </button>
    );
  };
  return (
    <>
      <Paper className="p-5">
        <h2 className="font-serif text-[21px] leading-snug" style={{ textWrap: "pretty" }}>
          {step.q}
        </h2>
      </Paper>
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {btn(true, "Verdadero")}
        {btn(false, "Falso")}
      </div>
    </>
  );
}

/**
 * Parejas: se toca un elemento de la izquierda y luego uno de la derecha. Si encajan, se apagan.
 * Se compara por texto (puede haber dos derechas iguales, p. ej. dos órganos con el mismo titular).
 */
function Pairs({ step, onDone, onMiss }) {
  const left = useMemo(() => shuffle(step.pares.map((p, i) => ({ i, text: p[0] }))), [step]);
  const right = useMemo(() => shuffle(step.pares.map((p, i) => ({ i, text: p[1] }))), [step]);
  const [selL, setSelL] = useState(null);
  const [selR, setSelR] = useState(null);
  const [doneL, setDoneL] = useState(() => new Set());
  const [doneR, setDoneR] = useState(() => new Set());
  const [bad, setBad] = useState(null); // { l, r } un instante tras fallar
  const missed = useRef(false);

  const tryMatch = (l, r) => {
    if (l === null || r === null) return;
    const ok = step.pares[l][1] === right.find((x) => x.i === r).text;
    if (ok) {
      play("card");
      const nl = new Set(doneL).add(l);
      const nr = new Set(doneR).add(r);
      setDoneL(nl);
      setDoneR(nr);
      setSelL(null);
      setSelR(null);
      if (nl.size === step.pares.length) onDone(!missed.current);
    } else {
      play("wrong");
      missed.current = true;
      onMiss?.();
      setBad({ l, r });
      setTimeout(() => {
        setBad(null);
        setSelL(null);
        setSelR(null);
      }, 450);
    }
  };
  const cell = (side, item) => {
    const done = side === "l" ? doneL.has(item.i) : doneR.has(item.i);
    const sel = side === "l" ? selL === item.i : selR === item.i;
    const wrong = bad && (side === "l" ? bad.l === item.i : bad.r === item.i);
    return (
      <button
        key={`${side}${item.i}`}
        type="button"
        disabled={done || !!bad}
        onClick={() => {
          if (side === "l") {
            setSelL(item.i);
            tryMatch(item.i, selR);
          } else {
            setSelR(item.i);
            tryMatch(selL, item.i);
          }
        }}
        className={`tap press min-h-[56px] w-full rounded-[18px] border-2 px-3 py-2 text-[15px] leading-snug text-left transition-opacity duration-300 ${
          done ? "bg-mint border-transparent opacity-40" : wrong ? "bg-peach border-plum anim-shake" : sel ? "bg-sky border-ink" : "bg-card border-line hover:border-ink/40"
        }`}
      >
        {item.text}
      </button>
    );
  };
  return (
    <>
      <p className="font-serif text-[20px] leading-snug mb-4">{step.q}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-2.5">{left.map((x) => cell("l", x))}</div>
        <div className="flex flex-col gap-2.5">{right.map((x) => cell("r", x))}</div>
      </div>
    </>
  );
}

/** Ordenar: se tocan los elementos en orden; tocando uno ya colocado vuelve a la bolsa. */
function Order({ step, answer, setAnswer, checked }) {
  const pool = useMemo(() => {
    let s = shuffle(step.items.map((_, i) => i));
    if (s.every((v, k) => v === k)) s = s.reverse(); // nunca empezar ya ordenado
    return s;
  }, [step]);
  const placed = answer || [];
  const ok = checked && placed.every((v, k) => v === k);
  return (
    <>
      <p className="font-serif text-[20px] leading-snug mb-4">{step.q}</p>
      <ol className={`min-h-[120px] rounded-[20px] border-2 border-dashed p-2 flex flex-col gap-2 ${checked ? (ok ? "border-olive bg-mint/50" : "border-plum bg-peach/50") : "border-line-strong"}`}>
        {placed.length === 0 && <li className="text-sm text-ink-soft p-3">Toca los elementos en el orden correcto.</li>}
        {placed.map((idx, k) => (
          <li key={idx}>
            <button
              type="button"
              disabled={checked}
              onClick={() => setAnswer(placed.filter((x) => x !== idx))}
              className={`tap press w-full min-h-12 rounded-[16px] px-3 py-2 flex items-center gap-3 text-left text-[15px] ${checked ? (idx === k ? "bg-mint" : "bg-peach") : "bg-card paper-shadow"}`}
            >
              <span className="w-7 h-7 rounded-full bg-ink text-ground font-mono text-xs font-semibold flex items-center justify-center shrink-0">{k + 1}</span>
              {step.items[idx]}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2 mt-4">
        {pool
          .filter((idx) => !placed.includes(idx))
          .map((idx) => (
            <button
              key={idx}
              type="button"
              disabled={checked}
              onClick={() => setAnswer([...placed, idx])}
              className="tap press min-h-12 px-4 rounded-full border-2 border-line bg-card hover:border-ink/40 text-[15px] font-medium"
            >
              {step.items[idx]}
            </button>
          ))}
      </div>
      {checked && !ok && (
        <div className="mt-4 rounded-[16px] bg-card paper-shadow p-3">
          <p className="label text-ink-soft">Orden correcto</p>
          <ol className="mt-1 text-[15px] list-decimal pl-5">
            {step.items.map((it, k) => (
              <li key={k}>{it}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

/* ---------- Lección ---------- */

const isCorrect = (step, answer) => {
  if (step.t === "test" || step.t === "hueco") return answer === step.a;
  if (step.t === "vf") return answer === step.a;
  if (step.t === "orden") return Array.isArray(answer) && answer.length === step.items.length && answer.every((v, k) => v === k);
  return true;
};
const hasAnswer = (step, answer) => (step.t === "orden" ? (answer || []).length === step.items.length : answer !== null && answer !== undefined);

export default function LessonPlayer({ tema, index, color = PAL.sky, onExit, onFinish }) {
  const lesson = tema.lecciones[index];
  const [queue, setQueue] = useState(() => lesson.pasos.map((step, k) => ({ step, k, retry: 0 })));
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [pairsDone, setPairsDone] = useState(null); // null | { clean }
  const [confirmExit, setConfirmExit] = useState(false);
  const [streak, setStreak] = useState(0);
  const firstTry = useRef(new Map()); // paso original → acertado a la primera
  const scrollRef = useRef(null);
  const item = queue[pos];
  const step = item.step;
  const interactiveTotal = lesson.pasos.filter(isInteractive).length;
  const right = checked && (step.t === "pares" ? pairsDone?.clean : isCorrect(step, answer));
  const optionOrder = useMemo(() => (step.t === "test" ? shuffle(step.o.map((_, i) => i)) : step.t === "hueco" ? shuffle(step.o.map((_, i) => i)) : []), [item]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pos]);

  const finish = () => {
    const first = [...firstTry.current.values()].filter(Boolean).length;
    onFinish({ temaId: tema.id, index, totalLessons: tema.lecciones.length, interactive: interactiveTotal, firstTry: first, title: lesson.titulo });
  };

  const advance = (wasRight) => {
    let next = queue;
    if (isInteractive(step) && !wasRight && item.retry < 2) {
      // Lo fallado vuelve al final de la lección.
      next = [...queue, { ...item, retry: item.retry + 1 }];
      setQueue(next);
    }
    if (pos + 1 >= next.length) {
      finish();
      return;
    }
    setPos(pos + 1);
    setAnswer(null);
    setChecked(false);
    setPairsDone(null);
  };

  const check = () => {
    if (step.t === "teoria") return advance(true);
    if (checked) return advance(right);
    if (!hasAnswer(step, answer)) return;
    const ok = isCorrect(step, answer);
    if (!firstTry.current.has(item.k)) firstTry.current.set(item.k, ok);
    setChecked(true);
    setStreak((s) => (ok ? s + 1 : 0));
    play(ok ? "correct" : "wrong");
    try {
      navigator.vibrate?.(ok ? 12 : [30, 60, 30]);
    } catch (e) {
      /* sin vibración */
    }
  };

  const onPairsDone = (clean) => {
    if (!firstTry.current.has(item.k)) firstTry.current.set(item.k, clean);
    setPairsDone({ clean });
    setChecked(true);
    setStreak((s) => (clean ? s + 1 : 0));
    if (clean) play("correct");
  };

  // Teclado (escritorio): números o letras para elegir, Enter para comprobar/continuar.
  const keyState = useRef();
  keyState.current = { step, checked, answer, optionOrder, check };
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return; // hoja de «¿Salir?» abierta
      const { step: st, checked: ch, optionOrder: ord, check: doCheck } = keyState.current;
      if (e.key === "Enter") {
        e.preventDefault(); // Intro siempre comprueba/continúa (no vuelve a pulsar la opción enfocada)
        doCheck();
        return;
      }
      if (ch) return;
      const k = e.key.toLowerCase();
      if (st.t === "vf") {
        if (k === "v" || k === "1") setAnswer(true);
        if (k === "f" || k === "2") setAnswer(false);
        return;
      }
      if (st.t === "test" || st.t === "hueco") {
        const n = /^[1-6]$/.test(k) ? Number(k) - 1 : "abcdef".indexOf(k);
        if (n >= 0 && n < ord.length) setAnswer(ord[n]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const done = pos / queue.length;
  const canCheck = step.t === "teoria" || checked || hasAnswer(step, answer);
  const feedbackText = step.t === "pares" ? (pairsDone?.clean ? "¡Todas a la primera!" : "Hecho. La repetiremos al final para afianzarla.") : step.e;

  return (
    <div className="fixed inset-0 z-[45] flex flex-col bg-ground">
      <div className="pt-safe px-4 pb-3">
        <div className="max-w-md lg:max-w-2xl mx-auto flex items-center gap-3">
          <IconButton label="Salir de la lección" onClick={() => setConfirmExit(true)} className="bg-card paper-shadow">
            <X size={22} weight="bold" />
          </IconButton>
          <div className="flex-1">
            <ProgressBar pct={done * 100} color={PAL.olive} track="bg-ground-2" className="h-3.5" label="Progreso de la lección" />
          </div>
          {streak >= 3 && (
            <span key={streak} className="anim-pop font-mono text-sm font-semibold rounded-full px-3 h-8 flex items-center bg-sun" aria-label={`${streak} seguidas`}>
              ×{streak}
            </span>
          )}
        </div>
        <p className="max-w-md lg:max-w-2xl mx-auto mt-2 text-sm text-ink-soft truncate">
          {tema.numero && <span className="font-semibold text-ink">Tema {tema.numero} · </span>}
          {lesson.titulo}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 scroll-area px-4 pt-2 pb-6">
        <div key={pos} className="max-w-md lg:max-w-2xl mx-auto anim-q-next">
          <div className="mb-3 flex items-end gap-2">
            <span className="w-12 shrink-0" aria-hidden="true">
              <Mascot name="tacita" fit face={step.t === "teoria" ? "happy" : item.retry > 0 ? "meh" : "open"} look={[0.8, 0.5]} className="w-full h-auto" />
            </span>
            <p className="mb-2 rounded-[14px] rounded-bl-none bg-card paper-shadow px-3 py-1.5 font-bold text-[15px]" style={{ boxShadow: `inset 0 -3px 0 ${color}` }}>
              {item.retry > 0 ? "Otra vez, que se te resistió" : KIND_LABEL[step.t]}
            </p>
          </div>
          {step.t === "teoria" && <Theory step={step} />}
          {(step.t === "test" || step.t === "hueco") && <Choice step={step} answer={answer} setAnswer={setAnswer} checked={checked} order={optionOrder} />}
          {step.t === "vf" && <TrueFalse step={step} answer={answer} setAnswer={setAnswer} checked={checked} />}
          {step.t === "pares" && <Pairs step={step} onDone={onPairsDone} />}
          {step.t === "orden" && <Order step={step} answer={answer} setAnswer={setAnswer} checked={checked} />}
        </div>
      </div>

      <div className={`px-4 pt-4 pb-safe transition-colors duration-200 ${checked ? (right ? "bg-mint" : "bg-peach") : "bg-ground border-t border-line"}`}>
        <div className="max-w-md lg:max-w-2xl mx-auto">
          {checked && (
            <div className="mb-3 anim-pop flex gap-3 items-start" aria-live="polite">
              <span className="w-16 shrink-0 -mt-1 anim-hop" aria-hidden="true">
                <Mascot name="tacita" fit face={right ? (streak >= 3 ? "happy" : "wink") : "meh"} className="w-full h-auto" />
              </span>
              <div className="min-w-0">
              <p className={`display text-[26px] flex items-center gap-2 ${right ? "text-olive" : "text-plum"}`}>
                {right ? <CheckCircle size={28} weight="fill" /> : <ArrowCounterClockwise size={26} weight="bold" />}
                {right ? (streak >= 3 ? `¡${streak} seguidas!` : ["¡Bien!", "¡Correcto!", "¡Eso es!", "¡Perfecto!"][pos % 4]) : "Casi…"}
              </p>
              {!right && (step.t === "test" || step.t === "hueco") && (
                <p className="text-[15px] mt-1">
                  Correcta: <span className="font-semibold">{step.o[step.a]}</span>
                </p>
              )}
              {!right && step.t === "vf" && <p className="text-[15px] mt-1">Es <span className="font-semibold">{step.a ? "verdadero" : "falso"}</span>.</p>}
              {feedbackText && <p className="text-[15px] leading-snug mt-1">{feedbackText}</p>}
              </div>
            </div>
          )}
          {step.t !== "pares" || checked ? (
            <Button variant={checked ? (right ? "green" : "red") : step.t === "teoria" ? "blue" : "yellow"} onClick={check} disabled={!canCheck} className="w-full">
              {step.t === "teoria" ? "Entendido" : checked ? "Continuar" : "Comprobar"}
            </Button>
          ) : (
            <p className="h-14 flex items-center justify-center text-sm text-ink-soft">Toca una de cada columna</p>
          )}
          <p className="hidden lg:block text-center text-xs text-ink-soft mt-2">
            {step.t === "teoria" || checked ? "Intro para continuar" : step.t === "vf" ? "V / F para elegir · Intro para comprobar" : step.t === "test" || step.t === "hueco" ? "1-4 para elegir · Intro para comprobar" : ""}
          </p>
        </div>
      </div>

      <Sheet
        open={confirmExit}
        title="¿Salir de la lección?"
        illustration="abandonar"
        onClose={() => setConfirmExit(false)}
        body="Perderás el progreso de esta lección. Puedes repetirla cuando quieras."
        actions={
          <>
            <Button variant="blue" onClick={() => setConfirmExit(false)}>
              Seguir aprendiendo
            </Button>
            <Button variant="paper" onClick={onExit}>
              Salir
            </Button>
          </>
        }
      />
    </div>
  );
}
