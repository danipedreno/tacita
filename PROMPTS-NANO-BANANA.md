# Ilustraciones gratis con la web de Gemini

En vez de 29 imágenes, **14 generaciones**: 11 lotes de 4 en cuadrícula 2×2 y 3 panorámicas sueltas.
Un script recorta los lotes, centra cada ilustración y la pasa a SVG.

## Pasos

1. Abre https://gemini.google.com (gratis) y elige el modelo de imagen (Nano Banana).
2. En cada mensaje **adjunta** las dos imágenes de `illustrations-src/_referencia/` y pega el prompt.
   Un prompt por mensaje. Si ya las generaste en ese chat, no hace falta volver a adjuntarlas.
3. Descarga cada imagen con el nombre indicado:
   - lotes → `illustrations-src/_lotes/lote-1.png` … `lote-11.png`
   - panorámicas → `illustrations-src/<nombre>.png`
4. Cuando tengas todas (o las que sea), ejecuta una sola vez:

```bash
npm run split
```

Si una sale mal, regenera solo ese lote o esa imagen y vuelve a ejecutar `npm run split`.

## lote-1 → racha-activa, racha-pendiente, racha-apagada, instalar

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: smiling man in a tie raising a burning torch with one fist up.
Top-right: man yawning next to a small candle with a tiny flame.
Bottom-left: sad man sitting next to a blown-out candle with a curl of smoke.
Bottom-right: man pushing a giant smartphone on a hand truck.
```

## lote-2 → rango-1-novato, rango-2-practicas, rango-3-jefe-servicio, rango-4-jefe-centro

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A young beginner candidate with an oversized backpack, hugging a pile of thick law books, determined but a bit overwhelmed.
Top-right: person holding a giant ring of keys.
Bottom-left: A prison shift supervisor in uniform holding a clipboard in one hand and a walkie-talkie in the other, confident commanding pose.
Bottom-right: A head of prison center in a suit sitting behind a desk with a rubber stamp, a desk telephone and tall stacks of case folders, busy but in control.
```

## lote-3 → rango-5-director, ascenso, entregar, abandonar

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A prison director in a suit standing firm and tall, holding a flag on a pole, calm and proud like a monument.
Top-right: An officer in uniform smiling while a hand from the side pins a rank insignia onto their shoulder, a few small sparkle marks around.
Bottom-left: man handing a folder over a counter to a woman behind it.
Bottom-right: A person tiptoeing out through a half-open door, looking back over their shoulder sneakily.
```

## lote-4 → tiempo-agotado, resultado-alto, resultado-medio, resultado-bajo

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: man running away in panic from a ringing alarm clock.
Top-right: man jumping for joy with papers flying around him.
Bottom-left: A person balancing a tall wobbly pile of papers on one hand and shrugging with the other, 'almost there' expression.
Bottom-right: boy sitting cross-legged among scattered papers under a small rain cloud.
```

## lote-5 → bloque-penitenciario, bloque-penal, bloque-funcion-publica, procesando

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: heavy cell door with a barred peephole window, adding a prison officer holding keys standing next to it.
Top-right: A person holding up a large scale of justice in one hand and a thick closed book under the other arm.
Bottom-left: hand holding a rubber stamp, redrawn as a full civil servant behind a service window about to stamp a document.
Bottom-right: A thoughtful woman with her hand on her chin, a thought bubble above her head containing small blank documents and a light bulb.
```

## lote-6 → test-listo, medalla-primer-turno, medalla-celda-castigo, medalla-imbatible

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A person proudly holding up an exam sheet with one big check mark drawn on it.
Top-right: A new prison officer in uniform turning a giant key in the lock of a heavy door, first day on the job, excited.
Bottom-left: man peeking out from behind prison cell bars.
Bottom-right: A person in office clothes striking a superhero pose with a cape flowing behind them and a round shield on one arm.
```

## lote-7 → medalla-estudioso-nocturno, reiniciar

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 2 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A person reading a book at a desk under a desk lamp at night, a crescent moon and a small owl visible through the window behind.
Top-right: A person sweeping a messy pile of papers with a broom, clearing the floor.
```

## lote-8 → todo-temario, caja-las-se, caja-no-las-se, medalla-madrugador

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A cheerful person carrying a tall stack of four thick binders in both arms, with an open cardboard archive box full of documents at their feet.
Top-right: A smiling person dropping one more index card into an open cardboard box already full of neatly stacked cards, giving a thumbs up with the other hand.
Bottom-left: A determined person sitting on an open cardboard box with a few loose index cards, holding one card up close and reading it carefully, a pencil behind the ear.
Bottom-right: An early riser stretching happily at a desk with an open book and a steaming mug of coffee, a rising sun visible through the window behind.
```

## lote-9 → todo-al-dia, generando-preguntas, dia-del-examen, bloque-conducta

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A relaxed person leaning back in an office chair with feet up on the desk and hands behind the head, an empty in-tray and a neat tied stack of index cards on the desk.
Top-right: A cheerful person typing energetically on a vintage typewriter while a stream of paper sheets flies out of it and swirls up into the air.
Bottom-left: A confident young woman in smart clothes striding toward the entrance of an exam building, holding a pen and an ID card, raising a clenched fist of determination.
Bottom-right: A calm psychologist seated in an armchair taking notes in a notebook while observing a person who talks and gestures expressively from a couch, a small potted plant beside them.
```

## lote-10 → medalla-racha, medalla-meta, medalla-respondidas, medalla-maraton

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A determined person jogging forward while holding a burning torch high, a long trail of footprints behind them.
Top-right: An archer who has just hit the exact center of a round target with an arrow, raising both arms in celebration.
Bottom-left: A proud person patting a tall filing cabinet whose drawers are all open and stuffed with documents and folders.
Bottom-right: A tired but happy runner breaking through a finish line ribbon with arms wide open, holding a sheaf of papers in one hand.
```

## lote-11 → medalla-repaso, medalla-tarjetero, medalla-matricula, medalla-especialista

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. 

Square image arranged as a 2x2 grid of 4 completely separate illustrations, one per quadrant, each centered in its quadrant with wide empty space around it. No borders, no dividing lines, no frames between them, and nothing crossing into another quadrant. Where a scene mentions the reference sheet, redraw that figure from the attached sheet.
Top-left: A satisfied person with a giant pencil ticking off the last box on a long unrolled checklist scroll that reaches the floor, every box already ticked.
Top-right: A confident smiling person juggling many blank index cards in the air above their head.
Bottom-left: A person in a graduation cap standing on the top step of a winners podium, holding a big trophy cup high above their head.
Bottom-right: A focused person looking through a large magnifying glass at a thick open law book resting on a lectern, a small scale of justice beside it.
```

## bienvenida (panorámica 16:9, suelta) → `illustrations-src/bienvenida.png`

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. One single scene only, one image, no grid, no sheet, centered, with at least 10% empty margin on all sides.

Redraw only the group of five people walking left to right carrying folders. Wide horizontal composition from the attached reference sheet as a single high-resolution image. Keep the same pose and design.
```

## simulacro (panorámica 16:9, suelta) → `illustrations-src/simulacro.png`

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. One single scene only, one image, no grid, no sheet, centered, with at least 10% empty margin on all sides.

Redraw only the man at a desk with a large wall clock behind him, redrawn as an exam candidate writing an exam at the desk. Wide horizontal composition from the attached reference sheet as a single high-resolution image. Keep the same pose and design.
```

## apuntes-vacio (panorámica 16:9, suelta) → `illustrations-src/apuntes-vacio.png`

```
Clean black ink line illustration in the same style as the attached reference images: modern editorial line art, simplified but realistic human proportions, people in office clothes or prison-officer uniforms, confident even line weight, solid flat black fills on hair, ties, trousers and shoes, minimal facial features with expressive poses. Strictly black ink only, no gray, no color, no hatching-heavy shading. Plain flat off-white background #FDFAF7. Absolutely no text, letters or numbers anywhere, including on books, signs and papers. One single scene only, one image, no grid, no sheet, centered, with at least 10% empty margin on all sides.

Redraw only the woman carrying a tall stack of books on her head. Wide horizontal composition, figure centered from the attached reference sheet as a single high-resolution image. Keep the same pose and design.
```

