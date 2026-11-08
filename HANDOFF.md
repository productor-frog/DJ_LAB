# Handoff

## Estado
- Completado: selección y reproducción independiente de pistas de la playlist oficial de YouTube en Deck A y Deck B mediante reproductores oficiales; el audio sigue fuera del mixer.
- Plan ejecutado: añadir un reproductor oficial por deck, conectar los botones A/B, actualizar interfaz/documentación y verificar selección, proporción visual, estados, sintaxis y consola.
- DJ Lab es una app estática de HTML/CSS/JavaScript, sin backend ni dependencias de framework.
- Checkpoint funcional publicado en `origin/main`: `fa2ee7a` (`feat(youtube): play playlist tracks on each deck`).
- El audio del mixer se limita a demos generadas localmente y archivos que el usuario elige en su dispositivo. No se extrae, analiza ni enruta audio de YouTube.
- La API oficial de YouTube expone la playlist; cada botón A/B carga la pista en el reproductor oficial correspondiente, sin pedir archivos locales.

## Implementación
- Análisis FFT en vivo de bandas low/mid/high y estimación de BPM durante demos/audio local.
- Evaluación de beatmatch que combina diferencia de tempo y fase envuelta, con lectura explicativa.
- MIDI learn universal para notas y CC, transporte/mixer, jog relativo y asignaciones persistidas/resetables.
- Importación y exportación JSON versionada de metadatos de biblioteca, validada y limitada a 100 pistas y 1 MB por archivo. El audio local nunca se exporta.
- Documentación de usuario, checklist y roadmap actualizados.

## Verificación
- `node --check app.js` y `git diff --check` pasan.
- Chromium en `http://localhost:3002`: los dos iframes oficiales por deck mantienen proporción 16:9 (359×202 px); al seleccionar pistas distintas, los estados de A/B se actualizaron de forma independiente. Una pista de prueba no permitió incrustación y mostró el aviso esperado para abrirla en YouTube Music.
- `playwright-cli console error`: cero errores. Queda una advertencia de `postMessage` emitida por `www-widgetapi.vflset/www-widgetapi.js`: target `youtube-nocookie.com` frente al origen local `http://localhost:3002`; parece externa al código de la app y no impidió inicializar ni controlar los reproductores.
- Verificación final de esta tarea: `node --check app.js`, `git diff --check` y revisión del diff.
- Verificaciones previas conservadas: Chromium mostró BPM/bandas/beatmatch, WebMIDI simulado aprendió CC 22 canal 3 y la importación/exportación JSON validó metadatos sin incluir audio.
- `screenshots/baseline.jpg` es la captura compacta actualizada (ignorada por Git).

## Cierre y siguiente paso
- La instalación inicial del SOP está en `AGENTS.md`; `Agents.md` original se conserva sin cambios. Los tags `save-000` y `save-002` no se modificaron.
- Boot del 2026-11-08: leídos los cinco archivos de `00_cerebro_loop/`; `origin/opencode-checkpoints/4` se integró por fast-forward (solo metadatos de checkpoint) y luego se eliminó del remoto. No había ramas `opencode-resume/*` ni conflictos; `origin/main` ya estaba integrado.
- La app se sirvió en `http://127.0.0.1:3002/`, se cargó completa en Chromium y se probaron demos simultáneas en A y B: ambas aparecieron en la biblioteca. Cero errores de consola; `node --check app.js` y `git diff --check` pasan.
- La captura compacta de revisión está en `/tmp/opencode/dj-lab.jpg` (no se versiona).
- Se publicó el checkpoint de esta sesión a `main` por fast-forward y se creó el tag `save-003` tras la verificación. No se reescribieron tags preexistentes.
- Próximo paso: continuar con «Seguí el SOP en AGENTS.md». El censo de issues sigue pendiente de autenticación (`gh auth status`: sin sesión).
