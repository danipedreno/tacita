// Recorta los lotes 2×2 hechos en la web de Gemini y vectoriza todo lo pendiente.
//   illustrations-src/_lotes/lote-1.png … lote-7.png  → illustrations-src/<nombre>.png → public/illustrations/<nombre>.svg
// Uso: npm run split
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";
import { GRIDS, ILLUSTRATIONS } from "../src/lib/illustrations.js";
import { SRC, traceFile } from "./trace.mjs";

const LOTES = join(SRC, "_lotes");
const PAPER = "#fdfaf7";
const OUT_SIZE = 1024;

const findLote = (i) => ["png", "jpg", "jpeg", "webp"].map((ext) => join(LOTES, `lote-${i}.${ext}`)).find(existsSync);

/** Recorta un cuadrante, quita el fondo sobrante y lo centra en un lienzo cuadrado con margen. */
async function cutCell(file, index, name) {
  const { width, height } = await sharp(file).metadata();
  const w = Math.floor(width / 2);
  const h = Math.floor(height / 2);
  const cell = await sharp(file)
    .extract({ left: (index % 2) * w, top: Math.floor(index / 2) * h, width: w, height: h })
    .flatten({ background: PAPER })
    .toBuffer();
  let trimmed;
  try {
    trimmed = await sharp(cell).trim({ background: PAPER, threshold: 40 }).toBuffer();
  } catch {
    throw new Error("el cuadrante está vacío");
  }
  const inner = Math.round(OUT_SIZE * 0.84); // ~8 % de margen por lado
  await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: PAPER, kernel: "lanczos3" })
    .extend({ top: (OUT_SIZE - inner) / 2, bottom: (OUT_SIZE - inner) / 2, left: (OUT_SIZE - inner) / 2, right: (OUT_SIZE - inner) / 2, background: PAPER })
    .png()
    .toFile(join(SRC, `${name}.png`));
}

mkdirSync(LOTES, { recursive: true });
let cut = 0;
for (let i = 0; i < GRIDS.length; i++) {
  const file = findLote(i + 1);
  if (!file) continue;
  const names = GRIDS[i];
  // Lote ya recortado y sin cambios desde entonces: se salta.
  const cutAt = (n) => (existsSync(join(SRC, `${n}.png`)) ? statSync(join(SRC, `${n}.png`)).mtimeMs : 0);
  if (names.every((n) => cutAt(n) > statSync(file).mtimeMs)) continue;
  if (names.length === 1) {
    await sharp(file).png().toFile(join(SRC, `${names[0]}.png`));
    cut++;
    continue;
  }
  for (let k = 0; k < names.length; k++) {
    try {
      await cutCell(file, k, names[k]);
      cut++;
    } catch (e) {
      console.log(`✗ lote-${i + 1} · ${names[k]}: ${e.message}`);
    }
  }
  console.log(`✂ lote-${i + 1} → ${names.join(", ")}`);
}

// Vectoriza todo PNG nuevo o cambiado desde su último SVG (incluye las panorámicas sueltas).
let traced = 0;
for (const f of readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
  const name = basename(f, extname(f));
  if (!ILLUSTRATIONS[name]) continue;
  const svg = join("public/illustrations", `${name}.svg`);
  if (existsSync(svg) && statSync(svg).mtimeMs > statSync(join(SRC, f)).mtimeMs) continue;
  console.log(`✓ ${name}.svg · ${await traceFile(join(SRC, f), name)} KB`);
  traced++;
}

const done = Object.keys(ILLUSTRATIONS).filter((n) => existsSync(join("public/illustrations", `${n}.svg`)));
const missing = Object.keys(ILLUSTRATIONS).filter((n) => !done.includes(n));
console.log(`\nRecortadas: ${cut} · Vectorizadas: ${traced} · En la app: ${done.length}/${Object.keys(ILLUSTRATIONS).length}`);
if (missing.length) console.log(`Faltan: ${missing.join(", ")}`);
