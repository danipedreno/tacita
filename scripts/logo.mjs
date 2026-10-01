// Logo de Empolla: recorta la variante elegida de la hoja de Gemini, borra el pollito de la cabeza
// y la vectoriza en tres capas (mancha amarilla, rellenos blancos, tinta) → public/logo.svg.
// Después genera los iconos PWA a partir de ese SVG.
// Uso: node scripts/logo.mjs
import sharp from "sharp";
import potrace from "potrace";
import { writeFileSync, mkdirSync } from "node:fs";

const SRC = "illustrations-src/_logo/gemini-logos.webp";
const CROP = { left: 560, top: 540, width: 400, height: 440 }; // cuadrante inferior derecho
const UP = 2; // se traza ampliado para curvas limpias
const SUN = "#fae355";
const INK = "#222222";

// Zona del pollito (coordenadas de la hoja original) y altura a la que empieza el pelo.
const CHICK = { x0: 735, x1: 802, y0: 552, y1: 612 };
const HAIR_TOP = 612;

const { data, info } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const px = (x, y) => (y * W + x) * 3;

// 0 = fondo, 1 = amarillo, 2 = tinta, 3 = claro (relleno o fondo)
const cls = new Uint8Array(W * H);
const lumMap = new Uint8Array(W * H);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = px(x, y), r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    lumMap[y * W + x] = lum;
    cls[y * W + x] = lum < 115 ? 2 : r > 150 && g > 130 && r - b > 45 ? 1 : 3;
  }

// Borde superior de la mancha a ambos lados del pollito → arco para rellenar el hueco.
const topYellow = (gx) => {
  const x = gx - CROP.left;
  for (let y = 0; y < H; y++) if (cls[y * W + x] === 1) return y;
  return H;
};
const lx = CHICK.x0 - 6, rx = CHICK.x1 + 6;
const ly = topYellow(lx), ry = topYellow(rx);
// Cumbre del arco algo por encima de la recta (la mancha es redondeada).
const arcY = (gx) => {
  const t = (gx - lx) / (rx - lx);
  return ly + (ry - ly) * t - 6 * 4 * t * (1 - t);
};
for (let gy = CHICK.y0; gy <= CHICK.y1 + 10; gy++)
  for (let gx = CHICK.x0; gx <= CHICK.x1; gx++) {
    const k = (gy - CROP.top) * W + (gx - CROP.left);
    if (gy < HAIR_TOP) cls[k] = gy - CROP.top >= arcY(gx) ? 1 : 0;
  }
// Donde se apoyaban las patitas: lo que queda entre tinta por ambos lados es pelo; el resto, mancha.
const inkAt = (x, y) => x >= 0 && x < W && y >= 0 && y < H && cls[y * W + x] === 2;
for (let gy = HAIR_TOP; gy <= CHICK.y1 + 10; gy++)
  for (let gx = CHICK.x0; gx <= CHICK.x1; gx++) {
    const x = gx - CROP.left, y = gy - CROP.top, k = y * W + x;
    if (cls[k] === 2) continue;
    let l = false, r = false;
    for (let d = 1; d <= 12; d++) (l ||= inkAt(x - d, y)), (r ||= inkAt(x + d, y));
    cls[k] = l && r ? 2 : 1;
  }

// Claro conectado con el borde = fondo; el resto de claros son rellenos de la figura.
const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const k = stack.pop();
  if (seen[k] || (cls[k] !== 3 && cls[k] !== 0)) continue;
  seen[k] = 1;
  cls[k] = 0;
  const x = k % W, y = (k / W) | 0;
  if (x > 0) stack.push(k - 1);
  if (x < W - 1) stack.push(k + 1);
  if (y > 0) stack.push(k - W);
  if (y < H - 1) stack.push(k + W);
}

/** Máscara (negro = dentro) ampliada, con dilatación opcional para que las capas se solapen sin rendijas. */
async function mask(test, grow = 0) {
  const m = Buffer.alloc(W * H);
  for (let k = 0; k < W * H; k++) m[k] = test(cls[k]) ? 0 : 255;
  let img = sharp(m, { raw: { width: W, height: H, channels: 1 } }).resize(W * UP, H * UP, { kernel: "lanczos3" });
  if (grow) img = img.blur(grow).threshold(200); // blur + umbral alto = dilatar lo negro
  else img = img.blur(1.4).threshold(128); // suaviza el dentado del escalado sin engordar el trazo
  return img.png().toBuffer();
}

const trace = (buf, color) =>
  new Promise((res, rej) =>
    potrace.trace(buf, { color, background: "transparent", threshold: 128, turdSize: 30, optTolerance: 0.4 }, (e, svg) =>
      e ? rej(e) : res(svg.match(/<path[^>]*\/>/)[0].replace(/(\d+\.\d)\d+/g, "$1"))
    )
  );

const fill = await trace(await mask((c) => c === 3), "#ffffff");
// La tinta se traza desde la luminancia real (con el pollito ya borrado): bordes con antialias → curvas lisas.
const inChick = (k) => {
  const gx = (k % W) + CROP.left, gy = ((k / W) | 0) + CROP.top;
  return gx >= CHICK.x0 && gx <= CHICK.x1 && gy >= CHICK.y0 && gy <= CHICK.y1 + 10;
};
const inkGray = Buffer.alloc(W * H);
for (let k = 0; k < W * H; k++) inkGray[k] = inChick(k) ? (cls[k] === 2 ? 0 : 255) : lumMap[k];
const ink = await trace(
  await sharp(inkGray, { raw: { width: W, height: H, channels: 1 } }).resize(W * UP, H * UP, { kernel: "cubic" }).blur(0.8).threshold(115).png().toBuffer(),
  INK
);

// La mancha: solo la parte amarilla (sin lo que sobresale por abajo: nido y pies).
const blobOnly = await trace(await mask((c) => c === 1, 2.2), SUN);

// viewBox recortado al contenido (sin el margen de la hoja de Gemini).
const probe = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W * UP} ${H * UP}" width="${W * UP}" height="${H * UP}">${blobOnly}${fill}${ink}</svg>`;
const { info: t } = await sharp(Buffer.from(probe)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const bx = -t.trimOffsetLeft, by = -t.trimOffsetTop, bw = t.width, bh = t.height;
const VB = `${bx} ${by} ${bw} ${bh}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}"><g class="logo-blob">${blobOnly}</g><g class="logo-fig">${fill}${ink}</g></svg>`;
writeFileSync("public/logo.svg", svg);
mkdirSync("src/assets", { recursive: true });
writeFileSync("src/assets/logo.svg", svg); // la animación de arranque lo lleva en línea
console.log(`public/logo.svg · ${Math.round(svg.length / 1024)} KB · lados ${ly}/${ry}`);

// Iconos: logo centrado sobre crema; la versión «maskable» con más margen.
mkdirSync("public/icons", { recursive: true });
const iconSvg = (size, pad) => {
  const inner = size - pad * 2;
  const s = Math.min(inner / bw, inner / bh);
  const ox = (size - bw * s) / 2 - bx * s, oy = (size - bh * s) / 2 - by * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#fdf4df"/><g transform="translate(${ox} ${oy}) scale(${s})">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></svg>`;
};
for (const [file, size, pad] of [
  ["icon-192.png", 192, 16],
  ["icon-512.png", 512, 44],
  ["apple-touch-icon.png", 180, 16],
  ["icon-maskable-192.png", 192, 40],
  ["icon-maskable-512.png", 512, 106],
]) {
  await sharp(Buffer.from(iconSvg(size, pad))).png().toFile(`public/icons/${file}`);
}
console.log("Iconos regenerados en public/icons/");
