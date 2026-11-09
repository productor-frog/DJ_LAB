# Gauntlet Loop Infinito — DJ Lab

Prompt de referencia para iniciar una sesión de trabajo autónomo. Pegalo en una sesión nueva y reemplazá la instrucción inicial por tus pedidos o por «Leé el ROADMAP y empezá por la siguiente tarea pendiente».

```text
Trabajá en DJ Lab de forma iterativa y autónoma hasta que te diga «pausa». Seguí AGENTS.md: si algo de este prompt difiere del SOP del repositorio, prevalece AGENTS.md.

INGESTA: si recibís una lista, registrá los pedidos en 00_cerebro_loop/USER_REQUESTS.md o descomponelos en tareas pequeñas en ROADMAP.md. No intentes resolver una lista entera en un único cambio.

En cada iteración elegí una tarea: [P0] base rota o errores propios reproducibles; [A] pedidos explícitos; [B] siguiente pendiente del ROADMAP; [C] mantenimiento; [D] mejoras pequeñas y verificables. No hagas cambios fuera del alcance de la tarea.

Para el Gauntlet, la referencia es VirtualDJ: https://www.virtualdj.com/. Obtené capturas reales de DJ Lab y VirtualDJ al mismo viewport y comparalas directamente. No inventes capturas, acceso, resultados ni defectos. Si una página no puede capturarse o compararse de forma válida, anotá el bloqueo y seguí solo con trabajo que sí pueda verificarse. Mantené 00_cerebro_loop/GAUNTLET_PROGRESS.md con viewport, fecha, evidencias, brechas, cambios y veredictos.

Dividí cada objetivo en piezas pequeñas. Para cada pieza, ejecutá en paralelo un subagente builder y otro crítico independiente, ambos con contexto fresco. El crítico debe revisar el resultado real y compararlo a ciegas (sin etiquetas de autor), elegir cuál es mejor y señalar la brecha principal. Si DJ Lab no gana, iterá; no conviertas una puntuación autodeclarada en aprobación.

Las mezclas educativas solo pueden analizar o mezclar demos, archivos locales elegidos por el usuario u otras fuentes con integración autorizada. El audio de YouTube puede reproducirse en sus reproductores oficiales independientes, pero nunca descargarse con yt-dlp, analizarse ni enrutarse al mixer.

Verificá cada cambio en navegador cuando sea pertinente; revisá consola y distinguí errores propios de advertencias externas. Ejecutá además las comprobaciones disponibles (por ejemplo, node --check app.js y git diff --check). No publiques cambios con errores propios sin resolver. Si la verificación falla, diagnosticá y reintentá según AGENTS.md; registra los bloqueos en TODO.md.

Al completar una tarea, actualizá el archivo de estado correspondiente, hacé un commit atómico y seguí el checkpoint fast-forward establecido en AGENTS.md. Nunca fuerces un push ni resuelvas conflictos manualmente. Respetá sus límites de reintentos, auto-pacing y cierre; reportá el estado con el formato de una línea definido allí.

INSTRUCCIÓN INICIAL: [PEGÁ AQUÍ LA LISTA DE PEDIDOS O INDICÁ LA SIGUIENTE TAREA DEL ROADMAP]
```
