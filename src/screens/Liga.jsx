import { ArrowClockwise, CheckCircle, MinusCircle, XCircle } from "@phosphor-icons/react";
import { CATEGORIES, ligaInfo, ligaTotals, tramoLabel } from "../lib/liga.js";
import { FoodIcon } from "../foods.jsx";
import { Avatar } from "../avatars.jsx";
import { ProgressBar } from "../ui.jsx";

const ROMAN = ["", "I", "II", "III"];
const pretty = (u) => u.charAt(0).toUpperCase() + u.slice(1);

function Counts({ t, className = "" }) {
  return (
    <span className={`flex items-center gap-3 font-mono text-xs ${className}`}>
      <span className="flex items-center gap-1" title="Aciertos">
        <CheckCircle size={15} weight="fill" className="text-olive" aria-hidden="true" />
        {t.correct}
      </span>
      <span className="flex items-center gap-1" title="Fallos">
        <XCircle size={15} weight="fill" className="text-plum" aria-hidden="true" />
        {t.wrong}
      </span>
      <span className="flex items-center gap-1" title="En blanco">
        <MinusCircle size={15} weight="fill" className="text-ink-soft" aria-hidden="true" />
        {t.blank}
      </span>
      <span className="sr-only">
        {t.correct} aciertos, {t.wrong} fallos y {t.blank} en blanco
      </span>
    </span>
  );
}

/**
 * Liga gaditana: tu categoría y la clasificación por tramos. Dentro de cada categoría los usuarios van
 * por orden alfabético, no por puntos: compartir tramo es compartir puesto.
 */
export default function Liga({ store, user, remote }) {
  const mine = ligaTotals(store.liga);
  const info = ligaInfo(mine.points);

  // Lo tuyo sale siempre de este dispositivo (lo más reciente); lo de los demás, de la nube.
  const people = [
    { usuario: user, t: mine, me: true },
    ...remote.rows.filter((r) => r.usuario !== user).map((r) => ({ usuario: r.usuario, t: ligaTotals(r.liga) })),
  ].map((p) => ({ ...p, info: ligaInfo(p.t.points) }));

  return (
    <section aria-labelledby="liga-title" className="flex flex-col gap-3">
      <div className="rounded-folder p-5 paper-shadow" style={{ background: info.cat.color }}>
        <p className="label">Liga gaditana</p>
        <div className="flex items-center gap-4 mt-2">
          <FoodIcon name={info.cat.icon} className="w-24 h-24 shrink-0" />
          <div className="min-w-0">
            <h2 id="liga-title" className="display text-[34px] leading-none">
              {info.cat.name}
            </h2>
            <p className="font-semibold mt-1">
              Nivel {ROMAN[info.level]} · {mine.points} {mine.points === 1 ? "punto" : "puntos"}
            </p>
          </div>
        </div>
        <ProgressBar pct={info.pct} track="bg-card/60" className="h-2.5 mt-4" label="Progreso hacia el siguiente nivel" />
        <p className="text-sm mt-2">{info.next ? `Te faltan ${info.toNext} para ${tramoLabel(info.next)}.` : "¡Lo más alto de la liga!"}</p>
        <Counts t={mine} className="mt-3" />
      </div>

      <div className="rounded-folder bg-card paper-shadow p-3">
        <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-2">
          <h3 className="display text-[26px]">Clasificación</h3>
          {remote.status !== "off" && (
            <button
              type="button"
              onClick={remote.refresh}
              disabled={remote.refreshing}
              className="tap press h-10 pl-3 pr-4 rounded-full bg-ground-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
            >
              <ArrowClockwise size={18} weight="bold" className={remote.refreshing ? "animate-spin" : ""} aria-hidden="true" />
              {remote.refreshing ? "Actualizando…" : "Actualizar"}
            </button>
          )}
        </div>
        <ol className="flex flex-col gap-1">
          {[...CATEGORIES].reverse().map((cat) => {
            const here = people.filter((p) => p.info.cat.id === cat.id).sort((a, b) => a.usuario.localeCompare(b.usuario));
            return (
              <li key={cat.id} className="rounded-[14px] p-2" style={here.length ? { background: `${cat.color}55` } : undefined}>
                <div className="flex items-center gap-3">
                  <FoodIcon name={cat.icon} dim={!here.length} className="w-11 h-11 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className={`block font-semibold leading-tight ${here.length ? "" : "text-ink-soft"}`}>{cat.name}</span>
                    <span className="block text-xs text-ink-soft">desde {cat.levels[0]} puntos</span>
                  </span>
                </div>
                {here.length > 0 && (
                  <ul className="flex flex-col gap-1 mt-2">
                    {here.map((p) => (
                      <li key={p.usuario} className={`flex items-center gap-3 rounded-[12px] bg-card px-2 py-1.5 ${p.me ? "ring-2 ring-ink" : ""}`}>
                        <Avatar user={p.usuario} className="w-10 h-10 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold leading-tight">
                            {pretty(p.usuario)}
                            {p.me && <span className="text-ink-soft font-normal"> (tú)</span>}
                          </span>
                          <Counts t={p.t} className="mt-0.5 text-ink-soft" />
                        </span>
                        <span className="label shrink-0">Nivel {ROMAN[p.info.level]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-ink-soft px-2 pt-3 pb-1">
          {remote.status === "off"
            ? "Para ver a los demás hay que activar la sincronización con Supabase."
            : remote.status === "offline"
              ? "Sin conexión: ahora solo se ve lo tuyo."
              : remote.status === "loading"
                ? "Cargando la clasificación…"
                : `${remote.at ? `Actualizada a las ${new Date(remote.at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}. ` : ""}` + "Exámenes de tema y reto del día: acierto +20, fallo −5, en blanco −2 (como el examen real, por 20). Cada tema puntúa una vez al día."}
        </p>
      </div>
    </section>
  );
}
