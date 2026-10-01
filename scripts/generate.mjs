// Genera con Gemini (Nano Banana) todas las ilustraciones que falten y las vectoriza a SVG.
//
//   npm run illustrations                      → genera las que no tienen PNG en illustrations-src/
//   npm run illustrations racha-activa ascenso → solo esas (las regenera aunque existan)
//   npm run illustrations -- --force           → regenera todas
//   npm run illustrations -- --dry-run         → muestra qué haría, sin llamar a la API
//
// Necesita GEMINI_API_KEY en el archivo .env (ver .env.example).
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ILLUSTRATIONS, fullPrompt } from "../src/lib/illustrations.js";
import { SRC, traceFile } from "./trace.mjs";

// Nano Banana 2 por defecto; si tu cuenta no lo tiene, se cae al Nano Banana clásico.
const MODELS = process.env.GEMINI_IMAGE_MODEL ? [process.env.GEMINI_IMAGE_MODEL] : ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
let model = MODELS[0];
const API_KEY = process.env.GEMINI_API_KEY;
const REF_DIR = join(SRC, "_referencia");
const CONCURRENCY = 3;
const NO_BILLING =
  "Tu clave está en la capa gratuita y Google no da cuota gratis para generar imágenes por API.\n" +
  "Activa la facturación del proyecto en https://aistudio.google.com/apikey (botón «Set up billing») y vuelve a lanzar el comando.";
let fatalError = null;
const MAX_ATTEMPTS = 3;

const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const requested = args.filter((a) => !a.startsWith("--"));

const unknown = requested.filter((n) => !ILLUSTRATIONS[n]);
if (unknown.length) {
  console.error(`No existen estos huecos: ${unknown.join(", ")}.\nDisponibles: ${Object.keys(ILLUSTRATIONS).join(", ")}`);
  process.exit(1);
}
const hasSource = (name) => ["png", "jpg", "jpeg", "webp"].some((ext) => existsSync(join(SRC, `${name}.${ext}`)));
const queue = requested.length ? requested : Object.keys(ILLUSTRATIONS).filter((n) => force || !hasSource(n));

if (!queue.length) {
  console.log("Todas las ilustraciones tienen ya su imagen. Usa --force para regenerarlas.");
  process.exit(0);
}

/** Imágenes de referencia de estilo: todo lo que haya en illustrations-src/_referencia/ */
async function loadReferences() {
  if (!existsSync(REF_DIR)) return [];
  const files = readdirSync(REF_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  return Promise.all(
    files.map(async (f) => ({
      name: f,
      // Se normalizan a PNG de 1536 px como máximo para no mandar peticiones enormes.
      data: (await sharp(join(REF_DIR, f)).resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true }).png().toBuffer()).toString("base64"),
    }))
  );
}

async function generate(name, refs) {
  const body = {
    contents: [
      {
        parts: [
          { text: fullPrompt(name) },
          ...refs.map((r) => ({ inline_data: { mime_type: "image/png", data: r.data } })),
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: ILLUSTRATIONS[name].ratio === "wide" ? "16:9" : "1:1",
        // 2K da trazos más finos al vectorizar (el modelo 2.5 no admite este campo).
        ...(model.startsWith("gemini-2.5") ? {} : { imageSize: "2K" }),
      },
    },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json.error?.message || `HTTP ${res.status}`;
    // Cuota 0 = la clave no tiene facturación activada: reintentar no sirve.
    if (res.status === 429 && /limit: 0\b/.test(message)) {
      const err = new Error(NO_BILLING);
      err.fatal = true;
      throw err;
    }
    const err = new Error(message.split("\n")[0]);
    err.retryable = res.status === 429 || res.status >= 500;
    // Modelo no disponible para esta clave: pasar al siguiente de la lista.
    if (res.status === 404 && MODELS.indexOf(model) < MODELS.length - 1) {
      model = MODELS[MODELS.indexOf(model) + 1];
      console.log(`… modelo no disponible, cambio a ${model}`);
      err.retryable = true;
    }
    throw err;
  }
  const parts = json.candidates?.[0]?.content?.parts || [];
  const image = parts.find((p) => p.inlineData || p.inline_data);
  if (!image) {
    const reason = json.candidates?.[0]?.finishReason || json.promptFeedback?.blockReason || "sin imagen en la respuesta";
    const err = new Error(`Gemini no devolvió imagen (${reason})`);
    err.retryable = true;
    throw err;
  }
  return Buffer.from((image.inlineData || image.inline_data).data, "base64");
}

async function processOne(name, refs) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const png = await generate(name, refs);
      const file = join(SRC, `${name}.png`);
      await sharp(png).png().toFile(file);
      const kb = await traceFile(file, name);
      console.log(`✓ ${name} · ${kb} KB`);
      return true;
    } catch (e) {
      if (e.fatal) {
        fatalError = e.message;
        return false;
      }
      const last = attempt === MAX_ATTEMPTS || !e.retryable;
      console.log(`${last ? "✗" : "…"} ${name}: ${e.message}${last ? "" : ` (reintento ${attempt + 1}/${MAX_ATTEMPTS})`}`);
      if (last) return false;
      await new Promise((r) => setTimeout(r, 4000 * attempt));
    }
  }
  return false;
}

const refs = await loadReferences();
console.log(`Modelo: ${model} · Referencias: ${refs.map((r) => r.name).join(", ") || "ninguna"}`);
console.log(`A generar (${queue.length}): ${queue.join(", ")}\n`);

if (dryRun) {
  console.log(`Ejemplo de prompt (${queue[0]}):\n${fullPrompt(queue[0])}`);
  process.exit(0);
}
if (!API_KEY) {
  console.error("Falta GEMINI_API_KEY. Copia .env.example a .env y pega tu clave de https://aistudio.google.com/apikey");
  process.exit(1);
}

mkdirSync(SRC, { recursive: true });
const failed = [];
const pending = [...queue];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (pending.length && !fatalError) {
      const name = pending.shift();
      if (!(await processOne(name, refs))) failed.push(name);
    }
  })
);

if (fatalError) {
  console.error(`\n✗ ${fatalError}`);
  process.exit(1);
}
console.log(`\nHechas: ${queue.length - failed.length}/${queue.length}.`);
if (failed.length) console.log(`Fallidas: ${failed.join(", ")}. Vuelve a lanzar: npm run illustrations ${failed.join(" ")}`);
