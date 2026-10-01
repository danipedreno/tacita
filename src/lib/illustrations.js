/* Registro de ilustraciones: fuente única para la app, la generación y la documentación.
   - La app carga public/illustrations/<name>.svg; mientras falte, muestra un marcador.
   - `npm run illustrations` genera con Gemini las que falten y las vectoriza.
   - `npm run illustrations-doc` regenera ILUSTRACIONES.md y PROMPTS-NANO-BANANA.md.
   `fromSheet: true` = la escena ya existe en la hoja de referencia y se pide redibujarla. */

export const STYLE =
  "Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. One single scene only, one image, no grid, no sheet, centered, with at least 10% empty margin on all sides.";

export const ILLUSTRATIONS = {
  // Inicio
  bienvenida: { ratio: "wide", screen: "Inicio", where: "Tarjeta de bienvenida mientras no hay ningún test hecho.", fromSheet: true, scene: "group of five people walking left to right carrying folders. Wide horizontal composition" },
  "racha-activa": { ratio: "square", screen: "Inicio", where: "Tarjeta de racha cuando ya has estudiado hoy.", fromSheet: true, scene: "smiling man in a tie raising a burning torch with one fist up" },
  "racha-pendiente": { ratio: "square", screen: "Inicio", where: "Tarjeta de racha cuando estudiaste ayer pero aún no hoy.", fromSheet: true, scene: "man yawning next to a small candle with a tiny flame" },
  "racha-apagada": { ratio: "square", screen: "Inicio", where: "Tarjeta de racha sin racha o con la racha rota.", fromSheet: true, scene: "sad man sitting next to a blown-out candle with a curl of smoke" },
  instalar: { ratio: "square", screen: "Inicio", where: "Aviso para instalar la app en el móvil (Android).", fromSheet: true, scene: "man pushing a giant smartphone on a hand truck" },

  // Rangos (tarjeta de rango en Inicio, Resultado y escalafón en Logros)
  "rango-1-novato": { ratio: "square", screen: "Rangos", where: "Nivel 1 · Opositor Novato.", scene: "A young beginner candidate with an oversized backpack, hugging a pile of thick law books, determined but a bit overwhelmed." },
  "rango-2-practicas": { ratio: "square", screen: "Rangos", where: "Nivel 2 · Funcionario en Prácticas.", fromSheet: true, scene: "person holding a giant ring of keys" },
  "rango-3-jefe-servicio": { ratio: "square", screen: "Rangos", where: "Nivel 3 · Jefe de Servicio.", scene: "A prison shift supervisor in uniform holding a clipboard in one hand and a walkie-talkie in the other, confident commanding pose." },
  "rango-4-jefe-centro": { ratio: "square", screen: "Rangos", where: "Nivel 4 · Jefe de Centro.", scene: "A head of prison center in a suit sitting behind a desk with a rubber stamp, a desk telephone and tall stacks of case folders, busy but in control." },
  "rango-5-director": { ratio: "square", screen: "Rangos", where: "Nivel 5 · Director de Centro.", scene: "A prison director in a suit standing firm and tall, holding a flag on a pole, calm and proud like a monument." },
  ascenso: { ratio: "square", screen: "Resultado", where: "Resultado del test cuando subes de rango.", scene: "An officer in uniform smiling while a hand from the side pins a rank insignia onto their shoulder, a few small sparkle marks around." },

  // Test
  simulacro: { ratio: "wide", screen: "Test", where: "Cabecera de la configuración del simulacro.", fromSheet: true, scene: "man at a desk with a large wall clock behind him, redrawn as an exam candidate writing an exam at the desk. Wide horizontal composition" },
  entregar: { ratio: "square", screen: "Test", where: "Hoja de confirmación «¿Entregar el examen?».", fromSheet: true, scene: "man handing a folder over a counter to a woman behind it" },
  abandonar: { ratio: "square", screen: "Test", where: "Hoja de confirmación «¿Abandonar el examen?».", scene: "A person tiptoeing out through a half-open door, looking back over their shoulder sneakily." },
  "tiempo-agotado": { ratio: "square", screen: "Resultado", where: "Resultado cuando se acabó el tiempo.", fromSheet: true, scene: "man running away in panic from a ringing alarm clock" },
  "resultado-alto": { ratio: "square", screen: "Resultado", where: "Resultado con nota ≥ 7 sobre 10.", fromSheet: true, scene: "man jumping for joy with papers flying around him" },
  "resultado-medio": { ratio: "square", screen: "Resultado", where: "Resultado con nota entre 4 y 7.", scene: "A person balancing a tall wobbly pile of papers on one hand and shrugging with the other, 'almost there' expression." },
  "resultado-bajo": { ratio: "square", screen: "Resultado", where: "Resultado con nota < 4.", fromSheet: true, scene: "boy sitting cross-legged among scattered papers under a small rain cloud" },

  // Apuntes
  "apuntes-vacio": { ratio: "wide", screen: "Apuntes", where: "Cabecera de Apuntes antes de cargar texto.", fromSheet: true, scene: "woman carrying a tall stack of books on her head. Wide horizontal composition, figure centered" },
  "bloque-penitenciario": { ratio: "square", screen: "Apuntes", where: "Carpeta azul · Derecho Penitenciario.", fromSheet: true, scene: "heavy cell door with a barred peephole window, adding a prison officer holding keys standing next to it" },
  "bloque-penal": { ratio: "square", screen: "Apuntes", where: "Carpeta roja · Derecho Penal.", scene: "A person holding up a large scale of justice in one hand and a thick closed book under the other arm." },
  "bloque-funcion-publica": { ratio: "square", screen: "Apuntes", where: "Carpeta verde · Función Pública.", fromSheet: true, scene: "hand holding a rubber stamp, redrawn as a full civil servant behind a service window about to stamp a document" },
  procesando: { ratio: "square", screen: "Apuntes", where: "Mientras la IA genera el test.", scene: "A thoughtful woman with her hand on her chin, a thought bubble above her head containing small blank documents and a light bulb." },
  "test-listo": { ratio: "square", screen: "Apuntes", where: "Cuando el test generado está listo.", scene: "A person proudly holding up an exam sheet with one big check mark drawn on it." },

  // Logros
  "medalla-primer-turno": { ratio: "square", screen: "Logros", where: "Medalla Primer Turno.", scene: "A new prison officer in uniform turning a giant key in the lock of a heavy door, first day on the job, excited." },
  "medalla-celda-castigo": { ratio: "square", screen: "Logros", where: "Medalla Celda de Castigo.", fromSheet: true, scene: "man peeking out from behind prison cell bars" },
  "medalla-imbatible": { ratio: "square", screen: "Logros", where: "Medalla Imbatible.", scene: "A person in office clothes striking a superhero pose with a cape flowing behind them and a round shield on one arm." },
  "medalla-estudioso-nocturno": { ratio: "square", screen: "Logros", where: "Medalla Estudioso Nocturno.", scene: "A person reading a book at a desk under a desk lamp at night, a crescent moon and a small owl visible through the window behind." },
  // Lote 8 (Crea tu test, cajas de Tarjetas y medalla Madrugador)
  "todo-temario": { ratio: "square", lote: 8, screen: "Test", where: "Opción «Todo el temario» al crear un test.", scene: "A cheerful person carrying a tall stack of four thick binders in both arms, with an open cardboard archive box full of documents at their feet." },
  "caja-las-se": { ratio: "square", lote: 8, screen: "Tarjetas", where: "Caja «Las sé».", scene: "A smiling person dropping one more index card into an open cardboard box already full of neatly stacked cards, giving a thumbs up with the other hand." },
  "caja-no-las-se": { ratio: "square", lote: 8, screen: "Tarjetas", where: "Caja «No las sé».", scene: "A determined person sitting on an open cardboard box with a few loose index cards, holding one card up close and reading it carefully, a pencil behind the ear." },
  "medalla-madrugador": { ratio: "square", lote: 8, screen: "Logros", where: "Medalla Madrugador.", scene: "An early riser stretching happily at a desk with an open book and a steaming mug of coffee, a rising sun visible through the window behind." },
  // Lote 9 (estados vacíos, generación, día del examen y bloque de Conducta Humana)
  "todo-al-dia": { ratio: "square", lote: 9, screen: "Tarjetas", where: "Cuando no quedan tarjetas pendientes hoy.", scene: "A relaxed person leaning back in an office chair with feet up on the desk and hands behind the head, an empty in-tray and a neat tied stack of index cards on the desk." },
  "generando-preguntas": { ratio: "square", lote: 9, screen: "Test / Temario", where: "Mientras Gemini escribe preguntas nuevas.", scene: "A cheerful person typing energetically on a vintage typewriter while a stream of paper sheets flies out of it and swirls up into the air." },
  "dia-del-examen": { ratio: "square", lote: 9, screen: "Inicio", where: "Tarjeta «Tu examen» el mismo día del examen.", scene: "A confident young woman in smart clothes striding toward the entrance of an exam building, holding a pen and an ID card, raising a clenched fist of determination." },
  "bloque-conducta": { ratio: "square", lote: 9, screen: "Test / Tarjetas", where: "Baldosa del bloque Conducta Humana.", scene: "A calm psychologist seated in an armchair taking notes in a notebook while observing a person who talks and gestures expressively from a couch, a small potted plant beside them." },
  // Lotes 10 y 11: medallas por niveles (sustituyen a los iconos)
  "medalla-racha": { ratio: "square", lote: 10, screen: "Logros", where: "Medalla «En racha».", scene: "A determined person jogging forward while holding a burning torch high, a long trail of footprints behind them." },
  "medalla-meta": { ratio: "square", lote: 10, screen: "Logros", where: "Medalla «Meta cumplida».", scene: "An archer who has just hit the exact center of a round target with an arrow, raising both arms in celebration." },
  "medalla-respondidas": { ratio: "square", lote: 10, screen: "Logros", where: "Medalla «Fondo de armario».", scene: "A proud person patting a tall filing cabinet whose drawers are all open and stuffed with documents and folders." },
  "medalla-maraton": { ratio: "square", lote: 10, screen: "Logros", where: "Medalla «Maratón».", scene: "A tired but happy runner breaking through a finish line ribbon with arms wide open, holding a sheaf of papers in one hand." },
  "medalla-repaso": { ratio: "square", lote: 11, screen: "Logros", where: "Medalla «Sin cuentas pendientes».", scene: "A satisfied person with a giant pencil ticking off the last box on a long unrolled checklist scroll that reaches the floor, every box already ticked." },
  "medalla-tarjetero": { ratio: "square", lote: 11, screen: "Logros", where: "Medalla «Tarjetero».", scene: "A confident smiling person juggling many blank index cards in the air above their head." },
  "medalla-matricula": { ratio: "square", lote: 11, screen: "Logros", where: "Medalla «Matrícula».", scene: "A person in a graduation cap standing on the top step of a winners podium, holding a big trophy cup high above their head." },
  "medalla-especialista": { ratio: "square", lote: 11, screen: "Logros", where: "Medalla «Especialista».", scene: "A focused person looking through a large magnifying glass at a thick open law book resting on a lectern, a small scale of justice beside it." },
  reiniciar: { ratio: "square", screen: "Logros", where: "Hoja de confirmación «¿Reiniciar progreso?».", scene: "A person sweeping a messy pile of papers with a broom, clearing the floor." },
};

// Prompt individual: las escenas de la hoja se piden como redibujo.
for (const v of Object.values(ILLUSTRATIONS)) {
  v.prompt = v.fromSheet
    ? `Redraw only the ${v.scene} from the attached reference sheet as a single high-resolution image. Keep the same pose and design.`
    : v.scene;
}

export const fullPrompt = (name) => `${STYLE}\n\n${ILLUSTRATIONS[name].prompt}`;

/* Lotes para la web de Gemini (gratis): 4 ilustraciones cuadradas por imagen en cuadrícula 2×2.
   Las panorámicas (16:9) van sueltas. `npm run split` recorta cada lote en sus 4 ilustraciones. */
const POSITIONS = ["Top-left", "Top-right", "Bottom-left", "Bottom-right"];
// Las que llevan `lote` van en su propio lote fijo (añadidas después): así no se mueven los lotes ya hechos.
const squares = Object.keys(ILLUSTRATIONS).filter((n) => ILLUSTRATIONS[n].ratio === "square" && !ILLUSTRATIONS[n].lote);
export const GRIDS = [];
for (let i = 0; i < squares.length; i += 4) GRIDS.push(squares.slice(i, i + 4));
for (const [name, v] of Object.entries(ILLUSTRATIONS)) {
  if (!v.lote) continue;
  (GRIDS[v.lote - 1] ||= []).push(name);
}

export function gridPrompt(names) {
  if (names.length === 1) return fullPrompt(names[0]);
  const cells = names.map((n, i) => `${POSITIONS[i]}: ${ILLUSTRATIONS[n].scene.replace(/\.$/, "")}.`).join("\n");
  return `${STYLE.replace("One single scene only, one image, no grid, no sheet, centered, with at least 10% empty margin on all sides.", "")}

Square image arranged as a 2x2 grid of ${names.length} completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
${cells}`;
}
