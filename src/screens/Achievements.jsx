import { useState } from "react";
import { Check, Trophy } from "@phosphor-icons/react";
import { ACHIEVEMENTS, MEDAL_FAMILIES, RANKS, medalProgress, rankInfo } from "../lib/logic.js";
import { Button, ArtIcon, Sheet } from "../ui.jsx";
import { PAL } from "../lib/palette.js";
import MedalCarousel from "./MedalCarousel.jsx";
import Liga from "./Liga.jsx";

export default function Achievements({ store, user, liga, onReset }) {
  const [confirm, setConfirm] = useState(false);
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
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="display text-[48px]">Logros</h1>
        </div>
        <p className="h-11 px-4 mb-1 rounded-full bg-card paper-shadow flex items-center gap-1.5 text-[15px] font-semibold" aria-label={`${unlocked} de ${total} logros conseguidos`}>
          <Trophy size={18} weight="fill" className="text-plum" />
          {unlocked} de {total}
        </p>
      </header>

      <Liga store={store} user={user} remote={liga} />

      <MedalCarousel items={carousel} />

      <section aria-labelledby="escalafon-title" className="rounded-folder bg-plum text-ground p-3">
        <h2 id="escalafon-title" className="display text-[30px] text-lilac px-2 pt-2 pb-3">
          Escalafón
        </h2>
        <ol className="flex flex-col gap-1">
          {RANKS.map((r) => {
            const reached = store.xp >= r.min;
            const current = r.level === rank.level;
            return (
              <li key={r.level} className={`flex items-center gap-3 rounded-[14px] p-2 ${current ? "bg-lilac text-ink" : ""}`}>
                <span className={`w-11 h-11 blob shrink-0 flex items-center justify-center ${reached ? "bg-card text-plum" : "bg-card/40 text-ground"}`}>
                  <ArtIcon name={r.illustration} size="50%" weight={reached ? "fill" : "regular"} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold leading-tight">{r.name}</span>
                  <span className={`block text-xs ${current ? "text-ink" : "text-lilac"}`}>Nivel {r.level} · {r.min} XP</span>
                </span>
                {reached && <Check size={20} weight="bold" className={current ? "text-plum" : "text-lilac"} aria-label="Alcanzado" />}
              </li>
            );
          })}
        </ol>
      </section>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Tests", value: store.totals.tests },
          { label: "Respondidas", value: store.totals.answered },
          { label: "Mejor racha", value: store.streak.best || 0 },
        ].map((s) => (
          <div key={s.label} className="py-3 rounded-folder bg-card paper-shadow flex flex-col-reverse">
            <dt className="text-xs text-ink-soft mt-1.5">{s.label}</dt>
            <dd className="brand text-[28px] leading-none">{s.value}</dd>
          </div>
        ))}
      </dl>

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
