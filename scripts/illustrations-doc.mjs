// Genera ILUSTRACIONES.md y PROMPTS-NANO-BANANA.md a partir de src/lib/illustrations.js
import { writeFileSync } from "node:fs";
import { GRIDS, ILLUSTRATIONS, STYLE, fullPrompt, gridPrompt } from "../src/lib/illustrations.js";

const entries = Object.entries(ILLUSTRATIONS);
const screens = [...new Set(entries.map(([, v]) => v.screen))];
const size = (r) => (r === "wide" ? "16:9" : "1:1");

/* --- ILUSTRACIONES.md --- */
let md = `# Ilustraciones de Recuento

Total: **${entries.length} ilustraciones**, en line art editorial de tinta negra.

## Cómo se generan

\`\`\`bash
npm run illustrations          # genera con Gemini las que falten y las vectoriza a SVG
npm run illustrations ascenso  # regenera solo esa (útil si no te gusta el resultado)
\`\`\`

- Los PNG originales quedan en \`illustrations-src/\`; los SVG finales en \`public/illustrations/\`.
- Las imágenes de \`illustrations-src/_referencia/\` se envían a Gemini como referencia de estilo.
  Cuando una ilustración te guste mucho, cópiala ahí para que las siguientes se parezcan más.
- Gratis en la web de Gemini, por lotes de 4: ver PROMPTS-NANO-BANANA.md y \`npm run split\`.
- Medallas bloqueadas y rangos no alcanzados reutilizan la misma ilustración en gris.

`;
for (const screen of screens) {
  md += `## ${screen}\n\n| Archivo | Formato | Dónde aparece |\n|---|---|---|\n`;
  for (const [name, v] of entries.filter(([, v]) => v.screen === screen)) md += `| \`${name}\` | ${size(v.ratio)} | ${v.where} |\n`;
  md += "\n";
}
writeFileSync("ILUSTRACIONES.md", md);

/* --- PROMPTS-NANO-BANANA.md: 10 generaciones gratis en la web de Gemini --- */
const wides = entries.filter(([, v]) => v.ratio === "wide").map(([n]) => n);
let prompts = `# Ilustraciones gratis con la web de Gemini

En vez de 29 imágenes, **${GRIDS.length + wides.length} generaciones**: ${GRIDS.length} lotes de 4 en cuadrícula 2×2 y ${wides.length} panorámicas sueltas.
Un script recorta los lotes, centra cada ilustración y la pasa a SVG.

## Pasos

1. Abre https://gemini.google.com (gratis) y elige el modelo de imagen (Nano Banana).
2. En cada mensaje **adjunta** las dos imágenes de \`illustrations-src/_referencia/\` y pega el prompt.
   Un prompt por mensaje. Si ya las generaste en ese chat, no hace falta volver a adjuntarlas.
3. Descarga cada imagen con el nombre indicado:
   - lotes → \`illustrations-src/_lotes/lote-1.png\` … \`lote-${GRIDS.length}.png\`
   - panorámicas → \`illustrations-src/<nombre>.png\`
4. Cuando tengas todas (o las que sea), ejecuta una sola vez:

\`\`\`bash
npm run split
\`\`\`

Si una sale mal, regenera solo ese lote o esa imagen y vuelve a ejecutar \`npm run split\`.

`;
GRIDS.forEach((names, i) => {
  prompts += `## lote-${i + 1} → ${names.join(", ")}\n\n\`\`\`\n${gridPrompt(names)}\n\`\`\`\n\n`;
});
for (const n of wides) {
  prompts += `## ${n} (panorámica 16:9, suelta) → \`illustrations-src/${n}.png\`\n\n\`\`\`\n${fullPrompt(n)}\n\`\`\`\n\n`;
}
writeFileSync("PROMPTS-NANO-BANANA.md", prompts);
console.log(`ILUSTRACIONES.md y PROMPTS-NANO-BANANA.md · ${entries.length} ilustraciones`);
