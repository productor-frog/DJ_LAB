## Process lifecycle

- Run long-lived servers and watchers in a persistent session such as tmux.
- Do not background them in bounded commands without explicit detachment and cleanup.
- After a timeout, inspect the process and endpoint before retrying or claiming failure.

## Linux browser and WebGPU capture

- Use the preinstalled `playwright-cli` executable from Actions or SSH.
- Use its headed Chromium, persistent Xvfb display, and SwiftShader configuration.
- Run `playwright-cli open http://localhost:3002` for the Pascal development server.
- Load a saved scene. Wait for actual geometry and the active WebGPU renderer.
- Run `playwright-cli screenshot --filename=screenshots/linux.png` after creating the output directory.
- Inspect the image. Reject loading screens, empty grids, and blank canvases.
- Report SwiftShader as CPU software rendering. Do not claim GPU hardware acceleration.
- Inspect `$HOME/.local/share/omgithub-playwright/linux.json` for launch settings.
- Use `playwright-cli --help` for commands and named sessions. Pass configuration only to `open`.

## SOP omgithub

- Before changing code, inspect `HANDOFF.md`, repository status, recent history, and the current task's context. Preserve existing user work.
- Keep changes scoped. Verify the app/build and inspect a current browser screenshot before marking the task done; fix failures before retrying (at most three rounds).
- A completed task gets one atomic commit/checkpoint. Never force-push. Only push a verified fast-forward; on conflicts, abort and report rather than resolving autonomously. Do not work on a red baseline.
- Record assumptions and deferred requests in `HANDOFF.md`/`todo.md`. Update visible behavior in `README.md`.
- Do not implement stream extraction, signature deciphering, CORS circumvention, or unauthorized source scraping. Support user-selected local audio instead.

── FIN DEL SOP ──
