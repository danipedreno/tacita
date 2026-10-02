/* Letra exacta de los artículos: en las lecciones y en los apuntes, cada «Art. 30» se puede tocar y sale el
   artículo tal cual está en el temario completo del tema («Los españoles tienen el derecho y el deber…»).
   Los resúmenes ayudan a entender, pero en el examen preguntan por las palabras exactas. */
import { createContext, useContext, useEffect, useState } from "react";
import { BookOpenText } from "@phosphor-icons/react";
import { loadText } from "./docs.js";
import { Button, Sheet } from "../ui.jsx";

const Ctx = createContext(null);
export const useArticles = () => useContext(Ctx);

/** «Art. 30», «arts. 30», «artículo 30», «Artículos 30» → captura el número. */
export const ART_RE = /\b((?:[Aa]rts?\.|[Aa]rt[íi]culos?)\s*)(\d+)/g;

const HEAD_RE = /^Art[íi]culo\s+(\d+)\b/;

/** Índice número → { n, title, source, blocks } a partir de los bloques del temario completo. */
function indexArticles(docs) {
  const map = new Map();
  for (const blocks of docs) {
    let source = null;
    let cur = null;
    for (const b of blocks) {
      if (b.h) {
        const m = HEAD_RE.exec(b.t || "");
        if (m) {
          cur = map.has(m[1]) ? null : { n: m[1], title: b.t, source, blocks: [] }; // si se repite, vale el primero
          if (cur) map.set(m[1], cur);
          continue;
        }
        if (b.h <= 2) source = b.t;
        cur = null;
      } else if (cur && (b.p || b.li)) cur.blocks.push(b);
    }
  }
  return map;
}

const cache = new Map();
function loadArticles(bank, temaId) {
  const key = temaId;
  if (!cache.has(key)) {
    const textos = bank?.docs?.temas?.[temaId]?.textos || [];
    const p = Promise.all(textos.map((t) => loadText(bank, t.f).catch(() => []))).then(indexArticles);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key);
}

/** Da a todo lo que hay dentro los artículos del tema y la hoja para leerlos. */
export function ArticlesProvider({ bank, temaId, children, Rich }) {
  const [map, setMap] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!bank || !temaId) return undefined;
    loadArticles(bank, temaId)
      .then((m) => alive && setMap(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [bank, temaId]);
  const art = open && map?.get(open);
  return (
    <Ctx.Provider value={map && map.size ? { has: (n) => map.has(String(n)), open: (n) => setOpen(String(n)) } : null}>
      {children}
      <Sheet
        open={!!art}
        title={art ? `Artículo ${art.n} · letra exacta` : ""}
        onClose={() => setOpen(null)}
        body={
          art && (
            <div className="text-ink">
              {art.source && <p className="label text-ink-soft flex items-center gap-1.5 mb-2"><BookOpenText size={16} weight="bold" aria-hidden="true" /> {art.source}</p>}
              <div className="max-h-[52vh] overflow-y-auto overscroll-contain flex flex-col gap-2.5 font-serif text-[17px] leading-relaxed">
                {art.blocks.length ? art.blocks.map((b, k) => <Rich key={k} text={b.p || `• ${b.li}`} plain />) : <p>{art.title}</p>}
              </div>
            </div>
          )
        }
        actions={
          <Button variant="ink" onClick={() => setOpen(null)}>
            Entendido
          </Button>
        }
      />
    </Ctx.Provider>
  );
}
