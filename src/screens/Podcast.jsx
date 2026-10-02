import { ArrowArcLeft, ArrowArcRight, CheckCircle, Headphones, Pause, Play, SkipForward, SpinnerGap, X } from "@phosphor-icons/react";
import { episodesOf, fmtTime, player, usePodcast } from "../lib/podcast.js";

/** Lista de episodios de un tema, con «Escuchar todo». */
export function EpisodeList({ bank, temaId, color }) {
  const eps = episodesOf(bank, temaId);
  const st = usePodcast();
  const current = st.queue[st.index];
  const total = eps.reduce((a, e) => a + e.s, 0);
  const lessons = bank.temas.find((t) => t.id === temaId)?.lecciones.length || 0;
  if (!eps.length)
    return <p className="text-[15px] text-ink-soft">El pódcast de este tema aún se está grabando. Mientras, tienes el resumen y el temario completo.</p>;
  return (
    <section aria-label="Pódcast del tema" className="flex flex-col gap-3">
      <div className="rounded-folder p-5 paper-shadow" style={{ background: color }}>
        <p className="label flex items-center gap-1.5">
          <Headphones size={16} weight="bold" aria-hidden="true" /> Pódcast
        </p>
        <h2 className="display text-[28px] mt-1 leading-tight">Carmen te lo explica y Pepe pregunta</h2>
        <p className="text-sm mt-1">
          {eps.length} {eps.length === 1 ? "episodio" : "episodios"} · {Math.round(total / 60)} min{eps.length < lessons ? ` · faltan ${lessons - eps.length} por grabar` : ""}. Ideal para el coche o paseando.
        </p>
        <button type="button" onClick={() => player.play(bank, eps, 0)} className="tap press mt-4 w-full h-12 rounded-full bg-ink text-ground text-sm font-semibold flex items-center justify-center gap-2">
          <Play size={18} weight="fill" /> Escuchar todo el tema
        </button>
      </div>
      <ol className="flex flex-col gap-1.5">
        {eps.map((e, k) => {
          const on = current?.key === e.key;
          return (
            <li key={e.key}>
              <button
                type="button"
                onClick={() => (on ? player.toggle() : player.play(bank, eps, k))}
                className={`tap press w-full text-left rounded-[14px] px-3 py-2.5 flex items-center gap-3 ${on ? "bg-ink text-ground" : "bg-card paper-shadow"}`}
              >
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${on ? "bg-ground text-ink" : "bg-ground-2"}`}>
                  {on && st.loading ? <SpinnerGap size={18} className="animate-spin" /> : on && st.playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold leading-tight truncate">
                    {e.i + 1}. {e.title}
                  </span>
                  <span className={`block text-xs mt-0.5 ${on ? "opacity-80" : "text-ink-soft"}`}>{fmtTime(e.s)}</span>
                </span>
                {st.heard[e.key] && <CheckCircle size={20} weight="fill" className={on ? "" : "text-olive"} aria-label="Escuchado" />}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Reproductor pequeño, fijo encima de la barra de abajo; sigue sonando al cambiar de pantalla. */
export function MiniPlayer() {
  const st = usePodcast();
  const ep = st.queue[st.index];
  if (!ep) return null;
  const pct = st.dur ? (st.time / st.dur) * 100 : 0;
  return (
    <div className="fixed left-3 right-3 lg:left-auto lg:right-6 lg:w-[380px] miniplayer-pos z-40 rounded-[22px] bg-ink text-ground shadow-xl overflow-hidden" role="region" aria-label="Pódcast">
      <div className="h-1 bg-ground/20">
        <div className="h-full bg-sun transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-2">
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold leading-tight truncate">{ep.title}</span>
          <span className="block text-[11px] opacity-75 whitespace-nowrap truncate">
            Tema {ep.numero} · {st.error ? "No se pudo cargar" : `${fmtTime(st.time)} / ${fmtTime(st.dur)}`}
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
