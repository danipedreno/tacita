import { useEffect, useState } from "react";
import { CaretLeft, CaretRight, Lightbulb, SignOut } from "@phosphor-icons/react";
import { BLOCKS } from "../lib/logic.js";
import { bankCards, bankQuestions, learnTemas, temaById } from "../lib/bank.js";
import { unitDoneCount } from "../lib/tutor.js";
import { Button, Folder, Paper, Segmented, Sheet } from "../ui.jsx";
import { Esquemas, ReaderBar, TextoCompleto } from "./FullNotes.jsx";
import { useReader } from "../lib/speech.js";
import { hasPodcast } from "../lib/podcast.js";
import { EpisodeList } from "./Podcast.jsx";
import { Rich } from "./Lesson.jsx";
import { unitColor } from "./Learn.jsx";

/** Apuntes de un tema: toda la teoría de sus lecciones seguida, más sus tarjetas. Para releer antes del examen. */
function TemaNotes({ bank, tema, onBack, onStartLesson }) {
  const color = unitColor(bank, tema.id);
  const cards = bankCards(bank, "all", tema.id);
  const docs = bank.docs?.temas?.[tema.id];
  const nEsq = docs?.esquemas?.reduce((a, e) => a + e.imgs.length, 0) || 0;
  const pod = hasPodcast(bank, tema.id);
  const [view, setView] = useState("resumen");
  // Modo escuchar del resumen: la teoría de cada lección, en orden.
  const theory = tema.lecciones.flatMap((l, i) => l.pasos.filter((p) => p.t === "teoria").map((p, k) => ({ id: `rd-${i}-${k}`, text: [l.titulo + ". " + p.titulo + ".", p.texto, ...(p.puntos || []), p.truco ? "Truco: " + p.truco : ""].join(" ") })));
  const reader = useReader(theory);
  const reading = reader.index >= 0 ? theory[reader.index]?.id : null;
  useEffect(() => {
    document.querySelector("main")?.scrollTo?.({ top: 0 });
  }, [tema.id]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <button type="button" onClick={onBack} className="tap press mb-3 h-11 pl-3 pr-4 rounded-full bg-card paper-shadow text-ink flex items-center gap-1 text-sm font-semibold">
          <CaretLeft size={18} weight="bold" /> Apuntes
        </button>
        <p className="label text-ink-soft">Tema {tema.numero}</p>
        <h1 className="display text-[40px] mt-1">{tema.titulo}</h1>
        <p className="text-[15px] text-ink-soft mt-2">{tema.intro}</p>
      </header>
      {docs && (
        <Segmented
          label="Qué quieres leer"
          hideLabel
          value={view}
          onChange={setView}
          options={[
            { value: "resumen", label: "Resumen", sub: `${tema.lecciones.length} lecciones` },
            { value: "esquemas", label: "Esquemas", sub: nEsq ? `${nEsq} imágenes` : "—" },
            { value: "completo", label: "Temario", sub: "completo" },
            ...(pod ? [{ value: "escuchar", label: "Escuchar", sub: "pódcast" }] : []),
          ]}
        />
      )}
      {view === "esquemas" && <Esquemas bank={bank} esquemas={docs?.esquemas} />}
      {view === "completo" && <TextoCompleto bank={bank} textos={docs?.textos} />}
      {view === "escuchar" && <EpisodeList bank={bank} temaId={tema.id} color={color} />}
      {view === "resumen" && !pod && <ReaderBar reader={reader} total={theory.length} idOf={(k) => theory[k]?.id} />}
      {view === "resumen" && tema.lecciones.map((l, i) => (
        <Folder key={i} color={color} tab={`Lección ${i + 1}`}>
          <div className="p-2.5 flex flex-col gap-2.5">
            <div className="px-2.5 pt-2 flex items-center justify-between gap-3">
              <h2 className="display text-[24px]">{l.titulo}</h2>
              <button type="button" onClick={() => onStartLesson(tema.id, i)} className="tap press shrink-0 h-10 px-4 rounded-full bg-ink text-ground text-sm font-semibold">
                Practicar
              </button>
            </div>
            {l.pasos
              .filter((p) => p.t === "teoria")
              .map((p, k) => (
                <Paper key={k} id={`rd-${i}-${k}`} className={`p-4 lg:p-5 scroll-mt-20 transition-shadow ${reading === `rd-${i}-${k}` ? "ring-4 ring-sun" : ""}`}>
                  <h3 className="font-semibold text-lg leading-tight">{p.titulo}</h3>
                  <Rich text={p.texto} className="font-serif text-[17px] leading-relaxed mt-2" />
                  {p.puntos?.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 font-serif text-[16px] leading-snug">
                      {p.puntos.map((x, j) => (
                        <li key={j}>
                          <Rich text={x} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.truco && (
                    <div className="mt-3 rounded-xl bg-sun px-3 py-2 text-[15px] flex gap-2">
                      <Lightbulb size={20} weight="fill" className="shrink-0 mt-0.5" />
                      <Rich text={p.truco} />
                    </div>
                  )}
                </Paper>
              ))}
          </div>
        </Folder>
      ))}
      {view === "resumen" && cards.length > 0 && (
        <section aria-labelledby="claves-title">
          <h2 id="claves-title" className="display text-[30px] mb-3">
            Datos clave del tema
          </h2>
          <dl className="rounded-folder bg-card paper-shadow divide-y divide-line">
            {cards.map((c) => (
              <div key={c.id} className="px-4 py-3 lg:grid lg:grid-cols-[2fr_3fr] lg:gap-4">
                <dt className="font-semibold">{c.front}</dt>
                <dd className="text-ink-soft mt-0.5 lg:mt-0">{c.back}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

/** Pestaña Apuntes: índice de temas y lectura de su teoría. */
export default function Temario({ bank, store, temaId, onOpen, onBack, onStartLesson, onLogout }) {
  const [confirm, setConfirm] = useState(false);
  const tema = temaId ? temaById(bank, temaId) : null;
  if (tema) return <TemaNotes bank={bank} tema={tema} onBack={() => onOpen(null)} onStartLesson={onStartLesson} />;

  const temas = learnTemas(bank);
  return (
    <div className="flex flex-col gap-6">
      <header>
        {onBack && (
          <button type="button" onClick={onBack} className="tap press mb-3 h-11 pl-3 pr-4 rounded-full bg-card paper-shadow text-ink flex items-center gap-1 text-sm font-semibold">
            <CaretLeft size={18} weight="bold" /> Inicio
          </button>
        )}
        <h1 className="display text-[48px]">Apuntes</h1>
        <p className="text-[15px] text-ink-soft mt-2">Cada tema con su resumen, los esquemas de la academia y el temario completo con buscador.</p>
      </header>
      {["comun", "especifico"].map((b) => (
        <section key={b} aria-labelledby={`ap-${b}`}>
          <h2 id={`ap-${b}`} className="display text-[28px] mb-3 flex items-center gap-2">
            <span className="w-4 h-4 blob" style={{ background: BLOCKS[b].hex }} aria-hidden="true" />
            {BLOCKS[b].label}
          </h2>
          <ul className="grid lg:grid-cols-2 gap-2">
            {temas
              .filter((t) => t.bloque === b)
              .map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => onOpen(t.id)} className="tap press w-full text-left flex items-center gap-3 rounded-folder bg-card paper-shadow px-3 py-3 h-full">
                    <span className="w-11 h-11 blob flex items-center justify-center shrink-0 font-mono text-sm font-semibold" style={{ background: unitColor(bank, t.id) }}>
                      {t.numero}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold leading-tight">{t.titulo}</span>
                      <span className="block text-xs text-ink-soft mt-0.5">
                        {unitDoneCount(t, store)}/{t.lecciones.length} lecciones · {bankQuestions(bank, "all", t.id).length} preguntas
                      </span>
                    </span>
                    <CaretRight size={18} weight="bold" className="text-ink-soft shrink-0" />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <div className="border-t border-line pt-5 flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          Temario actualizado el {new Date(bank.generado).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}: {temas.length} temas ·{" "}
          {temas.reduce((a, t) => a + t.lecciones.length, 0)} lecciones · {bank.preguntas.length} preguntas · {bank.flashcards.length} tarjetas. Material de Clases de Ángel, solo para uso personal.
        </p>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          <SignOut size={20} weight="bold" /> Cerrar sesión
        </Button>
      </div>
      <Sheet
        open={confirm}
        title="¿Cerrar sesión?"
        onClose={() => setConfirm(false)}
        body="Se borra el temario de este dispositivo (tu progreso se queda). Para volver a entrar necesitarás el usuario y la contraseña."
        actions={
          <>
            <Button
              variant="red"
              onClick={() => {
                setConfirm(false);
                onLogout();
              }}
            >
              Cerrar sesión
            </Button>
            <Button variant="paper" onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
          </>
        }
      />
    </div>
  );
}
