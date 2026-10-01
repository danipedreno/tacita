/* Apuntes completos y esquemas: cada texto e imagen es un archivo cifrado en public/docs/<id>.bin
   ("RCD1" | iv (12) | AES-256-GCM). La clave viaja dentro del banco (bank.docs.k), que ya va cifrado por usuario.
   Se descargan al abrirlos y se guardan cifrados en la caché del navegador: después funcionan sin conexión. */
import { useEffect, useState } from "react";

const CACHE = "tacita-docs-v1";
const url = (f) => `${import.meta.env.BASE_URL}docs/${f}.bin`;

let keyPromise = null;
let keyFor = null;
function cryptoKey(b64) {
  if (keyFor !== b64) {
    keyFor = b64;
    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    keyPromise = crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  }
  return keyPromise;
}

async function fetchBin(f) {
  let cache = null;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(url(f));
    if (hit) return hit.arrayBuffer();
  } catch (e) {
    /* sin Cache Storage: se descarga cada vez */
  }
  const res = await fetch(url(f));
  if (!res.ok) throw new Error(`docs ${res.status}`);
  if (cache) cache.put(url(f), res.clone()).catch(() => {});
  return res.arrayBuffer();
}

async function decrypt(bank, f) {
  const bytes = new Uint8Array(await fetchBin(f));
  const key = await cryptoKey(bank.docs.k);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(4, 16) }, key, bytes.slice(16));
}

const texts = new Map();
/** Bloques de un texto: [{h, t} | {p} | {li} | {img: {f, w, h}}]. */
export function loadText(bank, f) {
  if (!texts.has(f)) {
    const p = decrypt(bank, f).then(async (plain) => JSON.parse(await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"))).text()));
    p.catch(() => texts.delete(f));
    texts.set(f, p);
  }
  return texts.get(f);
}

const images = new Map();
function loadImage(bank, f) {
  if (!images.has(f)) {
    const p = decrypt(bank, f).then((plain) => URL.createObjectURL(new Blob([plain], { type: "image/jpeg" })));
    p.catch(() => images.delete(f));
    images.set(f, p);
  }
  return images.get(f);
}

/** URL (blob:) de una imagen cifrada; null mientras carga. `active` permite cargarla solo al verse. */
export function useDocImage(bank, f, active = true) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!active || !f) return undefined;
    let alive = true;
    loadImage(bank, f)
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [bank, f, active]);
  return { src, error };
}

/** Al cerrar sesión: fuera también los apuntes guardados. */
export function clearDocs() {
  texts.clear();
  images.forEach((p) => p.then((u) => URL.revokeObjectURL(u)).catch(() => {}));
  images.clear();
  try {
    caches.delete(CACHE);
  } catch (e) {
    /* nada que borrar */
  }
}
