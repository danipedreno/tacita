import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, ListBullets, MagnifyingGlass, MagnifyingGlassMinus, MagnifyingGlassPlus, Pause, Play, SpeakerHigh, Stop, X } from "@phosphor-icons/react";
import { canSpeak, useReader } from "../lib/speech.js";
import { loadText, useDocImage } from "../lib/docs.js";
import { Rich } from "./Lesson.jsx";

/**
 * Barra del modo escuchar. `reader` viene de useReader; `idOf(i)` da el id del elemento que se lee,
 * para resaltarlo y llevarlo a la vista.
 */
export function ReaderBar({ reader, total, idOf }) {
  useEffect(() => {
    if (reader.index < 0) return;
    const el = document.getElementById(idOf(reader.index));
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reader.index]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!canSpeak()) return null;
  const active = reader.index >= 0;
  const btn = "tap press w-11 h-11 rounded-full flex items-center justify-center shrink-0";
  if (!active)
    return (
      <button type="button" onClick={() => reader.play(0)} className="tap press h-11 px-4 rounded-full bg-card paper-shadow flex items-center gap-2 text-sm font-semibold self-start">
        <SpeakerHigh size={20} weight="fill" /> Escuchar
      </button>
    );
  return (
    <div className="sticky top-2 z-30 rounded-full bg-ink text-ground p-1.5 flex items-center gap-2 shadow-lg" role="region" aria-label="Lectura en voz alta">
      <button type="button" className={`${btn} bg-sun text-ink`} onClick={reader.playing ? reader.pause : reader.resume} aria-label={reader.playing ? "Pausar" : "Seguir leyendo"}>
        {reader.playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
      </button>
      <button type="button" className={btn} onClick={() => reader.play(reader.index + 1)} aria-label="Siguiente párrafo">
        <CaretRight size={20} weight="bold" />
      </button>
      <span className="flex-1 min-w-0 text-xs font-mono text-center">
        {reader.index + 1} / {total}
      </span>
      <button type="button" className="tap press h-11 px-3 rounded-full text-sm font-semibold" onClick={() => reader.setRate(reader.rate >= 1.5 ? 0.85 : reader.rate >= 1.25 ? 1.5 : reader.rate >= 1 ? 1.25 : 1)} aria-label="Cambiar velocidad">
        {reader.rate}×
      </button>
      <button type="button" className={btn} onClick={reader.stop} aria-label="Dejar de escuchar">
        <Stop size={20} weight="fill" />
      </button>
    </div>
  );
}

/** true cuando el elemento está cerca de verse (para no descargar todas las imágenes de golpe). */
function useNear(ref) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near || !ref.current) return undefined;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setNear(true), { rootMargin: "600px 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near, ref]);
  return near;
}

function DocImage({ bank, img, alt = "", onOpen, className = "" }) {
  const ref = useRef(null);
  const near = useNear(ref);
  const { src, error } = useDocImage(bank, img.f, near);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      disabled={!src}
      className={`tap block w-full overflow-hidden rounded-[14px] bg-ground-2 ${className}`}
      style={{ aspectRatio: `${img.w} / ${img.h}` }}
      aria-label={alt ? `Ampliar: ${alt}` : "Ampliar imagen"}
    >
      {src ? <img src={src} alt={alt} className="w-full h-full object-contain bg-white" /> : <span className="flex h-full items-center justify-center text-xs text-ink-soft">{error ? "No se pudo cargar (¿sin conexión?)" : "Cargando…"}</span>}
    </button>
  );
}

/** Visor a pantalla completa: anterior/siguiente, zoom y cerrar (también con teclado). */
function Viewer({ bank, imgs, index, onIndex, onClose, title }) {
  const [zoom, setZoom] = useState(false);
  const img = imgs[index];
  const { src } = useDocImage(bank, img.f);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < imgs.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, imgs.length, onClose, onIndex]);
  useEffect(() => setZoom(false), [index]);
  const btn = "tap press w-12 h-12 rounded-full bg-card/95 text-ink flex items-center justify-center disabled:opacity-30";
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-navy/95 flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center gap-2 px-3 pt-safe py-2 text-ground">
        <p className="flex-1 min-w-0 text-sm font-semibold truncate pl-1">
          {title} · {index + 1}/{imgs.length}
        </p>
        <button type="button" className={btn} onClick={() => setZoom((z) => !z)} aria-label={zoom ? "Ajustar a la pantalla" : "Ampliar"}>
          {zoom ? <MagnifyingGlassMinus size={22} weight="bold" /> : <MagnifyingGlassPlus size={22} weight="bold" />}
        </button>
        <button type="button" className={btn} onClick={onClose} aria-label="Cerrar">
          <X size={22} weight="bold" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
        <div className={`min-h-full flex items-center justify-center p-2 ${zoom ? "w-[220%] lg:w-[160%]" : "w-full"}`}>
          {src ? <img src={src} alt="" className="w-full h-auto bg-white rounded-lg" /> : <p className="text-ground text-sm">Cargando…</p>}
        </div>
      </div>
      <div className="flex justify-center gap-3 px-3 pb-safe py-3">
        <button type="button" className={btn} disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label="Anterior">
          <CaretLeft size={22} weight="bold" />
        </button>
        <button type="button" className={btn} disabled={index === imgs.length - 1} onClick={() => onIndex(index + 1)} aria-label="Siguiente">
          <CaretRight size={22} weight="bold" />
        </button>
      </div>
    </div>,
    document.body
  );
}

/** Esquemas del tema: las diapositivas e imágenes de la academia, una debajo de otra. */
export function Esquemas({ bank, esquemas }) {
  const [open, setOpen] = useState(null); // { e, i }
  if (!esquemas?.length) return <p className="text-ink-soft">Este tema no trae esquema en el material de la academia.</p>;
  return (
    <div className="flex flex-col gap-6">
      {esquemas.map((e, ei) => (
        <section key={ei} aria-label={e.titulo}>
          <h2 className="display text-[26px] mb-3">
            {e.titulo} <span className="font-mono text-sm text-ink-soft">({e.imgs.length})</span>
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {e.imgs.map((img, i) => (
              <DocImage key={img.f} bank={bank} img={img} alt={`${e.titulo}, ${i + 1}`} onOpen={() => setOpen({ e: ei, i })} className="paper-shadow" />
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-ink-soft">Toca una imagen para verla a pantalla completa y ampliarla.</p>
      {open && <Viewer bank={bank} imgs={esquemas[open.e].imgs} index={open.i} onIndex={(i) => setOpen({ ...open, i })} onClose={() => setOpen(null)} title={esquemas[open.e].titulo} />}
    </div>
  );
}

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plain = (b) => (b.table ? b.table.map((r) => r.filter(Boolean).join(" · ")).join(" — ") : b.t || b.p || b.li || "").replace(/\*\*/g, "");

const isHeader = (head, body) => head.length > 1 && body.length > 0 && head.every((c) => c && c.length < 40 && !/\d{3,}/.test(c));

/**
 * Tabla del temario convertida en fichas (en el móvil una tabla no cabe): cada fila es una ficha con su
 * primer dato en negrita. Una fila de un solo elemento es un rótulo de grupo («Asuntos Sociales»).
 * Con dos columnas, las cabeceras se dicen una vez arriba; con más, cada dato lleva su etiqueta.
 */
function DocTable({ rows }) {
  const [head, ...rest] = rows;
  const withHead = isHeader(head, rest);
  const body = withHead ? rest : rows;
  const twoCols = rows.every((r) => r.filter(Boolean).length <= 2);
  const labels = withHead && !twoCols ? head : [];
  const label = (t) => t && <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{t}</span>;
  return (
    <div className="my-2 flex flex-col gap-2 font-sans">
      {withHead && twoCols && <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft px-1">{head.filter(Boolean).join(" · ")}</p>}
      {body.map((r, i) => {
        if (r.length === 1)
          return (
            <p key={i} className="mt-3 first:mt-0 px-1 font-semibold text-[16px] border-b-2 border-ink pb-1">
              {r[0]}
            </p>
          );
        const [first, ...others] = r;
        const items = others.map((c, j) => ({ label: labels[j + 1], value: c })).filter((x) => x.value);
        return (
          <div key={i} className="rounded-[12px] bg-ground px-3 py-2.5 text-[15px] leading-snug">
            {first ? (
              <p className="font-semibold">
                {label(labels[0])}
                {first}
              </p>
            ) : null}
            {items.map((x, j) => (
              <p key={j} className={`whitespace-pre-line ${first || j ? "mt-1" : ""}`}>
                {label(x.label)}
                {x.value}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Block({ b, id, bank, onImage }) {
  if (b.h) {
    const cls = b.h === 2 ? "display text-[24px] mt-6" : b.h === 3 ? "font-semibold text-[19px] mt-4" : "font-semibold text-[17px] mt-3";
    return (
      <h3 className={`${cls} leading-tight scroll-mt-4`}>
        {b.t}
      </h3>
    );
  }
  if (b.img) return <DocImage bank={bank} img={b.img} onOpen={() => onImage(b.img)} className="my-2" />;
  if (b.table) return <DocTable rows={b.table} />;
  if (b.li)
    return (
      <div className="flex gap-2 pl-1">
        <span className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-ink shrink-0" aria-hidden="true" />
        <Rich text={b.li} className="flex-1 min-w-0" />
      </div>
    );
  return <Rich text={b.p} />;
}

/** Temario completo de la academia, con índice y buscador. */
export function TextoCompleto({ bank, textos }) {
  const [sel, setSel] = useState(0);
  const [blocks, setBlocks] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [indexOpen, setIndexOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const doc = textos?.[sel];

  useEffect(() => {
    if (!doc) return undefined;
    let alive = true;
    setBlocks(null);
    setError(false);
    loadText(bank, doc.f)
      .then((b) => alive && setBlocks(b))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [bank, doc]);

  const query = fold(q.trim());
  const results = useMemo(() => {
    if (!blocks || query.length < 3) return null;
    let heading = null;
    const out = [];
    blocks.forEach((b) => {
      if (b.h) heading = b.t;
      if (!b.img && fold(plain(b)).includes(query)) out.push({ b, heading });
    });
    return out;
  }, [blocks, query]);
  const imgs = useMemo(() => (blocks || []).filter((b) => b.img).map((b) => b.img), [blocks]);
  // Modo escuchar: se leen títulos, párrafos, puntos y filas de tablas (no las imágenes).
  const readable = useMemo(() => (blocks || []).map((b, i) => ({ i, text: plain(b) })).filter((x) => x.text), [blocks]);
  const reader = useReader(readable);
  const readingBlock = reader.index >= 0 ? readable[reader.index]?.i : -1;
  const headings = useMemo(() => (blocks || []).map((b, i) => ({ b, i })).filter(({ b }) => b.h && b.h <= 3), [blocks]);

  if (!textos?.length) return <p className="text-ink-soft">No hay texto completo para este tema.</p>;

  const goto = (i) => {
    setIndexOpen(false);
    setQ("");
    requestAnimationFrame(() => document.getElementById(`blk-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="flex flex-col gap-4">
      {textos.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Documento">
          {textos.map((t, i) => (
            <button
              key={t.f}
              type="button"
              aria-pressed={i === sel}
              onClick={() => {
                setSel(i);
                setQ("");
              }}
              className={`tap press min-h-11 px-4 py-2 rounded-full text-sm font-semibold text-left ${i === sel ? "bg-ink text-ground" : "bg-card paper-shadow text-ink"}`}
            >
              {t.titulo}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <label className="flex-1 min-w-0 relative">
          <span className="sr-only">Buscar en el texto</span>
          <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en el temario (p. ej. «moción de censura»)"
            className="w-full h-12 rounded-full bg-card paper-shadow pl-11 pr-4 text-[16px] outline-none focus:ring-2 focus:ring-ink"
          />
        </label>
        <button type="button" onClick={() => setIndexOpen((o) => !o)} aria-expanded={indexOpen} className="tap press h-12 px-4 rounded-full bg-card paper-shadow flex items-center gap-1.5 text-sm font-semibold shrink-0">
          <ListBullets size={20} weight="bold" /> Índice
        </button>
      </div>

      {indexOpen && headings.length > 0 && (
        <nav aria-label="Índice del documento" className="rounded-folder bg-card paper-shadow p-2 max-h-[60vh] overflow-auto">
          {headings.map(({ b, i }) => (
            <button key={i} type="button" onClick={() => goto(i)} className={`tap block w-full text-left rounded-[10px] px-3 py-2 hover:bg-ground-2 text-sm ${b.h === 2 ? "font-semibold" : "pl-6 text-ink-soft"}`}>
              {b.t}
            </button>
          ))}
        </nav>
      )}

      {error && <p className="text-plum font-semibold">No se pudo descargar el texto. Comprueba la conexión y vuelve a abrirlo.</p>}
      {!blocks && !error && <p className="text-ink-soft">Cargando el temario completo…</p>}

      {results && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="label text-ink-soft">
            {results.length ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}` : "Sin resultados en este documento"}
          </p>
          {results.slice(0, 80).map(({ b, heading }, k) => (
            <div key={k} className="rounded-[14px] bg-card paper-shadow p-3 font-serif text-[16px] leading-relaxed">
              {heading && <p className="font-sans text-xs font-semibold text-ink-soft mb-1">{heading}</p>}
              <Hl text={plain(b)} q={query} />
            </div>
          ))}
        </div>
      )}

      {blocks && !results && <ReaderBar reader={reader} total={readable.length} idOf={(k) => `blk-${readable[k]?.i}`} />}

      {blocks && !results && (
        <article className="rounded-folder bg-card paper-shadow p-4 lg:p-6 flex flex-col gap-2 font-serif text-[17px] leading-relaxed">
          {blocks.map((b, i) => (
            <div key={i} id={`blk-${i}`} className={`scroll-mt-20 rounded-[10px] transition-colors ${readingBlock === i ? "bg-sun/40 -mx-2 px-2" : ""}`}>
              <Block b={b} bank={bank} onImage={(img) => setViewer(imgs.indexOf(img))} />
            </div>
          ))}
        </article>
      )}
      {viewer !== null && viewer >= 0 && <Viewer bank={bank} imgs={imgs} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} title={doc.titulo} />}
    </div>
  );
}
