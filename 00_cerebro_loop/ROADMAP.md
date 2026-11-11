# ROADMAP DEL PROYECTO
*Marcar con [x] lo completado, [~] en progreso, [ ] pendiente.*

## 🚀 Funcionalidades Principales
- [x] Cabina educativa de navegador con dos decks, demos y audio local, EQ, pitch, SYNC/CUE y crossfader; se puede practicar sin cuenta ni backend.
- [x] Análisis FFT por bandas y BPM, evaluación de beatmatch por tempo/fase, coaching direccional de pitch/jog y MIDI learn para audio demo/local.
- [x] Biblioteca de metadatos con importación/exportación JSON validada, sin incluir archivos de audio.
- [x] Selección y reproducción independiente de temas en los decks mediante los reproductores oficiales de YouTube; el audio de YouTube no entra al mixer ni se analiza.
- [x] Mezclas automáticas educativas (v1): guía paso a paso en el centro de la cabina (verificar, igualar tempo, alinear fase, preparar, crossfade automático) usando solo audio local/demo; nunca descarga, analiza ni enruta audio de YouTube. Criterio de éxito cumplido con demos y audio local.
- [~] Gauntlet visual/funcional frente a VirtualDJ: progreso y evidencia en `GAUNTLET_PROGRESS.md`. La primera pareja de capturas (1280×900) no es comparable: muestra la cabina de DJ Lab y la web promocional de VirtualDJ; crítico independiente no declara ganador. Criterio de éxito: comparar las interfaces reales en estados/tarea equivalentes, con revisión a ciegas, y continuar iterando hasta que DJ Lab gane.

## 🛠️ Deuda Técnica y Mantenimiento (Tareas [C])
- [x] Conservar el prompt reutilizable del Gauntlet Loop adaptado a DJ Lab, VirtualDJ y las reglas de AGENTS.md en `GAUNTLET_LOOP_PROMPT.md`.
- [x] Añadir una prueba automatizada de humo en navegador para carga, decks y consola: `smoke.sh` / `tests/smoke.mjs` (Playwright), verifica HTTP 200, decks, controles y consola sin errores propios.
- [ ] Durante el Gauntlet, repetir capturas al mismo viewport y registrar por separado errores propios y advertencias de servicios externos.
- [x] Investigar las advertencias actuales de la API de YouTube: se documentaron advertencias externas y no se encontraron errores propios reproducibles.

## 🐛 Bugs Conocidos
- [x] No hay bugs propios reproducibles registrados. Limitaciones conocidas del reproductor de YouTube: algunos videos no permiten inserción y el autoplay puede requerir interacción; están documentadas en `README.md`.
