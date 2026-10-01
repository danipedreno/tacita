// Vectoriza las ilustraciones: illustrations-src/<nombre>.(png|jpg|webp) → public/illustrations/<nombre>.svg
// Uso: npm run trace            (todas)
//      npm run trace bienvenida (solo esa)
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import potrace from "potrace";
import { ILLUSTRATIONS } from "../src/lib/illustrations.js";

export const SRC = "illustrations-src";
const OUT = "public/illustrations";
const INK = "#191919";

const potraceAsync = (buffer) =>
  new Promise((resolve, reject) =>
    potrace.trace(
      buffer,
      {
        color: INK,
        background: "transparent",
        threshold: 150, // tinta frente al fondo crema
        turdSize: 12, // descarta motas sueltas
        optTolerance: 0.35, // curvas suaves sin perder detalle
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    )
  );

/** Convierte una imagen de trama en SVG de tinta con fondo transparente. Devuelve el tamaño en KB. */
export async function traceFile(srcPath, name) {
  const img = sharp(srcPath);
  const { width, height } = await img.metadata();
  // Las imágenes pequeñas se amplían ×2 antes de trazar para que las curvas salgan más limpias.
  const scale = width < 1500 ? 2 : 1;
  const prepared = await img
    .resize(width * scale, height * scale, { kernel: "lanczos3" })
    .flatten({ background: "#ffffff" })
    .grayscale()
    .png()
    .toBuffer();
  const svg = (await potraceAsync(prepared))
    .replace(/\s(width|height)="\d+"/g, "") // solo viewBox: la app decide el tamaño
    .replace(/\s+/g, " ")
    .replace(/(\d+\.\d)\d+/g, "$1");
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `${name}.svg`), svg);
  return Math.round(svg.length / 1024);
}

async function main() {
  const only = process.argv[2];
  const files = readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && (!only || basename(f, extname(f)) === only));
  if (!files.length) {
    console.log(`No hay imágenes en ${SRC}/${only ? ` con el nombre «${only}»` : ""}.`);
    return;
  }
  for (const file of files) {
    const name = basename(file, extname(file));
    if (!ILLUSTRATIONS[name]) console.warn(`⚠ «${name}» no es un hueco de la app (revisa src/lib/illustrations.js).`);
    console.log(`✓ ${name}.svg · ${await traceFile(join(SRC, file), name)} KB`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
