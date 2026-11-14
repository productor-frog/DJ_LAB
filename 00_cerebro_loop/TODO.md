# TODO Y BLOQUEOS
*Regla: máximo 3 intentos por ítem. Si falla 3 veces, se marca «REQUIERE HUMANO» y se salta.*

- [x] Completado: guía de mezclas automáticas educativas (v1) implementada y probada en navegador; usa solo audio local/demo y mantiene YouTube fuera del análisis/mixer.
- [x] Completado: clase práctica de beatmatching independiente de la guía automática; el usuario ajusta tempo, fase, EQ y crossfade manualmente. Smoke browser completado con demos, incluida verificación de JOG B ±25 ms.
- [x] Corregido y verificado: desbordamiento horizontal de la cabina móvil; `./smoke.sh` comprueba 390px y 320px, y las capturas visuales confirman el layout a 390px y 1280px.
- [ ] Triage de otros bugs de preview: no hay otro reporte concreto reproducible en los registros revisados. Reanudar cuando se aporte URL/área, viewport y pasos para reproducir; no inventar defectos.
- [ ] Bloqueado (0/3, evidencia): continuar el Gauntlet contra VirtualDJ (`https://www.virtualdj.com/`). La evidencia inicial y el veredicto no evaluable están en `GAUNTLET_PROGRESS.md`; falta una captura verificable de la interfaz de mezcla de VirtualDJ en una tarea/estado comparable. No priorizar una mejora del producto hasta obtenerla.
- [ ] Bloqueado (sin intento de código): censar issues abiertos; `gh auth status` indica que no hay sesión de GitHub autenticada. Reanudar solo cuando haya credenciales disponibles; no cerrar ni modificar issues sin inspeccionarlos.
- [ ] Pendiente (0/3): soporte de piano MIDI Arturia KeyLab Mini MK3 y sección "aprender a tocar temas con el piano" (WebMIDI, mapeo de teclas, guía de práctica). El controlador MIDI genérico queda pospuesto por no contar con el hardware. Mantener el audio de YouTube fuera de cualquier análisis/mezcla.
- [x] **A — Portal inicial v1:** implementado con navegación a Cabina, Beatmatching, Biblioteca local y calculadora BPM; Explorar sigue marcado como planificado. Verificado en `./smoke.sh`; B y E siguen pendientes y D continúa en progreso.
- [x] **B — Aprender (ampliación):** ruta progresiva de cuatro lecciones con explicación y pregunta de comprobación (pulso/4/4, compás/frase, BPM/pitch, tonalidad/Camelot), feedback, progreso persistido y reinicio. La práctica guiada de beatmatching existente cubre tempo, fase, EQ y crossfade manual. Cubierto por `./smoke.sh`.
- [x] **C — Biblioteca local v1:** búsqueda por nombre, artista, fuente, BPM y etiquetas; filtros dedicados por fuente, estado de BPM y etiqueta; etiquetas por pista persistidas localmente; conteo, estado sin resultados y reinicio cubiertos por `./smoke.sh`.
- [x] **C — Crates y setlists locales:** creación, selección, validación de nombre duplicado, añadir/reordenar/quitar pistas, resumen con duración total y persistencia local de IDs + metadatos (sin guardar archivos de audio); cubierto por `./smoke.sh`.
- [x] **C — Planificación de sets (siguiente ampliación):** la colección activa muestra rango de BPM y aviso cuando un salto entre pistas consecutivas supera ±8 BPM; botones para ordenar por BPM ascendente o descendente (las pistas sin BPM quedan al final) con persistencia del orden. Cubierto por `./smoke.sh`.
- [x] **D — Herramientas DJ:** calculadora BPM (pitch estimado, validación y rango ±8%), rueda Camelot (24 tonalidades, relativa/vecina/salto de energía/cambio con riesgo) y conteo de compases/frases (1–64 compases, duración de compás y frase). Cubierto por `./smoke.sh`.
- [x] Completado: investigación de análisis local de BPM/tonalidad/energía documentada en `ANALISIS_LOCAL.md`, con límites, propuesta de procedencia/confianza y licencias; implementación pendiente.
- [x] Completado: auditoría defensiva de accesos a decks/DOM; optional chaining y guards en crossfader, pitch, sync, comprobación de mezcla y auto-mix. Smoke sin errores.
- [x] Completado: documentación raíz consolidada; `HANDOFF.md`, `todo.md`, `user-requests.md` y `roadmap/01-dj-lab.md` apuntan a `00_cerebro_loop/` y el `README.md` refleja el estado actual sin YouTube.
- [ ] **E — Explorar:** índice curado de seis rutas por nivel y tema enlazadas a las prácticas/herramientas internas; enlaces externos opcionales, nunca dependencias de funciones centrales. Cubierto por `./smoke.sh`.
- [x] Investigación de 20 referencias y principios de implementación independiente, open source y local-first registrada en `COMPETITIVE_RESEARCH.md`.

No hay fallos de implementación pendientes ni tareas marcadas «REQUIERE HUMANO». La lista aceptada es backlog, no evidencia de que esas funciones ya existan.
