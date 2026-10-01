import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowCounterClockwise, BookOpen, Cards, CheckCircle, ClipboardText, GraduationCap, House, Trophy } from "@phosphor-icons/react";
import { applyCardsResult, applyExamResult, applyLessonResult, createExam, mistakePool, rankInfo } from "./lib/logic.js";
import { bankQuestions, temaById, temaLabel, useBank } from "./lib/bank.js";
import { studiedTemas } from "./lib/tutor.js";
import CardsScreen from "./screens/Cards.jsx";
import { DEFAULT_STORE, useInstallPrompt, useNow, usePersistentStore } from "./lib/store.js";
import { AppToaster, notify } from "./ui.jsx";
import Splash, { shouldShowSplash } from "./screens/Splash.jsx";
import { PAL } from "./lib/palette.js";
import Home from "./screens/Home.jsx";
import Celebrations from "./screens/Celebration.jsx";
import Temario from "./screens/Temario.jsx";
import Login from "./screens/Login.jsx";
import Achievements from "./screens/Achievements.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Learn, { unitColor } from "./screens/Learn.jsx";
import LessonPlayer from "./screens/Lesson.jsx";
import { setSoundEnabled } from "./lib/sound.js";
import { ExamResults, ExamRunner, ExamSetup } from "./screens/Exam.jsx";

const TABS = [
  { id: "home", label: "Inicio", Icon: House, color: PAL.sun },
  { id: "learn", label: "Aprende", Icon: GraduationCap, color: PAL.mint },
  { id: "test", label: "Test", Icon: ClipboardText, color: PAL.sky },
  { id: "cards", label: "Tarjetas", Icon: Cards, color: PAL.peach },
  { id: "badges", label: "Logros", Icon: Trophy, color: PAL.lilac },
];
// En escritorio, los apuntes tienen su propia entrada en la barra lateral.
const SIDE_TABS = [...TABS.slice(0, 4), { id: "temario", label: "Apuntes", Icon: BookOpen, color: PAL.mint }, TABS[4]];

/**
 * Barra de pestañas (móvil). La pestaña activa es una capa de color recortada con clip-path que se desliza
 * de una pestaña a otra: el pastel de cada sección cambia exactamente en el borde.
 */
function TabBar({ tab, onChange }) {
  const index = TABS.findIndex((t) => t.id === tab);
  const n = TABS.length;
  return (
    <nav className="fixed left-3 right-3 tabbar-pos z-40 lg:hidden" aria-label="Navegación principal">
      <div className="relative max-w-md mx-auto rounded-full bg-card p-1.5 shadow-[0_0_0_1px_#ebdfc3,0_18px_40px_-16px_rgba(33,38,51,0.45)]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={tab === id ? "page" : undefined}
              className="tap press h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-ink-soft hover:text-ink"
            >
              <Icon size={23} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div
          aria-hidden="true"
          hidden={index < 0}
          className="absolute inset-1.5 grid gap-1 pointer-events-none transition-[clip-path] duration-[250ms] ease-in-out"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, clipPath: `inset(0 ${((n - 1 - index) / n) * 100}% 0 ${(index / n) * 100}% round 999px)` }}
        >
          {TABS.map(({ id, label, Icon, color }) => (
            <div key={id} className="h-14 rounded-full flex flex-col items-center justify-center gap-0.5 text-ink" style={{ background: color }}>
              <Icon size={23} weight="fill" />
              <span className="text-[11px] font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

/** Barra lateral (escritorio): marca, secciones y tu rango. */
function SideNav({ tab, onChange, xp }) {
  const { rank, pct } = rankInfo(xp);
  return (
    <nav className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-40 flex-col gap-1 border-r border-line bg-ground px-4 py-6" aria-label="Navegación principal">
      <p className="brand text-[44px] px-3 mb-1">Tacita</p>
      <p className="text-xs text-ink-soft px-3 mb-6 leading-snug">Subalterno · Ayuntamiento de Cádiz</p>
      {SIDE_TABS.map(({ id, label, Icon, color }) => {
        const on = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={on ? "page" : undefined}
            className={`tap press h-12 px-3 rounded-[14px] flex items-center gap-3 text-[16px] ${on ? "font-semibold text-ink" : "font-medium text-ink-soft hover:text-ink hover:bg-ground-2"}`}
            style={on ? { background: color } : undefined}
          >
            <Icon size={24} weight={on ? "fill" : "regular"} />
            {label}
          </button>
        );
      })}
      <div className="mt-auto rounded-[16px] bg-card paper-shadow p-3">
        <p className="text-xs text-ink-soft">Rango</p>
        <p className="font-semibold leading-tight">{rank.name}</p>
        <div className="h-1.5 rounded-full bg-ground-2 mt-2 overflow-hidden">
          <div className="h-full bg-plum rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="font-mono text-xs text-ink-soft mt-1.5">{xp} XP</p>
      </div>
    </nav>
  );
}

export default function App() {
  const [store, setStore] = usePersistentStore();
  const [tab, setTab] = useState(() => (store.activeExam || store.lastResult ? "test" : "home"));
  const install = useInstallPrompt();
  const { bank, login, logout } = useBank({
    onUpdated: (b) =>
      notify({
        icon: <CheckCircle size={24} weight="fill" />,
        color: PAL.mint,
        kicker: "Temario actualizado",
        text: `${b.temas.length} temas · ${b.preguntas.length} preguntas`,
      }),
  });
  const [celebration, setCelebration] = useState(null); // { queue, report }
  const [lesson, setLesson] = useState(null); // { temaId, index }
  const [apuntes, setApuntes] = useState(null); // tema abierto en Apuntes
  const [cardsAuto, setCardsAuto] = useState(false);
  const [splash, setSplash] = useState(shouldShowSplash);
  const endSplash = useCallback(() => setSplash(false), []);
  const storeRef = useRef(store);
  const finishedIds = useRef(new Set());
  const mainRef = useRef(null);
  storeRef.current = store;

  useEffect(() => {
    setSoundEnabled(store.settings.sound);
  }, [store.settings.sound]);

  const exam = store.activeExam;
  const now = useNow(!!exam);
  const remainingMs = exam ? Math.max(0, exam.endsAt - now) : 0;

  const updateExam = useCallback((fn) => setStore((s) => (s.activeExam ? { ...s, activeExam: fn(s.activeExam) } : s)), [setStore]);

  const startExam = useCallback(
    (cfg) => {
      const s = storeRef.current;
      const e = createExam({ penalty: s.settings.penalty, ...cfg });
      if (!e.questions.length) return;
      setStore((st) => ({ ...st, activeExam: e, lastResult: null }));
      setTab("test");
    },
    [setStore]
  );

  const finishExam = useCallback(
    (reason = "submitted") => {
      const s = storeRef.current;
      if (!s.activeExam || finishedIds.current.has(s.activeExam.id)) return;
      finishedIds.current.add(s.activeExam.id);
      const { store: next, report } = applyExamResult(s, s.activeExam, reason, new Date());
      setStore(next);
      setTab("test");
      // Pantallas de «¡Enhorabuena!» encadenadas; debajo queda el resultado.
      setCelebration({ queue: report.celebrations, report });
    },
    [setStore]
  );

  // Entrega automática al agotarse el tiempo (también tras reabrir la app con el examen caducado).
  useEffect(() => {
    if (exam && now >= exam.endsAt) finishExam("timeout");
  }, [exam, now, finishExam]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [tab, apuntes]);

  const onSelect = (idx) =>
    updateExam((e) => {
      const i = e.current;
      if (e.feedback === "immediate") {
        if (e.revealed[i]) return e;
        return { ...e, answers: e.answers.map((a, k) => (k === i ? idx : a)), revealed: e.revealed.map((r, k) => (k === i ? true : r)) };
      }
      return { ...e, answers: e.answers.map((a, k) => (k === i ? (a === idx ? null : idx) : a)) };
    });
  const onBlank = () => updateExam((e) => ({ ...e, revealed: e.revealed.map((r, k) => (k === e.current ? true : r)) }));
  const onGoto = (i) => updateExam((e) => ({ ...e, current: Math.max(0, Math.min(e.questions.length - 1, i)) }));
  const onAbandon = () => setStore((s) => ({ ...s, activeExam: null }));

  const onSettings = useCallback((patch) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } })), [setStore]);
  const onReview = () => {
    const s = storeRef.current;
    const pool = mistakePool(s.mistakes);
    if (!pool.length) return;
    startExam({ pool, count: pool.length, feedback: "immediate", secsPerQ: s.settings.secsPerQ, source: "mistakes", title: "Repaso de fallos" });
  };
  // Test rápido: 10 preguntas de lo ya estudiado (o de todo, si aún no hay nada), corrección al momento.
  const onQuickTest = () => {
    const s = storeRef.current;
    const studied = studiedTemas(bank, s);
    const pool = bank.preguntas.filter((q) => q.tema !== "casos" && (!studied.size || studied.has(q.tema)));
    startExam({ pool, count: 10, feedback: "immediate", secsPerQ: s.settings.secsPerQ, source: "temario", title: "Test rápido" });
  };
  const onTemaExam = (temaId) => {
    const s = storeRef.current;
    const pool = bankQuestions(bank, "all", temaId);
    startExam({ pool, count: 15, feedback: "immediate", secsPerQ: s.settings.secsPerQ, source: "temario", temaExam: temaId, title: `Examen del ${temaLabel(bank, temaId)}` });
  };
  const onPractice = ({ type, id }) => {
    const s = storeRef.current;
    if (type === "repaso") startExam({ pool: bankQuestions(bank, "all", "rep"), count: 20, feedback: "immediate", secsPerQ: s.settings.secsPerQ, source: "temario", title: "Test de repaso" });
    if (type === "caso") {
      const caso = bank.casos.find((c) => c.id === id);
      const pool = bank.preguntas.filter((q) => q.caso === id);
      startExam({ pool, count: pool.length, ordered: true, feedback: "final", secsPerQ: s.settings.secsPerQ, source: "temario", caso: id, title: caso.titulo });
    }
  };
  const onToggleSound = () => setStore((s) => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }));

  const onCardsFinish = (results, live) => {
    if (!results.length) return;
    const { store: next, report } = applyCardsResult(storeRef.current, results, new Date(), live);
    setStore(next);
    setCelebration({ queue: report.celebrations, report });
  };
  const onLessonFinish = (result) => {
    const { store: next, report } = applyLessonResult(storeRef.current, result, new Date());
    setStore(next);
    setLesson(null);
    setCelebration({ queue: report.celebrations, report });
  };
  const startLesson = (temaId, index) => setLesson({ temaId, index });

  // Lo que recomienda el tutor en Inicio.
  const onAction = (a) => {
    if (a.type === "lesson") startLesson(a.temaId, a.index);
    else if (a.type === "cards") {
      setCardsAuto(true);
      setTab("cards");
    } else if (a.type === "mistakes") onReview();
    else if (a.type === "temaExam") onTemaExam(a.temaId);
    else if (a.type === "weak") {
      const s = storeRef.current;
      startExam({ pool: bankQuestions(bank, "all", a.temaId), count: 10, feedback: "immediate", secsPerQ: s.settings.secsPerQ, source: "temario", title: `Refuerzo · ${temaLabel(bank, a.temaId)}` });
    } else if (a.type === "simulacro") {
      setStore((s) => ({ ...s, lastResult: null }));
      setTab("test");
    }
  };
  const onNewExam = () => {
    setStore((s) => ({ ...s, lastResult: null }));
    setTab("test");
  };
  const onReset = () => {
    finishedIds.current = new Set();
    setStore({ ...DEFAULT_STORE, installDismissed: storeRef.current.installDismissed });
    setTab("home");
    notify({ icon: <ArrowCounterClockwise size={24} weight="bold" />, color: PAL.sun, kicker: "Hecho", text: "Progreso reiniciado" });
  };
  const goTab = (id) => {
    if (id === "temario") setApuntes(null);
    setTab(id);
  };

  const lessonTema = lesson && temaById(bank, lesson.temaId);

  return (
    <div className="fixed inset-0 overflow-hidden bg-ground">
      <AppToaster />
      {splash && <Splash onDone={endSplash} />}
      {!bank ? (
        <Login onLogin={login} />
      ) : (
        <>
          {!store.onboarded && store.totals.answered === 0 && <Onboarding onDone={() => setStore((s) => ({ ...s, onboarded: true }))} />}
          {celebration && <Celebrations queue={celebration.queue} report={celebration.report} store={store} onDone={() => setCelebration(null)} />}
          {lessonTema &&
            createPortal(
              <LessonPlayer
                key={`${lesson.temaId}:${lesson.index}`}
                tema={lessonTema}
                index={lesson.index}
                color={unitColor(bank, lesson.temaId)}
                onExit={() => setLesson(null)}
                onFinish={onLessonFinish}
              />,
              document.body
            )}
          {exam ? (
            <ExamRunner exam={exam} bank={bank} remainingMs={remainingMs} onSelect={onSelect} onBlank={onBlank} onGoto={onGoto} onFinish={() => finishExam("submitted")} onAbandon={onAbandon} />
          ) : (
            <>
              <SideNav tab={tab} onChange={goTab} xp={store.xp} />
              <main ref={mainRef} className="absolute inset-0 lg:left-64 scroll-area">
                <div key={tab} className={`mx-auto px-4 lg:px-10 pt-safe lg:pt-10 pb-tabbar lg:pb-16 anim-rise ${tab === "home" ? "max-w-md lg:max-w-5xl" : "max-w-md lg:max-w-3xl"}`}>
                  {tab === "home" && (
                    <Home
                      store={store}
                      bank={bank}
                      install={install}
                      onDismissInstall={() => setStore((s) => ({ ...s, installDismissed: true }))}
                      onGoTemario={() => goTab("temario")}
                      onReview={onReview}
                      onPlan={(patch) => setStore((s) => ({ ...s, plan: { ...s.plan, ...patch } }))}
                      onQuickTest={onQuickTest}
                      onToggleSound={onToggleSound}
                      onAction={onAction}
                    />
                  )}
                  {tab === "learn" && (
                    <Learn
                      bank={bank}
                      store={store}
                      onStartLesson={startLesson}
                      onTemaExam={onTemaExam}
                      onApuntes={(id) => {
                        setApuntes(id);
                        setTab("temario");
                      }}
                      onPractice={onPractice}
                    />
                  )}
                  {tab === "test" &&
                    (store.lastResult ? (
                      <ExamResults
                        result={store.lastResult}
                        xp={store.xp}
                        pendingMistakes={Object.keys(store.mistakes).length}
                        onNew={onNewExam}
                        onHome={() => setTab("home")}
                        onReview={onReview}
                      />
                    ) : (
                      <ExamSetup store={store} bank={bank} onSettings={onSettings} onStart={startExam} />
                    ))}
                  {tab === "cards" && <CardsScreen store={store} bank={bank} onFinish={onCardsFinish} autoStart={cardsAuto} onAutoStarted={() => setCardsAuto(false)} />}
                  {tab === "temario" && (
                    <Temario
                      bank={bank}
                      store={store}
                      temaId={apuntes}
                      onOpen={setApuntes}
                      onBack={() => setTab("home")}
                      onStartLesson={startLesson}
                      onLogout={() => {
                        logout();
                        setTab("home");
                      }}
                    />
                  )}
                  {tab === "badges" && <Achievements store={store} onReset={onReset} />}
                </div>
              </main>
              <TabBar tab={tab} onChange={goTab} />
            </>
          )}
        </>
      )}
    </div>
  );
}
