# ROADMAP DEL PROYECTO
*Marcar con [x] lo completado, [~] en progreso, [ ] pendiente.*

## 🚀 Funcionalidades Principales
- [x] Cabina educativa de navegador con dos decks, demos y audio local, EQ, pitch, SYNC/CUE y crossfader; se puede practicar sin cuenta ni backend.
- [x] Análisis FFT por bandas y BPM, evaluación de beatmatch por tempo/fase, coaching direccional de pitch/jog y MIDI learn para audio demo/local.
- [x] Biblioteca de metadatos con importación/exportación JSON validada, sin incluir archivos de audio.
- [x] Se retiró la integración y toda la interfaz de reproducción de YouTube. La app ofrece demos, cuatro MP3 incluidos en `tests/` (001/002 precargados en Deck A/B) y archivos locales proporcionados por el usuario; cualquier pista incluida puede cargarse en ambos decks.
- [x] Mezclas automáticas educativas (v1): guía paso a paso en el centro de la cabina (verificar, igualar tempo, alinear fase, preparar, crossfade automático) usando solo audio local/demo.
- [x] Clase práctica de beatmatching, separada de la mezcla automática: el usuario ajusta tempo y fase con controles de pitch/JOG, prepara EQ y hace el crossfade manualmente. Verificada de principio a fin con demos locales; JOG B permite correcciones de ±25 ms.
- [~] Gauntlet visual/funcional frente a VirtualDJ: progreso y evidencia en `GAUNTLET_PROGRESS.md`. La primera pareja de capturas (1280×900) no es comparable: muestra la cabina de DJ Lab y la web promocional de VirtualDJ; crítico independiente no declara ganador. Criterio de éxito: comparar las interfaces reales en estados/tarea equivalentes, con revisión a ciegas, y continuar iterando hasta que DJ Lab gane.
- [ ] Futuro (piano MIDI): soportar conexión del piano MIDI Arturia KeyLab Mini MK3 y crear una sección "aprender a tocar temas con el piano" (el usuario dispone del piano en casa). El controlador MIDI genérico queda pospuesto por no contar con el hardware. Criterio: detección WebMIDI del KeyLab, mapeo de teclas y guía de práctica por tema, sin descargar audio de YouTube.

## 🧭 Producto educativo open source (backlog aceptado)
- [x] **A — Inicio índice/portal (v1):** el inicio predeterminado presenta un índice con acceso a Cabina, Beatmatching, Biblioteca local y las herramientas de mezcla; Explorar sigue identificada como planificada. La cabina sigue disponible como sección y conserva su DOM e interacciones. Smoke test cubre portal, navegación y etiquetas de estado.
- [x] **B — Aprender y practicar (ampliación):** ruta progresiva de cuatro lecciones (pulso/4/4, compás/frase, BPM/pitch, tonalidad/Camelot) con explicación y pregunta de comprobación con feedback; el progreso se guarda solo en el dispositivo y la clase guiada de beatmatching sigue separada de la cabina libre. Smoke test cubre respuestas correctas/incorrectas, progreso, persistencia y reinicio.
- [x] **C — Biblioteca y sets (ampliación):** biblioteca local de metadatos con importación/exportación JSON; búsqueda instantánea sin distinguir mayúsculas por nombre, artista, fuente, BPM y etiquetas; filtros dedicados por fuente, estado de BPM y etiqueta; edición de etiquetas separadas por comas, persistidas localmente; crates/setlists locales para planificar un set con añadir, reordenar, quitar y persistencia de IDs + metadatos solo en localStorage; planificación por BPM con rango, aviso de saltos >8 BPM y orden ascendente/descendente persistido. Verificado por smoke. No subir audio.
- [x] **D — Herramientas para DJs:** calculadora educativa de pitch para igualar BPM, rueda Camelot de compatibilidad armónica y conteo de compases/frases, con explicaciones y validación (20–400 BPM, 1–64 compases); smoke de navegador cubre resultados, límites y cambios de tonalidad. Se pueden añadir más utilidades en el futuro sin reabrir el alcance base.
- [x] **E — Recursos y exploración:** sección Explorar con seis rutas curadas por nivel (fundamentos, oído, técnica, armonía, preparación, energía) y tema; cada tarjeta enlaza a una práctica o herramienta interna. Sin enlaces externos ni dependencias para las funciones centrales. Smoke test cubre la sección y que todos los enlaces sean internos.
- [x] Registrar benchmark funcional de 20 referencias y el alcance open source/local-first en `COMPETITIVE_RESEARCH.md`.
- [x] Investigación de análisis local opcional de BPM/tonalidad/energía registrada en `ANALISIS_LOCAL.md`: estado actual, límites, propuesta (procedencia/confianza del BPM, croma + perfiles Krumhansl, energía relativa por set), licencias y criterios de aceptación. La implementación queda fuera de esta iteración.
- [x] **Análisis local · fase 1:** BPM editable con procedencia (`manual`/`estimate`) y confianza heurística; el BPM manual persiste y las estimaciones offline/en vivo no lo sobrescriben; la UI marca `≈` y conserva ambos campos en importación/exportación. Cubierto por `./smoke.sh`. Pendiente: tonalidad por croma y energía relativa por set.

**Principio de alcance:** aprender de funciones y flujos públicamente observables para construir alternativas independientes; no copiar código, marca o activos protegidos ni eludir suscripciones/controles de acceso. Las funciones centrales de DJ Lab no deben depender de suscripciones de terceros. No descargar ni enrutar audio de YouTube.

## 🛠️ Deuda Técnica y Mantenimiento (Tareas [C])
- [x] Conservar el prompt reutilizable del Gauntlet Loop adaptado a DJ Lab, VirtualDJ y las reglas de AGENTS.md en `GAUNTLET_LOOP_PROMPT.md`.
- [x] Añadir una prueba automatizada de humo en navegador para carga, decks y consola: `smoke.sh` / `tests/smoke.mjs` (Playwright), verifica HTTP 200, decks, controles y consola sin errores propios.
- [x] Auditoría defensiva de accesos directos: guards y optional chaining en `setCrossfader`, `setPitch`, `syncDeck`, `checkMix` y los pasos de auto-mix; smoke sin errores.
- [x] Consolidar la documentación: los archivos de la raíz (`HANDOFF.md`, `todo.md`, `user-requests.md`, `roadmap/01-dj-lab.md`) apuntan a `00_cerebro_loop/` como fuente de verdad y el `README.md` describe el estado actual.
- [ ] Durante el Gauntlet, repetir capturas al mismo viewport y registrar por separado errores propios y advertencias de servicios externos.
- [x] Retirar la integración de YouTube y sus estilos, mensajes y referencias de inicialización.

## 🐛 Bugs Conocidos
- [x] Corregido: desbordamiento horizontal en la cabina móvil causado por la cabecera/acciones de Biblioteca a 390px. Verificado con humo a 390px y 320px y capturas visuales a 390px/1280px; no quedan otros bugs de preview concretos y reproducibles registrados.
