# Tacita

Tutor para la oposición de **Subalterno del Ayuntamiento de Cádiz (2026)**. PWA para móvil y escritorio.

- **Aprende**: camino tipo Duolingo con 121 lecciones en 15 temas (teoría, test, verdadero/falso, huecos, parejas y ordenar). Lo que fallas se repite al final de la lección. Cada tema termina con su examen.
- **Tutor** (Inicio): te dice qué toca ahora: tarjetas vencidas, fallos, examen de tema, la siguiente lección o un tema flojo. Además, misiones diarias.
- **Test**: más de 1.100 preguntas (tests de la academia, exámenes reales de otros ayuntamientos y preguntas de las lecciones), simulacro de 50, casos prácticos con su supuesto, penalización configurable.
- **Tarjetas**: 343 tarjetas con repetición espaciada (1, 3, 7, 14 y 30 días).
- **Apuntes**: la teoría de cada tema seguida, para releer.
- En escritorio: barra lateral y atajos de teclado (1-4 para responder, Intro para seguir; en tarjetas, espacio y 1/2/3).

## Contenido privado

El material es de la academia (Clases de Ángel) y **no se sube al repositorio**. Todo vive en `contenido/` (ignorado por Git):

- `contenido/temas/*.mjs`: lecciones y tarjetas de cada tema.
- `contenido/fuentes/`: preguntas de los tests con su respuesta correcta.
- `contenido/CREDENCIALES.txt`: usuario y contraseña de la app.

`npm run banco` lo monta todo y lo cifra en `public/banco.enc` (AES-256-GCM, clave derivada del usuario y la contraseña). Solo ese archivo cifrado se publica.

## Desarrollo

```bash
npm install
npm run banco
npm run dev
```

El progreso se guarda en el navegador de cada dispositivo (localStorage).
