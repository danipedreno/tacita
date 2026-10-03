import { useEffect, useRef, useState } from "react";
import { ArrowArcLeft, ArrowArcRight, CaretLeft, CheckCircle, Headphones, Pause, Play, SkipForward, SpinnerGap, X } from "@phosphor-icons/react";
import { learnTemas } from "../lib/bank.js";
import { episodesOf, fmtTime, player, usePodcast } from "../lib/podcast.js";

/** Portada del episodio: el color y el número del tema, con unos cascos. */
function Cover({ numero, color, className = "" }) {
  return (
    <span className={`relative shrink-0 rounded-[14px] flex items-end p-2 overflow-hidden ${className}`} style={{ background: color }} aria-hidden="true">
      <Headphones size={30} weight="fill" className="absolute top-2 right-2 opacity-80" />
      <span className="brand text-[26px] leading-none">{numero}</span>
    </span>
  );
}

/** Un episodio como en las apps de pódcast: portada, título, tema, «Escuchado» y el play con la duración. */
function EpisodeRow({ bank, ep, eps, k, color, temaTitle, st }) {
  const on = st.queue[st.index]?.key === ep.key;
  const heard = !!st.heard[ep.key];
  const play = () => (on ? player.toggle() : player.play(bank, eps, k));
  return (
    <li className="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
      <Cover numero={ep.numero} color={color} className="w-[72px] h-[72px]" />
      <button type="button" onClick={play} className="tap flex-1 min-w-0 text-left">
        <span className="block font-semibold text-[16px] leading-snug">
          {ep.i + 1}. {ep.title}
        </span>
        <span className="block text-[13px] text-ink-soft mt-0.5 truncate">
          Tema {ep.numero} · {temaTitle}
        </span>
        <span className="flex items-center gap-2 mt-1.5 min-h-[22px]">
          {on ? (
            <span className="tag !h-[22px] !text-[11px] !bg-ink !text-ground !border-ink">{st.playing ? "Sonando" : "En pausa"}</span>
          ) : heard ? (
            <span className="tag !h-[22px] !text-[11px] flex items-center gap-1 !bg-mint/15 text-olive">
              <CheckCircle size={13} weight="fill" /> Escuchado
            </span>
          ) : (
            <span className="tag !h-[22px] !text-[11px]">Nuevo</span>
          )}
        </span>
      </button>
      <span className="flex flex-col items-center gap-1 shrink-0 w-16">
        <button
          type="button"
          onClick={play}
          aria-label={on && st.playing ? `Pausar ${ep.title}` : `Escuchar ${ep.title}`}
          className={`tap press w-12 h-12 rounded-full flex items-center justify-center ${heard && !on ? "bg-ground-2 text-ink" : "bg-ink text-ground"}`}
        >
          {on && st.loading ? <SpinnerGap size={20} className="animate-spin" /> : on && st.playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
        </button>
        <span className="font-mono text-xs text-ink-soft">{on ? fmtTime(st.time) : fmtTime(ep.s)}</span>
      </span>
    </li>
  );
}

/** Lista de episodios de un tema, con «Escuchar todo». */
export function EpisodeList({ bank, temaId, color }) {
  const eps = episodesOf(bank, temaId);
  const st = usePodcast();
  const tema = bank.temas.find((t) => t.id === temaId);
  const total = eps.reduce((a, e) => a + e.s, 0);
  const lessons = tema?.lecciones.length || 0;
  const heard = eps.filter((e) => st.heard[e.key]).length;
  const firstNew = Math.max(0, eps.findIndex((e) => !st.heard[e.key]));
  if (!eps.length)
    return <p className="text-[15px] text-ink-soft">El pódcast de este tema aún se está grabando. Mientras, tienes el resumen y el temario completo.</p>;
  return (
    <section aria-label="Pódcast del tema" className="flex flex-col gap-3">
      <div className="rounded-folder p-4 flex gap-4 items-center" style={{ background: color }}>
        <Cover numero={tema.numero} color="rgba(255,255,255,0.55)" className="w-24 h-24" />
        <div className="min-w-0 flex-1">
          <p className="label">Carmen explica · Pepe pregunta</p>
          <h2 className="display text-[22px] mt-1 leading-tight">{tema.titulo}</h2>
          <p className="text-sm mt-1">
            {eps.length} {eps.length === 1 ? "episodio" : "episodios"} · {Math.round(total / 60)} min · {heard} {heard === 1 ? "escuchado" : "escuchados"}
          </p>
        </div>
      </div>
      <button type="button" onClick={() => player.play(bank, eps, heard === eps.length ? 0 : firstNew)} className="tap press w-full h-12 rounded-full bg-ink text-ground text-sm font-semibold flex items-center justify-center gap-2">
        <Play size={18} weight="fill" /> {heard === 0 ? "Escuchar desde el principio" : heard === eps.length ? "Volver a escucharlo todo" : `Seguir por el episodio ${eps[firstNew].i + 1}`}
      </button>
      <ol className="rounded-folder bg-card paper-shadow px-3">
        {eps.map((e, k) => (
          <EpisodeRow key={e.key} bank={bank} ep={e} eps={eps} k={k} color={color} temaTitle={tema.titulo} st={st} />
        ))}
      </ol>
      {eps.length < lessons && <p className="text-sm text-ink-soft text-center">Faltan {lessons - eps.length} episodios por grabar; irán apareciendo aquí.</p>}
    </section>
  );
}

/** Pantalla de pódcast: eliges el tema arriba y debajo salen sus episodios. */
export default function PodcastScreen({ bank, store, initialTema, colorOf, onBack }) {
  const st = usePodcast();
  const temas = learnTemas(bank);
  const withEps = temas.filter((t) => episodesOf(bank, t.id).length);
  const [sel, setSel] = useState(() => {
    const playing = st.queue[st.index]?.tema;
    const pick = [playing, initialTema].find((id) => id && withEps.some((t) => t.id === id));
    return pick || withEps[0]?.id || temas[0]?.id;
  });
  const chips = useRef(null);
  useEffect(() => {
    chips.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [sel]);
  const allEps = withEps.flatMap((t) => episodesOf(bank, t.id));
  const heardAll = allEps.filter((e) => st.heard[e.key]).length;
  return (
    <div className="flex flex-col gap-5">
      <header>
        <button type="button" onClick={onBack} className="tap press mb-3 h-11 pl-3 pr-4 rounded-full bg-card paper-shadow text-ink flex items-center gap-1 text-sm font-semibold">
          <CaretLeft size={18} weight="bold" /> Inicio
        </button>
        <h1 className="display text-[44px]">Pódcast</h1>
        <p className="text-[15px] text-ink-soft mt-1">
          Cada lección, contada en unos minutos. {allEps.length} episodios grabados · {heardAll} escuchados.
        </p>
      </header>

      <nav aria-label="Temas" className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 px-4 py-2 bg-ground/95 backdrop-blur border-b border-line">
        <div ref={chips} className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {temas.map((t) => {
            const eps = episodesOf(bank, t.id);
            const n = eps.length;
            const done = n > 0 && eps.every((e) => st.heard[e.key]);
            const on = t.id === sel;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSel(t.id)}
                className={`tap press shrink-0 h-11 pl-1.5 pr-3.5 rounded-full flex items-center gap-2 text-sm font-semibold ${on ? "bg-ink text-ground" : n ? "bg-card paper-shadow" : "bg-card/60 text-ink-soft"}`}
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-[12px] font-bold" style={{ background: colorOf(t.id), opacity: n ? 1 : 0.5 }}>
                  {done ? <CheckCircle size={16} weight="fill" /> : t.numero}
                </span>
                Tema {t.numero}
                <span className={`font-mono text-xs ${on ? "text-ground/70" : "text-ink-soft"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <EpisodeList key={sel} bank={bank} temaId={sel} color={colorOf(sel)} />
    </div>
  );
}

/** Reproductor pequeño, fijo encima de la barra de abajo; sigue sonando al cambiar de pantalla. */
export function MiniPlayer() {
  const st = usePodcast();
  const ep = st.queue[st.index];
  const [drag, setDrag] = useState(null);
  if (!ep) return null;
  const time = drag ?? st.time;
  const pct = st.dur ? (time / st.dur) * 100 : 0;
  // Barra de progreso arrastrable: la zona táctil es más alta que la barra; al soltar se salta a ese punto.
  const at = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (st.dur || 0);
  };
  const onDown = (e) => {
    if (!st.dur) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(at(e));
  };
  const onMove = (e) => drag != null && setDrag(at(e));
  const onUp = (e) => {
    if (drag == null) return;
    player.seekTo(at(e));
    setDrag(null);
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft") player.seek(-5);
    else if (e.key === "ArrowRight") player.seek(5);
    else return;
    e.preventDefault();
  };
  return (
    <div className="fixed left-3 right-3 lg:left-auto lg:right-6 lg:w-[380px] miniplayer-pos z-40 rounded-[22px] bg-ink text-ground shadow-xl overflow-hidden" role="region" aria-label="Pódcast">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Posición del episodio"
        aria-valuemin={0}
        aria-valuemax={Math.round(st.dur || 0)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${fmtTime(time)} de ${fmtTime(st.dur)}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={onKey}
        className="absolute inset-x-0 top-0 h-5 z-10 cursor-pointer touch-none group"
      >
        <div className={`bg-ground/20 transition-[height] duration-150 ${drag != null ? "h-2" : "h-1 group-hover:h-1.5"}`}>
          <div className={`h-full bg-sun ${drag != null ? "" : "transition-[width] duration-300"}`} style={{ width: `${pct}%` }}>
          </div>
        </div>
      </div>
      <div className="h-1" />
      <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-2">
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold leading-tight truncate">{ep.title}</span>
          <span className="block text-[11px] opacity-75 whitespace-nowrap truncate">
            Tema {ep.numero} · {st.error ? "No se pudo cargar" : `${fmtTime(time)} / ${fmtTime(st.dur)}`}
          </span>
        </span>
        <button type="button" onClick={() => player.seek(-15)} aria-label="Atrás 15 segundos" className="tap w-10 h-10 rounded-full flex items-center justify-center">
          <ArrowArcLeft size={20} weight="bold" />
        </button>
        <button type="button" onClick={player.toggle} aria-label={st.playing ? "Pausa" : "Reproducir"} className="tap press w-11 h-11 rounded-full bg-ground text-ink flex items-center justify-center">
          {st.loading ? <SpinnerGap size={20} className="animate-spin" /> : st.playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
        </button>
        <button type="button" onClick={() => player.seek(15)} aria-label="Adelante 15 segundos" className="tap w-10 h-10 rounded-full flex items-center justify-center">
          <ArrowArcRight size={20} weight="bold" />
        </button>
        {st.index < st.queue.length - 1 && (
          <button type="button" onClick={player.next} aria-label="Siguiente episodio" className="tap w-9 h-10 rounded-full flex items-center justify-center">
            <SkipForward size={18} weight="fill" />
          </button>
        )}
        <button type="button" onClick={player.cycleRate} aria-label="Velocidad" className="tap h-8 px-2 rounded-full bg-ground/15 text-[12px] font-mono font-semibold">
          {String(st.rate).replace(".", ",")}×
        </button>
        <button type="button" onClick={player.stop} aria-label="Cerrar el pódcast" className="tap w-9 h-10 rounded-full flex items-center justify-center opacity-80">
          <X size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
