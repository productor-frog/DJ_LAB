# Handoff

> **Documento histórico.** La fuente de verdad del proyecto está en
> [`00_cerebro_loop/`](00_cerebro_loop/), en especial `HANDOFF.md`,
> `ROADMAP.md`, `TODO.md`, `USER_REQUESTS.md` y `PROTOCOL.md`.
> Este archivo describía una etapa anterior con reproductores de YouTube que
> ya fueron retirados; no lo uses para planificar trabajo.

## Estado resumido

- DJ Lab es una app estática de HTML/CSS/JavaScript, sin backend ni framework.
- El audio analizable/mezclable procede de demos y de archivos locales
  autorizados (cuatro MP3 incluidos en `tests/`). No se descarga ni se enruta
  audio de YouTube.
- El producto incluye cabina con dos decks, clase guiada de beatmatching,
  biblioteca/crates, ruta de aprendizaje, herramientas de BPM/Camelot/fraseo
  y planificación de sets por BPM.
- Verificación: `./smoke.sh` (Playwright) cubre navegación, herramientas,
  biblioteca, sets, persistencia, responsive y consola sin errores propios.

## Próximo paso

Consulta la sección **PRÓXIMO PASO INMEDIATO** del handoff vigente en
[`00_cerebro_loop/HANDOFF.md`](00_cerebro_loop/HANDOFF.md).
