import { useState } from "react";
import { ArrowCounterClockwise, Brain, CaretDown, CaretRight, Play } from "@phosphor-icons/react";
import { BLOCKS } from "../lib/logic.js";
import { learnTemas } from "../lib/bank.js";
import { LEVELS, masteryOf, reviewState, temaMastery } from "../lib/srs.js";
import { unitColor } from "./Learn.jsx";

/** Barra apilada: dominadas, casi, aprendiendo y sin ver. */
export function MasteryBar({ m, className = "h-3" }) {
  const seg = [...LEVELS].reverse(); // dominada a la izquierda
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-ground-2 ${className}`} role="img" aria-label={`${m.dominada} dominadas, ${m.casi} casi, ${m.aprendiendo} aprendiendo y ${m.nueva} sin ver`}>
      {seg.map((l) =>
        m[l.id] ? <span key={l.id} style={{ width: `${(m[l.id] / m.total) * 100}%`, background: l.id === "nueva" ? "transparent" : l.color }} /> : null
      )}
    </div>
  );
}

function Legend({ m }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
      {[...LEVELS].reverse().map((l) => (
        <li key={l.id} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-line" style={{ background: l.id === "nueva" ? "transparent" : l.color }} aria-hidden="true" />
          {l.label} <span className="font-mono text-ink">{m[l.id]}</span>
        </li>
      ))}
    </ul>
  );
}

/** Mapa de dominio: cuánto tienes memorizado de cada tema y de cada lección. */
export default function Mastery({ bank, store, onReview, onTemaReview, onStartLesson }) {
  const [open, setOpen] = useState(null);
  const temas = learnTemas(bank);
  const all = masteryOf((bank?.preguntas || []).filter((q) => q.tema !== "casos"), store.srs);
  const { due, fresh } = reviewState(bank, store);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-[48px]">Dominio</h1>
        <p className="text-[15px] text-ink-soft mt-2">
          Cada pregunta que ves vuelve a salir a los 1, 3, 7, 15, 30 y 60 días. Si la aciertas se espacia; si la fallas, vuelve mañana. A partir de los 15 días seguidos sin fallarla, la das por dominada.
        </p>
      </header>

      <section className="rounded-folder bg-card paper-shadow p-5" aria-labelledby="dom-total">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label text-ink-soft whitespace-nowrap">Todo el temario</p>
            <h2 id="dom-total" className="brand text-[56px] leading-none mt-1">
              {all.pct}%
            </h2>
          </div>
          <p className="text-sm text-ink-soft text-right">
            <span className="font-mono text-ink">{all.dominada}</span> de {all.total} preguntas dominadas
          </p>
        </div>
        <MasteryBar m={all} className="h-4 mt-4" />
        <div className="mt-3">
          <Legend m={all} />
        </div>
        <button
          type="button"
          onClick={onReview}
          disabled={!due.length && !fresh.length}
          className="tap press mt-5 w-full min-h-14 py-2 px-5 rounded-full bg-ink text-ground font-semibold flex items-center justify-center gap-2 text-center leading-tight disabled:opacity-40"
        >
          <ArrowCounterClockwise size={20} weight="bold" className="shrink-0" />
          {due.length ? `Repaso del día · ${due.length} pendientes` : fresh.length ? "Repaso del día · preguntas nuevas" : "Nada que repasar hoy"}
        </button>
        {!due.length && !fresh.length && <p className="text-xs text-ink-soft text-center mt-2">Haz alguna lección o un test y sus preguntas entrarán en el repaso.</p>}
      </section>

      {["comun", "especifico"].map((b) => (
        <section key={b} aria-labelledby={`dom-${b}`}>
          <h2 id={`dom-${b}`} className="display text-[28px] mb-3 flex items-center gap-2">
            <span className="w-4 h-4 blob" style={{ background: BLOCKS[b].hex }} aria-hidden="true" />
            {BLOCKS[b].label}
          </h2>
          <ul className="flex flex-col gap-2">
            {temas
              .filter((t) => t.bloque === b)
              .map((t) => {
                const m = temaMastery(bank, store, t);
                const isOpen = open === t.id;
                return (
                  <li key={t.id} className="rounded-folder bg-card paper-shadow">
                    <button type="button" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen} className="tap w-full text-left px-3 py-3 flex items-center gap-3">
                      <span className="w-11 h-11 blob flex items-center justify-center shrink-0 font-mono text-sm font-semibold" style={{ background: unitColor(bank, t.id) }}>
                        {t.numero}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold leading-tight line-clamp-2">{t.titulo}</span>
                          <span className="font-mono text-sm shrink-0">{m.pct}%</span>
                        </span>
                        <MasteryBar m={m} className="h-2 mt-2" />
                      </span>
                      {isOpen ? <CaretDown size={18} weight="bold" className="text-ink-soft shrink-0" /> : <CaretRight size={18} weight="bold" className="text-ink-soft shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 flex flex-col gap-3 anim-rise">
                        <Legend m={m} />
                        <button type="button" onClick={() => onTemaReview(t.id)} className="tap press h-12 rounded-full bg-ink text-ground text-sm font-semibold flex items-center justify-center gap-2">
                          <Brain size={18} weight="bold" /> Repasar este tema (lo más flojo primero)
                        </button>
                        <ul className="flex flex-col gap-1">
                          {m.parts
                            .filter((p) => p.total)
                            .map((p) => (
                              <li key={p.index} className="flex items-center gap-2 rounded-[12px] bg-ground px-3 py-2">
                                <span className="flex-1 min-w-0">
                                  <span className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="truncate">{p.index + 1}. {p.titulo}</span>
                                    <span className="font-mono text-xs shrink-0">{p.pct}%</span>
                                  </span>
                                  <MasteryBar m={p} className="h-1.5 mt-1.5" />
                                </span>
                                <button type="button" onClick={() => onStartLesson(t.id, p.index)} aria-label={`Practicar la lección ${p.titulo}`} className="tap press w-9 h-9 rounded-full bg-card flex items-center justify-center shrink-0">
                                  <Play size={16} weight="fill" />
                                </button>
                              </li>
                            ))}
                          {m.others.total > 0 && (
                            <li className="rounded-[12px] bg-ground px-3 py-2">
                              <span className="flex items-baseline justify-between gap-2 text-sm">
                                <span>Tests de la academia y exámenes reales</span>
                                <span className="font-mono text-xs">{m.others.pct}%</span>
                              </span>
                              <MasteryBar m={m.others} className="h-1.5 mt-1.5" />
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
