import { useEffect, useState } from "react";
import { CaretDown, CaretLeft, Check, Trophy } from "@phosphor-icons/react";
import { ACHIEVEMENTS, MEDAL_FAMILIES, RANKS, medalProgress, rankInfo } from "../lib/logic.js";
import { Button, ArtIcon, Sheet } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import MedalCarousel from "./MedalCarousel.jsx";
import Liga from "./Liga.jsx";
import { Avatar } from "../avatars.jsx";
import { RankContent, StreakContent, markStreakSeen, readXpSeen, writeXpSeen } from "./Home.jsx";

const pretty = (u = "") => u.charAt(0).toUpperCase() + u.slice(1);

export default function Achievements({ store, user, liga, onReset, onBack }) {
  const [confirm, setConfirm] = useState(false);
  const [ladder, setLadder] = useState(false);
  // XP ganado desde la última vez que se vio el nivel: la barra se llena desde ahí y sale «+N XP».
  const [xpFrom] = useState(() => {
    const seen = readXpSeen();
    return seen !== null && seen < store.xp ? seen : undefined;
  });
  useEffect(() => {
    writeXpSeen(store.xp);
    markStreakSeen(store.streak); // el aviso de racha de Inicio ya está visto
  }, [store.xp, store.streak]);
  const specials = ACHIEVEMENTS.filter((a) => store.achievements[a.id]).length;
  const tiers = MEDAL_FAMILIES.map((f) => ({ f, p: medalProgress(f, store) }));
  const unlocked = specials + tiers.reduce((acc, t) => acc + t.p.level, 0);
  const total = ACHIEVEMENTS.length + MEDAL_FAMILIES.reduce((acc, f) => acc + f.tiers.length, 0);
  const { rank } = rankInfo(store.xp);
  // Carrusel: primero las conseguidas (por nivel), luego las pendientes; las especiales al final.
  const carousel = [
    ...[...tiers]
      .sort((a, b) => b.p.level - a.p.level || b.p.pct - a.p.pct)
      .map(({ f, p }) => ({ id: f.id, kind: "tier", title: f.name, color: f.color, locked: p.level === 0, family: f, level: p.level, progress: p })),
    ...ACHIEVEMENTS.map((a) => ({ id: a.id, kind: "special", title: a.name, color: PAL.lilac, locked: !store.achievements[a.id], illustration: a.illustration, fallback: a.fallback, desc: a.desc, date: store.achievements[a.id] })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {onBack && (
        <button type="button" onClick={onBack} className="tap press -mb-3 self-start h-11 pl-3 pr-4 rounded-full bg-card paper-shadow text-ink flex items-center gap-1 text-sm font-semibold lg:hidden">
          <CaretLeft size={18} weight="bold" /> Inicio
        </button>
      )}
      <h1 className="display text-[48px]">Logros</h1>

      {/* Tu ficha: quién eres, tu rango (con la subida de XP desde la última visita) y tus números */}
      <section aria-labelledby="ficha-title" className="rounded-folder bg-lilac text-ink overflow-hidden">
        <div className="p-5 pb-0 flex items-center gap-4">
          <Avatar user={user} face="happy" className="w-20 h-20 shrink-0" />
          <div className="min-w-0">
            <h2 id="ficha-title" className="display text-[32px] leading-none">
              {pretty(user)}
            </h2>
            <p className="text-sm font-semibold mt-1.5">
              Subalterno · Ayuntamiento de Cádiz
            </p>
          </div>
        </div>
        <RankContent key={xpFrom ?? "sin-animar"} xp={store.xp} from={xpFrom} />
        <dl className="grid grid-cols-3 gap-px bg-ink/10 border-t border-ink/10 text-center">
          {[
            { label: "Tests", value: store.totals.tests },
            { label: "Respondidas", value: store.totals.answered },
            { label: "Medallas", value: unlocked },
          ].map((st) => (
            <div key={st.label} className="py-3 bg-lilac flex flex-col-reverse">
              <dt className="text-xs mt-1">{st.label}</dt>
              <dd className="brand text-[26px] leading-none">{st.value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => setLadder((v) => !v)}
          aria-expanded={ladder}
          aria-controls="escalafon"
          className="tap w-full h-12 px-5 flex items-center justify-between text-sm font-semibold border-t border-ink/10"
        >
          {ladder ? "Ocultar escalafón" : "Ver escalafón (los 5 rangos)"}
          <CaretDown size={16} weight="bold" className={`transition-transform duration-200 ${ladder ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {ladder && (
          <ol id="escalafon" className="flex flex-col gap-1 px-3 pb-3 anim-fade" aria-label="Escalafón">
            {RANKS.map((r) => {
              const reached = store.xp >= r.min;
              const current = r.level === rank.level;
              return (
                <li key={r.level} className={`flex items-center gap-3 rounded-[14px] p-2 ${current ? "bg-ink text-ground" : "bg-card/60"}`}>
                  <span className={`w-11 h-11 blob shrink-0 flex items-center justify-center ${reached ? "bg-card text-ink" : "bg-card/50 text-ink-soft"}`}>
                    <ArtIcon name={r.illustration} size="50%" weight={reached ? "fill" : "regular"} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold leading-tight">{r.name}</span>
                    <span className={`block text-xs ${current ? "text-ground/75" : "text-ink-soft"}`}>
                      Nivel {r.level} · {r.min} XP{current ? " · estás aquí" : ""}
                    </span>
                  </span>
                  {reached && <Check size={20} weight="bold" aria-label="Alcanzado" />}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-label="Racha" className="rounded-folder bg-sun text-ink">
        <StreakContent streak={store.streak} />
      </section>

      <Liga store={store} user={user} remote={liga} />

      <section aria-labelledby="medallas-title" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="medallas-title" className="display text-[30px]">
            Medallas
          </h2>
          <p className="text-[15px] font-semibold flex items-center gap-1.5" aria-label={`${unlocked} de ${total} conseguidas`}>
            <Trophy size={18} weight="fill" className="text-plum" aria-hidden="true" />
            {unlocked} de {total}
          </p>
        </div>
        <MedalCarousel items={carousel} />
      </section>

      <button type="button" onClick={() => setConfirm(true)} className="tap press h-12 rounded-full text-sm text-ink-soft font-semibold underline underline-offset-4">
        Reiniciar progreso
      </button>

      <p className="text-xs text-ink-soft text-center">
        Opoempollo, el pollito, está basado en «Hand drawn flat design kawaii face collection» de{" "}
        <a href="https://www.freepik.com" target="_blank" rel="noreferrer" className="underline">
          Freepik
        </a>
        .
      </p>
      <Sheet
        open={confirm}
        title="¿Reiniciar?"
        illustration="reiniciar"
        onClose={() => setConfirm(false)}
        body="Se borran racha, XP, medallas, lecciones hechas, historial y tus puntos de la liga, en todos tus dispositivos. No se puede deshacer."
        actions={
          <>
            <Button variant="red" onClick={() => { setConfirm(false); onReset(); }}>
              Borrar progreso
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
