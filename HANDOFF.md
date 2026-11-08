# Handoff

## Estado
- DJ Lab es una app estática de HTML/CSS/JavaScript, sin backend ni dependencias de framework.
- Rama de trabajo: `opencode/42488616157`; los cambios de esta tarea están pendientes de commit.
- El audio del mixer se limita a demos generadas localmente y archivos que el usuario elige en su dispositivo. No se extrae, analiza ni enruta audio de YouTube.
- La playlist de YouTube sigue separada en su reproductor incrustado; su API oficial expone IDs y títulos, y los botones A/B abren un selector de archivo local.

## Implementación
- Análisis FFT en vivo de bandas low/mid/high y estimación de BPM durante demos/audio local.
- Evaluación de beatmatch que combina diferencia de tempo y fase envuelta, con lectura explicativa.
- MIDI learn universal para notas y CC, transporte/mixer, jog relativo y asignaciones persistidas/resetables.
- Importación y exportación JSON versionada de metadatos de biblioteca, validada y limitada a 100 pistas y 1 MB por archivo. El audio local nunca se exporta.
- Documentación de usuario, checklist y roadmap actualizados.

## Verificación
- `node --check app.js` y `git diff --check` pasan.
- Chromium en `http://localhost:3002`: demos de Deck A/B, BPM (120.0/124.0), lecturas de bandas y feedback de fase/puntuación observados.
- WebMIDI simulado en Chromium: aprendió CC 22 canal 3 para volumen A, persistió el mapeo y el siguiente mensaje ajustó el fader.
- Importación de JSON válido mostró y persistió dos pistas demo/local; un archivo de versión no compatible fue rechazado sin alterar la biblioteca. La exportación descargada contenía versión/metadatos, sin audio.
- `playwright-cli console error`: cero errores y advertencias en la prueba.
- `screenshots/baseline.jpg` es la captura compacta actualizada (ignorada por Git).

## Pendiente operativo
- Revisar el diff, hacer un commit atómico y probar un push no forzado a `main` si los permisos/rama del entorno lo permiten.
- El censo de issues de GitHub no estuvo disponible porque `GH_TOKEN` no está configurado.
