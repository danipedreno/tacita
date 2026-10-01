# Ilustraciones de Recuento

Total: **45 ilustraciones**, en line art editorial de tinta negra.

## Cómo se generan

```bash
npm run illustrations          # genera con Gemini las que falten y las vectoriza a SVG
npm run illustrations ascenso  # regenera solo esa (útil si no te gusta el resultado)
```

- Los PNG originales quedan en `illustrations-src/`; los SVG finales en `public/illustrations/`.
- Las imágenes de `illustrations-src/_referencia/` se envían a Gemini como referencia de estilo.
  Cuando una ilustración te guste mucho, cópiala ahí para que las siguientes se parezcan más.
- Gratis en la web de Gemini, por lotes de 4: ver PROMPTS-NANO-BANANA.md y `npm run split`.
- Medallas bloqueadas y rangos no alcanzados reutilizan la misma ilustración en gris.

## Inicio

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `bienvenida` | 16:9 | Tarjeta de bienvenida mientras no hay ningún test hecho. |
| `racha-activa` | 1:1 | Tarjeta de racha cuando ya has estudiado hoy. |
| `racha-pendiente` | 1:1 | Tarjeta de racha cuando estudiaste ayer pero aún no hoy. |
| `racha-apagada` | 1:1 | Tarjeta de racha sin racha o con la racha rota. |
| `instalar` | 1:1 | Aviso para instalar la app en el móvil (Android). |
| `dia-del-examen` | 1:1 | Tarjeta «Tu examen» el mismo día del examen. |

## Rangos

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `rango-1-novato` | 1:1 | Nivel 1 · Opositor Novato. |
| `rango-2-practicas` | 1:1 | Nivel 2 · Funcionario en Prácticas. |
| `rango-3-jefe-servicio` | 1:1 | Nivel 3 · Jefe de Servicio. |
| `rango-4-jefe-centro` | 1:1 | Nivel 4 · Jefe de Centro. |
| `rango-5-director` | 1:1 | Nivel 5 · Director de Centro. |

## Resultado

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `ascenso` | 1:1 | Resultado del test cuando subes de rango. |
| `tiempo-agotado` | 1:1 | Resultado cuando se acabó el tiempo. |
| `resultado-alto` | 1:1 | Resultado con nota ≥ 7 sobre 10. |
| `resultado-medio` | 1:1 | Resultado con nota entre 4 y 7. |
| `resultado-bajo` | 1:1 | Resultado con nota < 4. |

## Test

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `simulacro` | 16:9 | Cabecera de la configuración del simulacro. |
| `entregar` | 1:1 | Hoja de confirmación «¿Entregar el examen?». |
| `abandonar` | 1:1 | Hoja de confirmación «¿Abandonar el examen?». |
| `todo-temario` | 1:1 | Opción «Todo el temario» al crear un test. |

## Apuntes

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `apuntes-vacio` | 16:9 | Cabecera de Apuntes antes de cargar texto. |
| `bloque-penitenciario` | 1:1 | Carpeta azul · Derecho Penitenciario. |
| `bloque-penal` | 1:1 | Carpeta roja · Derecho Penal. |
| `bloque-funcion-publica` | 1:1 | Carpeta verde · Función Pública. |
| `procesando` | 1:1 | Mientras la IA genera el test. |
| `test-listo` | 1:1 | Cuando el test generado está listo. |

## Logros

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `medalla-primer-turno` | 1:1 | Medalla Primer Turno. |
| `medalla-celda-castigo` | 1:1 | Medalla Celda de Castigo. |
| `medalla-imbatible` | 1:1 | Medalla Imbatible. |
| `medalla-estudioso-nocturno` | 1:1 | Medalla Estudioso Nocturno. |
| `medalla-madrugador` | 1:1 | Medalla Madrugador. |
| `medalla-racha` | 1:1 | Medalla «En racha». |
| `medalla-meta` | 1:1 | Medalla «Meta cumplida». |
| `medalla-respondidas` | 1:1 | Medalla «Fondo de armario». |
| `medalla-maraton` | 1:1 | Medalla «Maratón». |
| `medalla-repaso` | 1:1 | Medalla «Sin cuentas pendientes». |
| `medalla-tarjetero` | 1:1 | Medalla «Tarjetero». |
| `medalla-matricula` | 1:1 | Medalla «Matrícula». |
| `medalla-especialista` | 1:1 | Medalla «Especialista». |
| `reiniciar` | 1:1 | Hoja de confirmación «¿Reiniciar progreso?». |

## Tarjetas

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `caja-las-se` | 1:1 | Caja «Las sé». |
| `caja-no-las-se` | 1:1 | Caja «No las sé». |
| `todo-al-dia` | 1:1 | Cuando no quedan tarjetas pendientes hoy. |

## Test / Temario

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `generando-preguntas` | 1:1 | Mientras Gemini escribe preguntas nuevas. |

## Test / Tarjetas

| Archivo | Formato | Dónde aparece |
|---|---|---|
| `bloque-conducta` | 1:1 | Baldosa del bloque Conducta Humana. |

