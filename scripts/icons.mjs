// Genera los iconos PWA: la mascota de Tacita (cúpula rosa con ojos, cuerpo oliva y gota naranja) sobre crema.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

// Mascota en un lienzo de 300×300.
export const mascot = `
  <path d="M60 210V180A90 72 0 0 1 240 180V210Z" fill="#ff8ac8"/>
  <path d="M75 208H225V222A75 48 0 0 1 75 222Z" fill="#848f3e"/>
  <path d="M150 112L134 88A22 22 0 1 1 166 88Z" fill="#c4692c"/>
  <circle cx="120" cy="172" r="17" fill="#fffcf7"/><circle cx="126" cy="173" r="9.5" fill="#1e1e1c"/>
  <circle cx="180" cy="172" r="17" fill="#fffcf7"/><circle cx="186" cy="173" r="9.5" fill="#1e1e1c"/>`;

const svg = (pad, bg = "#f6f1e9") => {
  const s = 512, u = (s - pad * 2) / 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="${bg}"/>
  <g transform="translate(${pad} ${pad - 18 * u}) scale(${u})">${mascot}</g>
</svg>`;
};

mkdirSync("public/icons", { recursive: true });
const out = [
  ["icon-192.png", 192, 40],
  ["icon-512.png", 512, 40],
  ["apple-touch-icon.png", 180, 40],
  ["icon-maskable-192.png", 192, 96],
  ["icon-maskable-512.png", 512, 96],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(`public/icons/${file}`);
}
writeFileSync("public/logo.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 70 220 170">${mascot}</svg>`);
console.log("Iconos generados en public/icons/");
