/* Banco privado: lecciones, preguntas y tarjetas hechas a partir del temario de la academia.
   El repositorio es público, así que viaja CIFRADO (public/banco.enc, AES-256-GCM). Con usuario y
   contraseña se descarga, se descifra en el móvil y se guarda en su propia clave de localStorage.
   Se genera con `npm run banco` (contenido/build.mjs). */
import { useCallback, useEffect, useState } from "react";
import { clearDocs } from "./docs.js";

const BANK_KEY = "tacita-banco.v1";
const ACCESS_KEY = "tacita-acceso.v1";
const ITERATIONS = 310000; // mismo valor que contenido/build.mjs
const url = (f) => `${import.meta.env.BASE_URL}${f}`;

const readJSON = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "null");
  } catch (e) {
    return null;
  }
};

/** Descifra banco.enc: "RCB1" | sal (16) | iv (12) | gzip cifrado con AES-GCM. Lanza si la clave no es correcta. */
export async function decryptFile(buffer, user, pass) {
  const bytes = new Uint8Array(buffer);
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== "RCB1") throw new Error("formato");
  const salt = bytes.slice(4, 20);
  const iv = bytes.slice(20, 32);
  const secret = new TextEncoder().encode(`${user.trim().toLowerCase()}:${pass.trim()}`);
  const base = await crypto.subtle.importKey("raw", secret, "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bytes.slice(32));
  const text = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  return JSON.parse(text);
}

/** Cada usuario tiene su archivo: banco-<sha256("tacita:usuario")[:16]>.enc (mismo cálculo que contenido/build.mjs). */
async function bankFile(user) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`tacita:${user.trim().toLowerCase()}`));
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `banco-${hex.slice(0, 16)}.enc`;
}

async function downloadBank(user, pass, version) {
  let res;
  try {
    res = await fetch(url(`${await bankFile(user)}?v=${encodeURIComponent(version || Date.now())}`), { cache: "no-store" });
  } catch (e) {
    throw new Error("red");
  }
  if (res.status === 404) throw new Error("usuario");
  if (!res.ok) throw new Error("red");
  return decryptFile(await res.arrayBuffer(), user, pass);
}

async function remoteVersion() {
  try {
    const res = await fetch(url(`banco-version.json?t=${Date.now()}`), { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch (e) {
    return null;
  }
}

const loadBank = () => readJSON(BANK_KEY);

/** Usuario y contraseña guardados al entrar (para sincronizar el progreso). */
export const getAccess = () => readJSON(ACCESS_KEY);

/** Comprueba que el banco tiene el formato que genera contenido/build.mjs. */
export function validateBank(json) {
  if (!json || json.formato !== "tacita-banco") return "El banco no tiene el formato de Tacita.";
  if (!Array.isArray(json.temas) || !Array.isArray(json.preguntas) || !Array.isArray(json.flashcards)) return "El banco está incompleto.";
  const badQ = json.preguntas.find((q) => !q.id || !q.q || q.options?.length !== 4 || !(q.answer >= 0 && q.answer <= 3));
  if (badQ) return `Hay una pregunta con formato incorrecto (${badQ.id || "sin id"}).`;
  return null;
}

export function useBank({ onUpdated } = {}) {
  const [user, setUser] = useState(() => readJSON(ACCESS_KEY)?.user || null);
  const [bank, setBank] = useState(() => {
    const b = loadBank();
    return b && !validateBank(b) ? b : null;
  });

  const save = (json) => {
    try {
      localStorage.setItem(BANK_KEY, JSON.stringify(json));
    } catch (e) {
      /* sin espacio: el temario sigue en memoria hasta cerrar la app */
    }
    setBank(json);
  };

  /** Inicia sesión: descarga y descifra el temario. Devuelve { ok, error }. */
  const login = useCallback(async (user, pass) => {
    try {
      const version = await remoteVersion();
      const json = await downloadBank(user, pass, version?.generado);
      const error = validateBank(json);
      if (error) return { ok: false, error };
      save(json);
      setUser(user.trim().toLowerCase());
      try {
        localStorage.setItem(ACCESS_KEY, JSON.stringify({ user: user.trim().toLowerCase(), pass: pass.trim() }));
      } catch (e) {
        /* sin almacenamiento: seguirá funcionando hasta cerrar la app */
      }
      return { ok: true, bank: json };
    } catch (e) {
      if (e.message === "red") return { ok: false, error: "No se pudo descargar el temario. Comprueba la conexión." };
      return { ok: false, error: "Usuario o contraseña incorrectos." };
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(BANK_KEY);
      localStorage.removeItem(ACCESS_KEY);
    } catch (e) {
      /* nada que borrar */
    }
    clearDocs();
    setBank(null);
    setUser(null);
  }, []);

  // Al abrir la app: si hay una versión nueva publicada, se descarga sola con las credenciales guardadas.
  useEffect(() => {
    const access = readJSON(ACCESS_KEY);
    if (!access) return;
    let cancelled = false;
    (async () => {
      const version = await remoteVersion();
      const current = loadBank();
      if (!version || cancelled || (current && current.generado === version.generado && (current.rev || null) === (version.rev || null))) return;
      try {
        const json = await downloadBank(access.user, access.pass, version.generado);
        if (cancelled || validateBank(json)) return;
        save(json);
        onUpdated?.(json);
      } catch (e) {
        /* sin conexión o credenciales cambiadas: se sigue con el temario guardado */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { bank: user ? bank : null, user, login, logout };
}

export const temasOf = (bank, block) => (bank?.temas || []).filter((t) => block === "all" || t.bloque === block);

export function bankQuestions(bank, block = "all", tema = "all") {
  return (bank?.preguntas || []).filter((q) => (block === "all" || q.block === block) && (tema === "all" || q.tema === tema));
}

export function bankCards(bank, block = "all", tema = "all") {
  return (bank?.flashcards || []).filter((c) => (block === "all" || c.block === block) && (tema === "all" || c.tema === tema));
}

export const temaLabel = (bank, id) => {
  const t = bank?.temas.find((x) => x.id === id);
  if (!t) return "";
  return t.bloque === "practica" ? t.titulo : `Tema ${t.numero} · ${t.titulo}`;
};

export const temaById = (bank, id) => bank?.temas.find((t) => t.id === id) || null;

/** Temas con lecciones, en el orden recomendado de estudio. */
export const learnTemas = (bank) => (bank?.temas || []).filter((t) => t.lecciones?.length);

export const casoById = (bank, id) => bank?.casos?.find((c) => c.id === id) || null;
