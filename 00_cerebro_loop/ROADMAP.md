# ROADMAP DEL PROYECTO
*Marcar con [x] lo completado, [~] en progreso, [ ] pendiente.*

## 🚀 Funcionalidades Principales
- [x] Cabina educativa de navegador con dos decks, demos y audio local, EQ, pitch, SYNC/CUE y crossfader; se puede practicar sin cuenta ni backend.
- [x] Análisis FFT por bandas y BPM, evaluación de beatmatch por tempo/fase, coaching direccional de pitch/jog y MIDI learn para audio demo/local.
- [x] Biblioteca de metadatos con importación/exportación JSON validada, sin incluir archivos de audio.
- [x] Se retiró la integración y toda la interfaz de reproducción de YouTube. La app solo ofrece demos y archivos de audio locales proporcionados por el usuario.
- [x] Mezclas automáticas educativas (v1): guía paso a paso en el centro de la cabina (verificar, igualar tempo, alinear fase, preparar, crossfade automático) usando solo audio local/demo.
- [x] Clase práctica de beatmatching, separada de la mezcla automática: el usuario ajusta tempo y fase con controles de pitch/JOG, prepara EQ y hace el crossfade manualmente. Verificada de principio a fin con demos locales; JOG B permite correcciones de ±25 ms.
- [~] Gauntlet visual/funcional frente a VirtualDJ: progreso y evidencia en `GAUNTLET_PROGRESS.md`. La primera pareja de capturas (1280×900) no es comparable: muestra la cabina de DJ Lab y la web promocional de VirtualDJ; crítico independiente no declara ganador. Criterio de éxito: comparar las interfaces reales en estados/tarea equivalentes, con revisión a ciegas, y continuar iterando hasta que DJ Lab gane.
- [ ] Futuro (piano MIDI): soportar conexión del piano MIDI Arturia KeyLab Mini MK3 y crear una sección "aprender a tocar temas con el piano" (el usuario dispone del piano en casa). El controlador MIDI genérico queda pospuesto por no contar con el hardware. Criterio: detección WebMIDI del KeyLab, mapeo de teclas y guía de práctica por tema, sin descargar audio de YouTube.

## 🛠️ Deuda Técnica y Mantenimiento (Tareas [C])
- [x] Conservar el prompt reutilizable del Gauntlet Loop adaptado a DJ Lab, VirtualDJ y las reglas de AGENTS.md en `GAUNTLET_LOOP_PROMPT.md`.
- [x] Añadir una prueba automatizada de humo en navegador para carga, decks y consola: `smoke.sh` / `tests/smoke.mjs` (Playwright), verifica HTTP 200, decks, controles y consola sin errores propios.
- [ ] Durante el Gauntlet, repetir capturas al mismo viewport y registrar por separado errores propios y advertencias de servicios externos.
- [x] Retirar la integración de YouTube y sus estilos, mensajes y referencias de inicialización.

## 🐛 Bugs Conocidos
- [x] No hay bugs propios reproducibles registrados.
