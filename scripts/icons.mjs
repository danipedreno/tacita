// Genera los iconos PWA: tres pestañas de carpeta (azul, rojo, verde) sobre tinta.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const tab = (x, y, w, color) =>
  `<path d="M${x} ${y + 44}C${x + 4} ${y + 44} ${x + 6.4} ${y + 40} ${x + 7.6} ${y + 34}L${x + 11.8} ${y + 10}C${x + 13.5} ${y + 3} ${x + 16} ${y} ${x + 24} ${y}H${x + w - 24}C${x + w - 16} ${y} ${x + w - 13.5} ${y + 3} ${x + w - 11.8} ${y + 10}L${x + w - 7.6} ${y + 34}C${x + w - 6.4} ${y + 40} ${x + w - 4} ${y + 44} ${x + w} ${y + 44}Z" fill="${color}"/>`;

const svg = (pad) => {
  const s = 512, inner = s - pad * 2, u = inner / 300;
  const g = (y, color, x) => `${tab(x, y, 150, color)}<rect x="0" y="${y + 43}" width="300" height="${300 - y}" rx="8" fill="${color}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="#191919"/>
  <g transform="translate(${pad} ${pad + 10 * u}) scale(${u})">
    ${g(30, "#1e4bd7", 20)}${g(105, "#d71e1e", 110)}${g(180, "#0c7866", 40)}
    <rect x="0" y="265" width="300" height="10" fill="#0c7866"/>
  </g>
  <g transform="translate(${pad} ${pad + 10 * u}) scale(${u})"><path d="M70 262 l30 -22 30 22 M70 282 l30 -22 30 22" stroke="#ffe927" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(50 -30)"/></g>
</svg>`;
};

mkdirSync("public/icons", { recursive: true });
const out = [
  ["icon-192.png", 192, 56],
  ["icon-512.png", 512, 56],
  ["apple-touch-icon.png", 180, 56],
  ["icon-maskable-192.png", 192, 104],
  ["icon-maskable-512.png", 512, 104],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(`public/icons/${file}`);
}
console.log("Iconos generados en public/icons/");
