# Handoff

## Estado
- Implementación inicial completada en una app estática de HTML/CSS/JavaScript, sin backend ni dependencias de framework.
- `HEAD` parte de `126e8ce`, igual que `origin/main`; los cambios de la app están pendientes del checkpoint atómico.
- Se conservaron los scripts de captura/arranque proporcionados por el entorno; no forman parte de la implementación de la app.
- No se implementa extracción de streams ni bypass de CORS. La app admite demos generadas localmente y archivos que el usuario selecciona en su dispositivo.

## Verificación
- `node --check app.js` y `git diff --check` pasan.
- Verificación real en Chromium: demos y transporte, feedback de beatmatch, SYNC, pitch, EQ, volumen, crossfader y cue/play; biblioteca persistida y exportación JSON.
- Verificación reciente: Chromium mostró 127 pistas de YouTube; la API expuso el título de la pista actual. Se eligió `/tmp/opencode/djlab-test.wav` desde el botón A de esa pista y Deck A mostró `djlab-test` con duración de 1 s. El audio seleccionado fue local (URL `blob:`); no se conectó audio de YouTube al mixer.
- `playwright-cli console`: cero errores y advertencias en la prueba reciente. Se revisó visualmente la cabina y la lista: se mantienen los decks A/B, controles de mezcla y reproductor/lista de YouTube separados. Captura previa en `screenshots/dj-lab-final.png` (ignorada por Git).
- El servidor local de verificación está en `http://localhost:3002`.
- La playlist compartida conserva su reproductor incrustado y ahora consulta la lista de IDs y el título del elemento actual mediante la API oficial de YouTube IFrame Player. Los títulos se completan cuando YouTube los expone al reproducir las canciones; los botones A/B abren un selector de audio local para cargar al deck. El audio de YouTube nunca se conecta al mixer.
- La cola temporal de audios locales se mantiene asignable a Deck A/B; no se suben archivos.

## Decisiones y alcance diferido
- La demo autocontenida genera percusión en el navegador para permitir practicar sin cargar pistas.
- Los archivos seleccionados permanecen locales; solo se persisten metadatos de biblioteca, no se copian los archivos de audio.
- FFT/análisis por bandas y BPM estimado, evaluación rítmica detallada, mapeo MIDI extendido con jog wheel e importación JSON quedan anotados en `todo.md`.
