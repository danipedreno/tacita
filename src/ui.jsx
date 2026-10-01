import { useState } from "react";
import { ArrowCounterClockwise, Books, CaretDoubleUp, CaretDown, Cards, Check, Fire, GraduationCap, Scales, Star, Target, Timer } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { Toaster, toast } from "sonner";
import { Mascot, isGroup } from "./mascots.jsx";
import { RANKS, ROMAN } from "./lib/logic.js";

/* ---------------------------------------------------------------------
   Carpeta con pestaña: pestaña redondeada en pastel sobre un cuerpo del mismo color
   --------------------------------------------------------------------- */

/** Pestaña: esquinas superiores redondas y el color de su carpeta. `dark` = texto claro sobre tono hondo. */
export function FolderTab({ color, dark = false, compact = false, children, className = "" }) {
  return (
    <div
      className={`h-11 flex items-center gap-2 rounded-t-[16px] font-medium leading-none whitespace-nowrap ${compact ? "px-3.5 text-[15px]" : "px-4 text-base"} ${dark ? "text-ground" : "text-ink"} ${className}`}
      style={{ background: color }}
    >
      {children}
    </div>
  );
}

/** Carpeta: pestaña + cuerpo del mismo color. */
export function Folder({ color, tab, tabDark = false, stacked = false, tabOffset = "ml-0", className = "", bodyClassName = "", children, style }) {
  return (
    <section className={`relative ${className}`} style={style}>
      <div className="flex items-end">
        <FolderTab color={color} dark={tabDark} className={`${tabOffset} -mb-px relative z-[1]`}>
          {tab}
        </FolderTab>
      </div>
      <div className={`relative rounded-folder rounded-tl-none ${tabDark ? "text-ground" : "text-ink"} ${stacked ? "pb-16" : ""} ${bodyClassName}`} style={{ background: color }}>
        {children}
      </div>
    </section>
  );
}

/** Tarjeta blanca: lectura larga, formularios e ilustraciones. */
export function Paper({ className = "", children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`bg-card text-ink rounded-folder paper-shadow ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------------
   Controles
   --------------------------------------------------------------------- */
const BUTTON_VARIANTS = {
  yellow: "bg-sun text-ink hover:brightness-95",
  blue: "bg-ink text-ground hover:bg-navy",
  paper: "bg-card text-ink border-2 border-line hover:border-line-strong",
  ghost: "bg-transparent text-ink border-2 border-ink/80 hover:bg-ink/5",
  red: "bg-plum text-ground hover:brightness-110",
  green: "bg-olive text-ground hover:brightness-110",
  ink: "bg-ink text-ground hover:bg-navy",
};

export function Button({ variant = "yellow", className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`tap press h-14 px-6 rounded-full font-sans font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, className = "", children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`tap press w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Selector segmentado. El estado activo es una segunda capa idéntica recortada con clip-path:
 * al cambiar, el recorte se desliza y el color cambia justo en el borde (técnica de Emil Kowalski).
 * Es CSS puro: va en el hilo del compositor y se puede interrumpir a mitad.
 */
export function Segmented({ label, options, value, onChange, disabledValues = [], hideLabel = false }) {
  const n = options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
  const cell = (o, active) => (
    <>
      {o.label}
      {o.sub && <span className={`block text-[11px] font-medium ${active ? "text-ground/90" : "text-ink-soft"}`}>{o.sub}</span>}
    </>
  );
  return (
    <fieldset>
      <legend className={hideLabel ? "sr-only" : "label text-ink-soft mb-2"}>{label}</legend>
      <div className="relative rounded-[28px] bg-ground-2 p-1">
        <div className="grid gap-1" style={cols}>
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              disabled={disabledValues.includes(o.value)}
              aria-pressed={o.value === value}
              onClick={() => onChange(o.value)}
              className="tap press min-h-12 py-1.5 rounded-full text-sm font-semibold leading-tight text-ink-soft hover:text-ink disabled:opacity-35"
            >
              {cell(o, false)}
            </button>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-1 grid gap-1 pointer-events-none transition-[clip-path] duration-[250ms] ease-in-out"
          style={{ ...cols, clipPath: `inset(0 ${((n - 1 - index) / n) * 100}% 0 ${(index / n) * 100}% round 999px)` }}
        >
          {options.map((o) => (
            <div key={String(o.value)} className="min-h-12 py-1.5 rounded-full bg-ink text-ground text-sm font-semibold leading-tight flex flex-col items-center justify-center text-center">
              {cell(o, true)}
            </div>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

/**
 * Baldosa seleccionable con ilustración (sustituye a las casillas). `wide` ocupa las dos columnas.
 * Es un botón conmutable (aria-pressed): el estado se ve con el borde de tinta y el círculo con check.
 */
export function ChoiceTile({ selected, onClick, color, title, note, illustration, fallback, wide = false, compact = false }) {
  const art = wide ? (compact ? "w-16 h-16" : "w-24 h-24") : compact ? "w-14 h-14" : "w-20 h-20";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`tap press relative text-left rounded-[22px] p-3 transition-shadow duration-150 ${
        wide ? `col-span-2 flex items-center gap-3 ${compact ? "min-h-[88px]" : "min-h-[116px]"}` : `flex flex-col ${compact ? "min-h-[128px]" : "min-h-[172px]"}`
      } ${selected ? "shadow-[inset_0_0_0_3px_#1e1e1c]" : ""}`}
      style={{ background: color }}
    >
      <span
        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${selected ? "bg-ink text-ground" : "bg-card/70 border-2 border-ink/25"}`}
        aria-hidden="true"
      >
        {selected && <Check size={16} weight="bold" />}
      </span>
      <span className={`${art} shrink-0 bg-card/75 blob p-1.5 ${wide ? "order-2 ml-auto mr-8" : ""}`}>
        <Illustration name={illustration} fallback={fallback} className="w-full" alt="" />
      </span>
      <span className={wide ? "order-1 min-w-0 pl-1" : "mt-auto pt-2 pr-1"}>
        <span className="block font-semibold text-[17px] leading-tight">{title}</span>
        {note && <span className="block text-xs mt-1 leading-snug">{note}</span>}
      </span>
    </button>
  );
}

/**
 * Desplegable con estilo propio: un campo en píldora que abre una hoja inferior con las opciones
 * (el menú nativo del sistema no se puede decorar).
 */
export function Picker({ id, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) || options[0];
  const triggerText = current.num != null ? `Tema ${current.num} · ${current.label}` : current.label;
  // Opciones consecutivas del mismo grupo (bloque) van juntas bajo una sola cabecera.
  const sections = [];
  for (const o of options) {
    const last = sections[sections.length - 1];
    if (last && last.group === o.group) last.items.push(o);
    else sections.push({ group: o.group, color: o.color, items: [o] });
  }
  return (
    <div>
      <span id={`${id}-label`} className="label text-ink-soft block mb-2">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen(true)}
        className="tap press w-full min-h-12 rounded-full bg-card paper-shadow pl-4 pr-2 py-1.5 flex items-center gap-2.5 text-left"
      >
        {current.color && <span className="w-3.5 h-3.5 blob shrink-0" style={{ background: current.color }} aria-hidden="true" />}
        <span id={`${id}-value`} className="flex-1 min-w-0 truncate font-semibold text-[15px]">
          {current.group && <span className="text-ink-soft font-medium">{current.short || current.group} · </span>}
          {triggerText}
        </span>
        <span className="w-9 h-9 rounded-full bg-ground flex items-center justify-center shrink-0" aria-hidden="true">
          <CaretDown size={16} weight="bold" />
        </span>
      </button>
      <Sheet
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        body={
          <div role="listbox" aria-label={label} className="-mx-2 max-h-[60vh] overflow-y-auto overscroll-contain flex flex-col gap-1 pt-1 pb-2">
            {sections.map((sec, si) => (
              <div key={sec.group || `s${si}`} className="shrink-0 flex flex-col gap-1" role={sec.group ? "group" : undefined} aria-label={sec.group || undefined}>
                {/* Cabecera del bloque: se queda fija arriba mientras recorres sus temas */}
                {sec.group && (
                  <p className="sticky top-0 z-[1] bg-card flex items-center gap-2 px-3 pt-3 pb-1.5 text-sm font-semibold text-ink-soft" aria-hidden="true">
                    {sec.color && <span className="w-3.5 h-3.5 blob shrink-0" style={{ background: sec.color }} />}
                    {sec.group}
                  </p>
                )}
                {sec.items.map((o) => {
                  const on = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={`tap press shrink-0 w-full text-left rounded-[16px] px-3 py-2.5 flex items-center gap-3 text-ink ${on ? "bg-sun" : "hover:bg-ground"}`}
                    >
                      {o.num != null ? (
                        <span className={`w-8 h-8 rounded-full font-mono text-sm font-semibold flex items-center justify-center shrink-0 ${on ? "bg-card" : "bg-ground"}`} aria-hidden="true">
                          {o.num}
                        </span>
                      ) : (
                        !o.group && o.color && <span className="w-4 h-4 blob shrink-0" style={{ background: o.color }} aria-hidden="true" />
                      )}
                      <span className="flex-1 min-w-0 leading-snug">
                        {o.num != null && <span className="sr-only">Tema {o.num}: </span>}
                        {o.label}
                      </span>
                      {on && <Check size={18} weight="bold" className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}

/** Barra de progreso animada con transform (scaleX), no con width: no recalcula el layout. */
export function ProgressBar({ pct, color = "#1e1e1c", track = "bg-ground-2", className = "h-2", label }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div className={`${track} rounded-full overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div
        className="h-full w-full rounded-full origin-left transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${v / 100})`, background: color }}
      />
    </div>
  );
}

/** Galones: una insignia por nivel alcanzado. */
export function Galones({ level, onPaper = false, onDark = false }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Nivel ${level} de ${RANKS.length}`} role="img">
      {RANKS.map((r) => (
        <CaretDoubleUp
          key={r.level}
          weight="bold"
          size={20}
          className={onDark ? (r.level <= level ? "text-sun" : "text-ground/25") : r.level <= level ? (onPaper ? "text-plum" : "text-ink") : onPaper ? "text-line" : "text-ink/20"}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Distintivo de medalla por niveles: carpeta del color de la familia con su icono y el nivel.
   --------------------------------------------------------------------- */
const MEDAL_ICONS = { graduation: GraduationCap, fire: Fire, target: Target, books: Books, timer: Timer, repeat: ArrowCounterClockwise, star: Star, scales: Scales, cards: Cards };

export function MedalBadge({ family, level, size = 64 }) {
  const Icon = MEDAL_ICONS[family.icon];
  const locked = level === 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`w-full h-full blob flex items-center justify-center ${locked ? "bg-ground-2 text-line-strong" : "text-ink"}`}
        style={locked ? undefined : { background: family.color }}
      >
        {family.illustration ? (
          // Ilustración de la medalla; mientras no exista, se ve su icono.
          <Illustration
            name={family.illustration}
            alt=""
            className={`w-[78%] ${locked ? "opacity-30" : ""}`}
            fallbackNode={<Icon size={size * 0.46} weight={locked ? "regular" : "fill"} />}
          />
        ) : (
          <Icon size={size * 0.46} weight={locked ? "regular" : "fill"} />
        )}
      </div>
      {!locked && (
        <span
          className="absolute -bottom-1.5 -right-1.5 min-w-[28px] h-7 px-1.5 rounded-full bg-ink text-ground font-mono text-xs font-semibold flex items-center justify-center"
          aria-label={`Nivel ${level}`}
        >
          {ROMAN[level]}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Ilustraciones: personajes geométricos con ojos (src/mascots.jsx), generados en SVG
   --------------------------------------------------------------------- */
export function Illustration({ name, className = "", alt = "", face, look, follow }) {
  return <Mascot name={name} fit="center" face={face} look={look} follow={follow} title={alt || undefined} className={`${isGroup(name) ? "aspect-[5/2]" : "aspect-square"} w-full h-auto mascot-idle ${className}`} />;
}

/* ---------------------------------------------------------------------
   Hoja inferior y avisos
   --------------------------------------------------------------------- */
/**
 * Hoja inferior con Vaul (librería de Emil Kowalski): se cierra arrastrando hacia abajo,
 * con inercia (un gesto rápido basta) y la curva de cajón de iOS. Siempre montada: `open` la abre y cierra.
 */
export function Sheet({ open, title, illustration, body, actions, onClose }) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-navy/45" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md lg:max-w-lg outline-none">
          <Paper className="rounded-t-[28px] rounded-b-none px-5 pt-3 pb-safe">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
            <div className="flex items-start gap-4">
              {illustration && <Illustration name={illustration} className="w-24 shrink-0" />}
              <div className="min-w-0">
                <Drawer.Title className="display text-[30px]">{title}</Drawer.Title>
                <Drawer.Description asChild>
                  <div className="mt-2 text-[15px] text-ink-soft leading-relaxed">{body}</div>
                </Drawer.Description>
              </div>
            </div>
            {actions && <div className="mt-5 grid gap-2">{actions}</div>}
            {!actions && <div className="h-4" />}
          </Paper>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Avisos con Sonner (también de Emil): entran y salen por arriba y se descartan deslizando. */
export function AppToaster() {
  const top = "calc(env(safe-area-inset-top, 0px) + 12px)";
  return <Toaster position="top-center" offset={{ top }} mobileOffset={{ top, left: 16, right: 16 }} gap={8} />;
}

export function notify({ icon, color = "#a9bccf", kicker, text, duration = 3800 }) {
  toast.custom(
    () => (
      <Paper className="w-full px-3 py-3 flex items-center gap-3">
        <span className="w-11 h-11 blob flex items-center justify-center shrink-0 text-ink" style={{ background: color }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="label text-ink-soft">{kicker}</p>
          <p className="font-semibold truncate">{text}</p>
        </div>
      </Paper>
    ),
    { duration }
  );
}
