# TODO Y BLOQUEOS
*Regla: máximo 3 intentos por ítem. Si falla 3 veces, se marca «REQUIERE HUMANO» y se salta.*

- [x] Completado: guía de mezclas automáticas educativas (v1) implementada y probada en navegador; usa solo audio local/demo y mantiene YouTube fuera del análisis/mixer.
- [x] Completado: clase práctica de beatmatching independiente de la guía automática; el usuario ajusta tempo, fase, EQ y crossfade manualmente. Smoke browser completado con demos, incluida verificación de JOG B ±25 ms.
- [ ] Bloqueado (0/3, evidencia): continuar el Gauntlet contra VirtualDJ (`https://www.virtualdj.com/`). La evidencia inicial y el veredicto no evaluable están en `GAUNTLET_PROGRESS.md`; falta una captura verificable de la interfaz de mezcla de VirtualDJ en una tarea/estado comparable. No priorizar una mejora del producto hasta obtenerla.
- [ ] Bloqueado (sin intento de código): censar issues abiertos; `gh auth status` indica que no hay sesión de GitHub autenticada. Reanudar solo cuando haya credenciales disponibles; no cerrar ni modificar issues sin inspeccionarlos.
- [ ] Pendiente (0/3): soporte de piano MIDI Arturia KeyLab Mini MK3 y sección "aprender a tocar temas con el piano" (WebMIDI, mapeo de teclas, guía de práctica). El controlador MIDI genérico queda pospuesto por no contar con el hardware. Mantener el audio de YouTube fuera de cualquier análisis/mezcla.
- [x] **A — Portal inicial v1:** implementado con navegación a Cabina, Beatmatching y Biblioteca local; las tarjetas de Herramientas DJ y Explorar, además de sus secciones de próximos pasos, están marcadas como planificadas. Verificado en `./smoke.sh`; quedan pendientes las áreas de producto B–E.
- [ ] **B — Aprender (ampliación):** completar una ruta progresiva desde cero y prácticas guiadas de fundamentos, fraseo, BPM y tonalidad. La práctica guiada de beatmatching existente cubre tempo, fase, EQ y crossfade manual.
- [x] **C — Búsqueda local v1:** buscar al instante por nombre, artista, fuente o BPM, con conteo de coincidencias y estado vacío; cobertura de nombre/artista/conteos/no resultados en `./smoke.sh`.
- [ ] **C — Biblioteca (ampliación):** añadir filtros dedicados, etiquetas, crates/playlists y planificación de setlists sobre metadatos locales; mantener el principio de no subir audio.
- [ ] **D — Herramientas DJ:** crear herramientas propias (p. ej., rueda Camelot, ayudas BPM y fraseo) con explicaciones educativas.
- [ ] **E — Explorar:** crear índice curado y clasificado de recursos de aprendizaje; enlaces externos opcionales, nunca dependencias de funciones centrales.
- [x] Investigación de 20 referencias y principios de implementación independiente, open source y local-first registrada en `COMPETITIVE_RESEARCH.md`.

No hay fallos de implementación pendientes ni tareas marcadas «REQUIERE HUMANO». La lista aceptada es backlog, no evidencia de que esas funciones ya existan.
