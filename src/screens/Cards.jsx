import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cards as CardsIcon, Fire, X } from "@phosphor-icons/react";
import { BLOCKS, BLOCK_IDS, COMBO_BONUS, COMBO_STEP, MASTERED_BOX, XP_PER_CARD, cardPiles, cardsForSession, dateKey, lessonKey, shuffle } from "../lib/logic.js";
import { bankCards, temaLabel, temasOf } from "../lib/bank.js";
import { studiedTemas } from "../lib/tutor.js";
import { Button, ChoiceTile, Folder, IconButton, ArtIcon, Illustration, Paper, Picker } from "../ui.jsx";
import { useReducedMotion } from "../lib/motion.js";
import { play } from "../lib/sound.js";
import { PAL } from "../lib/palette.js";
import { Cajon } from "../cajon.jsx";

/**
 * Deslizar la tarjeta (a la manera de las apps de citas, con criterios de Emil Kowalski):
 * - el transform se escribe directamente en el nodo mientras arrastras (sin renders de React);
 * - basta un gesto rápido (velocidad > 0,11 px/ms), no hace falta llegar al umbral;
 * - al soltar sin decidir vuelve a su sitio en 200 ms ease-out; al decidir sale volando.
 * Solo se activa con la respuesta a la vista; un toque sin arrastre sigue girando la tarjeta.
 */
/* Mazo: las tarjetas que quedan asoman por debajo, escalonadas (k = 1, 2), con el color de su bloque. */
const DECK_PEEK = 14;
const deckGhost = (k, lift = 0) => {
  const d = Math.max(0, k - lift);
  return `translateY(${d * DECK_PEEK}px) scale(${1 - d * 0.05})`;
};

function useSwipe({ enabled, onSwipe, reduce }) {
  const ref = useRef(null);
  const under = useRef(null); // la tarjeta de debajo del mazo: sube mientras arrastras
  const yes = useRef(null);
  const no = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);

  const paint = (dx, animate) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = animate ? "transform 200ms var(--ease-out)" : "none";
    el.style.transform = dx ? `translateX(${dx}px) rotate(${reduce ? 0 : dx / 18}deg)` : "";
    const p = Math.min(1, Math.abs(dx) / 110);
    if (under.current) {
      under.current.style.transition = animate ? "transform 200ms var(--ease-out)" : "none";
      under.current.style.transform = dx ? deckGhost(1, p) : "";
    }
    if (yes.current) yes.current.style.opacity = dx > 0 ? p : 0;
    if (no.current) no.current.style.opacity = dx < 0 ? p : 0;
  };

  const handlers = {
    onPointerDown: (e) => {
      if (!enabled || drag.current) return; // un solo dedo
      drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      moved.current = false;
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!moved.current) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          drag.current = null; // gesto vertical: es scroll
          return;
        }
        moved.current = true;
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch (err) {
          /* el puntero ya se soltó */
        }
      }
      paint(dx, false);
    },
    onPointerUp: (e) => {
      const d = drag.current;
      drag.current = null;
      if (!d || !moved.current) return;
      const dx = e.clientX - d.x;
      const velocity = Math.abs(dx) / (performance.now() - d.t);
      if (Math.abs(dx) > 110 || (velocity > 0.11 && Math.abs(dx) > 30)) {
        const dir = dx > 0 ? 1 : -1;
        const el = ref.current;
        el.style.transition = "transform 220ms var(--ease-out), opacity 220ms var(--ease-out)";
        el.style.transform = `translateX(${dir * window.innerWidth}px) rotate(${reduce ? 0 : dir * 18}deg)`;
        el.style.opacity = "0";
        try {
          navigator.vibrate?.(10);
        } catch (err) {
          /* sin vibración */
        }
        setTimeout(() => onSwipe(dir > 0 ? "good" : "again"), 180);
      } else {
        paint(0, true);
      }
    },
    onPointerCancel: () => {
      drag.current = null;
      paint(0, true);
    },
    // Si hubo arrastre, el «click» final no debe girar la tarjeta.
    onClickCapture: (e) => {
      if (moved.current) {
        e.stopPropagation();
        e.preventDefault();
        moved.current = false;
      }
    },
  };
  return { ref, under, yes, no, handlers };
}

/* Calor de la racha: cuanto más seguidas, más fuego (barra, chip y +XP). */
const HEAT = [
  { bar: "#000000", chip: "#ffc828", glow: 0, speed: 0 },
  { bar: "linear-gradient(90deg,#ed91fa,#f7c04a,#ed91fa)", chip: "#ffc828", glow: 0, speed: 2.6 },
  { bar: "linear-gradient(90deg,#ed91fa,#f59b3a,#ef6a2c,#f59b3a,#ed91fa)", chip: "linear-gradient(90deg,#ed91fa,#f59b3a)", glow: 6, speed: 1.8 },
  { bar: "linear-gradient(90deg,#ed91fa,#f59b3a,#e8452a,#c62a2a,#e8452a,#f59b3a,#ed91fa)", chip: "linear-gradient(90deg,#f59b3a,#e8452a)", glow: 10, speed: 1.2 },
  { bar: "linear-gradient(90deg,#ed91fa,#f59b3a,#e8452a,#b0183a,#e8452a,#f59b3a,#ed91fa)", chip: "linear-gradient(90deg,#e8452a,#b0183a)", glow: 16, speed: 0.8 },
];
const heatOf = (combo) => (combo < 2 ? 0 : combo < 5 ? 1 : combo < 10 ? 2 : combo < 15 ? 3 : 4);
const SPARKS = ["#ed91fa", "#f59b3a", "#e8452a", "#ed91fa", "#ef6a2c", "#c62a2a", "#f59b3a", "#ed91fa", "#e8452a", "#f59b3a"];

/** Barra de progreso que se calienta con la racha: degradado que fluye y brillo naranja. */
function FireBar({ pct, heat, flash }) {
  const h = HEAT[heat];
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={`relative h-2.5 rounded-full bg-ground-2 transition-[box-shadow] duration-500 ${flash ? "fire-flash" : ""}`}
      key={flash || "bar"}
      style={{ boxShadow: h.glow ? `0 0 ${h.glow}px ${h.glow / 3}px rgba(239,106,44,${0.25 + heat * 0.08})` : "none" }}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progreso del repaso"
    >
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${heat ? "fire-flow" : ""}`}
          style={{ width: `${v}%`, background: h.bar, backgroundSize: "200% 100%", animationDuration: `${h.speed}s` }}
        />
      </div>
    </div>
  );
}

/** Chip de XP: late con cada ganancia; el «+N» sube más grande y más caliente cuanto mayor es la racha. */
function XpChip({ xp, gain }) {
  const heat = gain?.heat || 0;
  return (
    <span className="relative shrink-0">
      <span
        key={xp}
        className="anim-pop font-mono text-sm font-semibold rounded-full text-ink px-3 h-8 flex items-center"
        style={{ background: heat >= 2 ? HEAT[Math.min(heat, 3)].chip : "#ed91fa", animationDuration: `${250 + heat * 60}ms` }}
        aria-label={`${xp} XP en esta sesión`}
      >
        +{xp} XP
      </span>
      {gain && (
        <span
          key={gain.id}
          aria-hidden="true"
          className="xp-gain absolute right-full mr-2 top-1 font-mono font-bold pointer-events-none whitespace-nowrap"
          style={{ fontSize: `${13 + heat * 3 + (gain.milestone ? 6 : 0)}px`, color: ["#000000", "#b77a00", "#ef6a2c", "#d9302a", "#b0183a"][heat] }}
        >
          +{gain.n}
        </span>
      )}
      {gain?.milestone && (
        <span key={`b${gain.id}`} aria-hidden="true" className="absolute inset-0 pointer-events-none">
          {SPARKS.map((c, k) => {
            const a = (k / SPARKS.length) * Math.PI * 2;
            const r = 34 + (k % 3) * 10;
            return (
              <span
                key={k}
                className="burst-piece spark"
                style={{ background: c, "--dx": `${Math.cos(a) * r}px`, "--dy": `${Math.sin(a) * r}px`, "--rot": `${k * 47}deg` }}
              />
            );
          })}
        </span>
      )}
    </span>
  );
}

function Session({ bank, queue: initial, onExit, onFinish }) {
  const [queue, setQueue] = useState(initial);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Gamificación en vivo: racha de «Lo sé» seguidos y XP acumulado en la sesión.
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [gain, setGain] = useState(null); // último +XP, para la animación que sube
  const live = useRef({ bonus: 0, best: 0 });
  const results = useRef(new Map());
  const requeued = useRef(new Set());
  const card = queue[i];
  const block = BLOCKS[card.block] || BLOCKS.especifico;
  const reduce = useReducedMotion();

  const rate = (rating) => {
    results.current.set(card.id, rating);
    const nextCombo = rating === "good" ? combo + 1 : 0;
    const milestone = nextCombo > 0 && nextCombo % COMBO_STEP === 0;
    live.current = { bonus: live.current.bonus + (milestone ? COMBO_BONUS : 0), best: Math.max(live.current.best, nextCombo) };
    setCombo(nextCombo);
    const earned = XP_PER_CARD[rating] + (milestone ? COMBO_BONUS : 0);
    setXp((v) => v + earned);
    setGain({ n: earned, id: performance.now(), milestone, heat: heatOf(nextCombo) });
    if (rating === "good") play(milestone ? "combo" : "card");
    if (milestone) {
      try {
        navigator.vibrate?.(25);
      } catch (e) {
        /* sin vibración */
      }
    }
    let next = queue;
    // «Otra vez» la repite al final de esta misma sesión (una vez).
    if (rating === "again" && !requeued.current.has(card.id)) {
      requeued.current.add(card.id);
      next = [...queue, card];
      setQueue(next);
    }
    if (i + 1 >= next.length) {
      onFinish([...results.current].map(([id, r]) => ({ id, rating: r })), live.current);
      return;
    }
    setFlipped(false);
    setI(i + 1);
  };
  const swipe = useSwipe({ enabled: flipped, onSwipe: rate, reduce });

  // Teclado (escritorio): espacio o Intro gira; 1 otra vez, 2 difícil, 3 lo sé (o ← →).
  const keys = useRef();
  keys.current = { flipped, rate };
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = keys.current;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (k.flipped && (e.key === "1" || e.key === "ArrowLeft")) k.rate("again");
      else if (k.flipped && e.key === "2") k.rate("hard");
      else if (k.flipped && (e.key === "3" || e.key === "ArrowRight")) k.rate("good");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[45] flex flex-col bg-ground">
      <div className="pt-safe px-4 pb-3 bg-card rounded-b-[28px] paper-shadow">
        <div className="max-w-md lg:max-w-2xl mx-auto flex items-center gap-3">
          <IconButton label="Salir del repaso" onClick={onExit} className="bg-ground">
            <X size={22} weight="bold" />
          </IconButton>
          <div className="flex-1">
            <FireBar pct={(i / queue.length) * 100} heat={heatOf(combo)} flash={gain?.milestone ? gain.id : null} />
            <p className="font-mono text-xs text-ink-soft mt-1.5">
              {i + 1} de {queue.length}
            </p>
          </div>
          <XpChip xp={xp} gain={gain} />
        </div>
        <div className="max-w-md lg:max-w-2xl mx-auto h-8 mt-2 flex items-center" aria-live="polite">
          {combo >= 2 && (
            <span
              key={combo}
              className={`anim-pop inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-sm font-semibold ${heatOf(combo) >= 3 ? "text-white" : "text-ink"}`}
              style={{ background: HEAT[heatOf(combo)].chip }}
            >
              <Fire size={14 + heatOf(combo) * 2} weight="fill" className="anim-flicker" style={{ animationDuration: `${1.9 - heatOf(combo) * 0.3}s` }} /> Racha ×{combo}
              {combo % COMBO_STEP === 0 && <span className="font-mono">· +{COMBO_BONUS} XP</span>}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 scroll-area px-4 pt-5 pb-6">
        <div className="max-w-md lg:max-w-2xl mx-auto relative" style={{ paddingBottom: DECK_PEEK * 2 }}>
          {/* Las siguientes del mazo, asomando por debajo (solo la forma y el color de su bloque) */}
          {[2, 1].map((k) => {
            const nxt = queue[i + k];
            if (!nxt) return null;
            const hex = (BLOCKS[nxt.block] || BLOCKS.especifico).hex;
            return (
              <div
                key={`g${k}-${nxt.id}-${i + k}`}
                ref={k === 1 ? swipe.under : undefined}
                aria-hidden="true"
                className="absolute inset-x-0 top-11 rounded-folder origin-bottom"
                style={{ bottom: DECK_PEEK * 2, background: hex, transform: deckGhost(k), filter: `brightness(${1 - k * 0.06})` }}
              />
            );
          })}
        <div key={`${card.id}-${i}`} className="relative anim-deck-rise">
          <div ref={swipe.ref} {...swipe.handlers} className="relative will-change-transform" style={{ touchAction: "pan-y" }}>
          <span ref={swipe.yes} className="swipe-stamp left-6 text-olive -rotate-12" aria-hidden="true">
            LO SÉ
          </span>
          <span ref={swipe.no} className="swipe-stamp right-6 text-plum rotate-12" aria-hidden="true">
            OTRA VEZ
          </span>
          <Folder color={block.hex} tab={block.short}>
            <div className="p-2.5">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFlipped((f) => !f)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFlipped((f) => !f);
                  }
                }}
                className="flip-card w-full text-left cursor-pointer rounded-folder"
                aria-label={flipped ? "Ver la pregunta" : "Ver la respuesta"}
                data-flipped={flipped}
              >
                <div className="flip-inner">
                  <Paper className="flip-face p-5 min-h-[260px] flex flex-col">
                    <p className="label text-ink-soft">{temaLabel(bank, card.tema)}</p>
                    <p className="font-serif text-[23px] leading-snug mt-4 flex-1" style={{ textWrap: "pretty" }}>
                      {card.front}
                    </p>
                    <p className="label text-ink-soft mt-4">Toca para ver la respuesta</p>
                  </Paper>
                  <Paper className="flip-face flip-back p-5 min-h-[260px] flex flex-col" aria-hidden={!flipped}>
                    <p className="label text-ink-soft">Respuesta</p>
                    <p className="font-serif text-[21px] leading-snug mt-4" style={{ textWrap: "pretty" }}>
                      {card.back}
                    </p>
                    {card.cita && <p className="text-sm text-ink-soft mt-auto pt-4 leading-snug">Del temario: «{card.cita}»</p>}
                  </Paper>
                </div>
              </div>
            </div>
          </Folder>
          </div>
        </div>
        </div>
        <p className="text-center font-mono text-xs text-ink-soft mt-3" aria-live="off">
          {queue.length - i - 1 > 0 ? `Quedan ${queue.length - i - 1} en el mazo` : "Última tarjeta"}
        </p>
      </div>

      <div className="px-4 pt-3 pb-safe bg-ground">
        <div className="max-w-md lg:max-w-2xl mx-auto">
          {flipped ? (
            <div className="grid grid-cols-3 gap-2">
              <Button variant="red" onClick={() => rate("again")} className="px-2 whitespace-nowrap">
                Otra vez
              </Button>
              <Button variant="paper" onClick={() => rate("hard")} className="px-2">
                Difícil
              </Button>
              <Button variant="green" onClick={() => rate("good")} className="px-2 whitespace-nowrap">
                Lo sé
              </Button>
              <p className="col-span-3 text-center text-xs text-ink-soft -mb-1">
                <span className="lg:hidden">También puedes deslizar: → lo sé · ← otra vez</span>
                <span className="hidden lg:inline">Teclado: 1 otra vez · 2 difícil · 3 lo sé</span>
              </p>
            </div>
          ) : (
            <Button variant="blue" onClick={() => setFlipped(true)} className="w-full">
              Mostrar respuesta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Caja de tarjetas («Las sé» / «No las sé») con su ilustración, contador y botón de repaso. */
function Pile({ title, tone, cards, onReview }) {
  return (
    <div className="rounded-[22px] p-3 flex flex-col gap-3 min-w-0 bg-card border-2 border-line">
      <Cajon tone={tone} className="w-full max-w-[150px] h-auto mx-auto mt-1" />
      <div className="flex items-end gap-2 px-1">
        <span className="font-semibold text-[17px] leading-tight flex-1 min-w-0">{title}</span>
        <span className="brand text-[34px] leading-none">{cards.length}</span>
      </div>
      <button
        type="button"
        onClick={onReview}
        disabled={!cards.length}
        className="tap press h-11 rounded-full bg-ink text-ground text-sm font-semibold disabled:opacity-40"
      >
        Repasar
      </button>
    </div>
  );
}

export default function CardsScreen({ store, bank, onFinish, autoStart, onAutoStarted }) {
  const [block, setBlock] = useState("all");
  const [tema, setTema] = useState("all");
  const studied = useMemo(() => studiedTemas(bank, store), [bank, store]);
  // Por defecto, las tarjetas nuevas salen solo de los temas que ya has empezado en «Aprende».
  const [onlyStudied, setOnlyStudied] = useState(true);
  const [session, setSession] = useState(null);
  const today = dateKey();
  const state = store.cards;

  // Las tarjetas sacadas de una lección salen cuando ya has hecho esa lección (o si ya las has repasado).
  const doneLessons = useMemo(() => {
    const set = new Set();
    for (const t of bank?.temas || []) (t.lecciones || []).forEach((l, i) => store.lessons?.[lessonKey(t.id, i)]?.done && set.add(`${t.id}|${l.titulo}`));
    return set;
  }, [bank, store.lessons]);
  const allCards = useMemo(() => bankCards(bank, block, tema).filter((c) => !c.lesson || doneLessons.has(`${c.tema}|${c.lesson}`) || store.cards[c.id]), [bank, block, tema, doneLessons, store.cards]);
  const filterStudied = onlyStudied && tema === "all" && studied.size > 0;
  const cards = useMemo(() => (filterStudied ? allCards.filter((c) => studied.has(c.tema) || state[c.id]) : allCards), [allCards, filterStudied, studied, state]);
  const counts = useMemo(() => {
    let due = 0;
    let fresh = 0;
    let mastered = 0;
    for (const c of cards) {
      const s = state[c.id];
      if (!s) fresh++;
      else {
        if (s.due <= today) due++;
        if (s.box >= MASTERED_BOX) mastered++;
      }
    }
    return { due, fresh, mastered };
  }, [cards, state, today]);
  const queue = useMemo(() => cardsForSession(cards, state, today), [cards, state, today]);
  const piles = useMemo(() => cardPiles(cards, state), [cards, state]);
  const startPile = (list) => setSession(shuffle(list).slice(0, 20));
  // Desde el tutor: empieza directamente el repaso de hoy.
  useEffect(() => {
    if (autoStart && queue.length) setSession(queue);
    if (autoStart) onAutoStarted?.();
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session) {
    // Portal a <body>: el contenedor de la pantalla está animado con transform y rompería el position: fixed.
    return createPortal(
      <Session
        bank={bank}
        queue={session}
        onExit={() => setSession(null)}
        onFinish={(results, live) => {
          setSession(null);
          onFinish(results, live);
        }}
      />,
      document.body
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[48px]">Tarjetas</h1>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Para hoy", value: counts.due },
          { label: "Nuevas", value: counts.fresh },
          { label: "Dominadas", value: counts.mastered },
        ].map((s) => (
          <div key={s.label} className="py-3 rounded-folder bg-card paper-shadow">
            <p className="brand text-[30px] leading-none">{s.value}</p>
            <p className="text-xs text-ink-soft mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="cards-que" className="flex flex-col gap-3">
        <h2 id="cards-que" className="font-semibold text-lg leading-tight">
          ¿Qué quieres repasar?
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5" role="group" aria-labelledby="cards-que">
          <ChoiceTile
            wide
            compact
            title="Todo el temario"
            color={PAL.sun}
            illustration="todo-temario"
            fallback="simulacro"
            selected={block === "all"}
            onClick={() => {
              setBlock("all");
              setTema("all");
            }}
          />
          {BLOCK_IDS.filter((b) => bank.flashcards.some((c) => c.block === b)).map((b) => (
            <ChoiceTile
              key={b}
              compact
              title={BLOCKS[b].label}
              color={BLOCKS[b].hex}
              illustration={BLOCKS[b].illustration}
              fallback={BLOCKS[b].fallback}
              selected={block === b}
              onClick={() => {
                setBlock(b);
                setTema("all");
              }}
            />
          ))}
        </div>
        {block !== "all" && (
          <Picker
            id="cards-tema"
            label={`Tema de ${BLOCKS[block].label}`}
            value={tema}
            onChange={setTema}
            options={[{ value: "all", label: "Todos los temas" }, ...temasOf(bank, block).map((t) => ({ value: t.id, num: t.numero, label: t.titulo }))]}
          />
        )}
        {tema === "all" && studied.size > 0 && (
          <button
            type="button"
            role="switch"
            aria-checked={onlyStudied}
            onClick={() => setOnlyStudied((v) => !v)}
            className="tap press flex items-center justify-between gap-3 h-16 px-4 rounded-folder bg-card paper-shadow"
          >
            <span className="text-left">
              <span className="block font-semibold text-sm">Solo lo que ya he estudiado</span>
              <span className="block text-xs text-ink-soft">{studied.size === 1 ? "Tarjetas del tema que has empezado" : `Tarjetas de los ${studied.size} temas que has empezado`} en «Aprende»</span>
            </span>
            <span className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${onlyStudied ? "bg-olive" : "bg-line-strong"}`} aria-hidden="true">
              <span className={`block w-5 h-5 rounded-full bg-card transition-transform duration-200 ease-out ${onlyStudied ? "translate-x-5" : ""}`} />
            </span>
          </button>
        )}
      </section>

      <div className="rounded-folder bg-peach p-5">
        <div className="flex items-center gap-4">
        {queue.length ? (
          <span className="w-14 h-14 blob bg-card text-ink flex items-center justify-center shrink-0">
            <CardsIcon size={28} weight="fill" />
          </span>
        ) : (
          <span className="w-20 h-20 blob bg-card p-1.5 shrink-0">
            <Illustration name="todo-al-dia" fallback="test-listo" className="w-full" alt="" />
          </span>
        )}
        <div className="min-w-0">
          <p className="display text-[24px] leading-tight">{queue.length ? `${queue.length} tarjetas en esta sesión` : "Todo al día"}</p>
          <p className="text-sm mt-1 leading-snug">
            {queue.length ? "Primero las que te tocan hoy y luego hasta 10 nuevas." : "No te toca ninguna aquí. Prueba otro bloque o vuelve mañana."}
          </p>
        </div>
        </div>
        <Button variant="blue" onClick={() => setSession(queue)} disabled={!queue.length} className="w-full mt-5">
          <CardsIcon size={20} weight="bold" /> Empezar repaso
        </Button>
      </div>

      <section aria-labelledby="cajas-title">
        <h2 id="cajas-title" className="display text-[30px]">Tus cajas</h2>
        <p className="text-sm text-ink-soft mt-1 mb-3">Cada tarjeta va a una caja según tu última respuesta. Repásalas cuando quieras.</p>
        <div className="grid grid-cols-2 gap-3">
          <Pile title="Las sé" tone="known" cards={piles.known} onReview={() => startPile(piles.known)} />
          <Pile title="No las sé" tone="unknown" cards={piles.unknown} onReview={() => startPile(piles.unknown)} />
        </div>
      </section>

      {(store.cardsHistory || []).length > 0 && (
        <section aria-labelledby="repasos-title">
          <h2 id="repasos-title" className="display text-[30px] mb-3">
            Tus repasos
          </h2>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {store.cardsHistory.slice(0, 8).map((h) => (
              <li key={h.id} className="py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {h.known} de {h.n} te las sabías
                  </p>
                  <p className="font-mono text-xs text-ink-soft mt-0.5">
                    {new Date(h.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    {h.bestCombo >= 2 ? ` · mejor racha ×${h.bestCombo}` : ""}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold text-ink">+{h.xp} XP</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-ink-soft">
        Cada tarjeta que te sabes vuelve más tarde: 1, 3, 7, 14 y 30 días. Las que fallas vuelven hoy. Cuentan para tu meta diaria y tu racha.
      </p>

    </div>
  );
}
