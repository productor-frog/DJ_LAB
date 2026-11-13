# DJ_LAB

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Remixed using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/productor-frog/DJ_LAB)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/productor-frog/DJ_LAB)

- 🎮 [Open the project](https://go.ondev.store/productor-frog/DJ_LAB).
- ✨ [Remix this project](https://go.ondev.store/productor-frog/DJ_LAB?remix=1).
- 💻 [Explore the source](https://github.com/productor-frog/DJ_LAB).
- 🛠️ [Check build runs](https://github.com/productor-frog/DJ_LAB/actions).
- 🐛 [Report an issue](https://github.com/productor-frog/DJ_LAB/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/productor-frog).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
- 🧬 [Explore the remix source](https://github.com/productor-frog/DJ_LAB).
<!-- omgithub:readme:end -->

## DJ Lab

A small, browser-only DJ practice console built with vanilla HTML, CSS, and JavaScript. No build step or account is required.

### Run it

Serve this folder with any static HTTP server, then open the local URL in a modern browser. For example:

```sh
python3 -m http.server 3002
```

Open <http://localhost:3002>.

### Practice

- Start the generated **DEMO** on either deck to hear a loop without selecting a file.
- Use **CARGAR** to play an audio file from your device; audio stays in the browser and is not uploaded.
- Adjust each deck's three-band EQ, channel volume, and pitch. Use **SYNC** to match tempo/position, **CUE** to return to the start, and the center crossfader to balance decks.
- Press **COMPROBAR MEZCLA** for beatmatch feedback based on tempo difference and wrapped beat phase. When Deck B needs correction, the coach tells you whether to raise/lower its pitch or nudge its jog forward/back; Deck A stays the reference. Local/demo playback also shows live low/mid/high frequency levels and an offline BPM estimate.
- The MIDI panel supports universal learn for note and CC messages across transport, mixer controls, and relative jog nudging. Assignments are saved in this browser and can be reset; WebMIDI availability depends on the browser and device.
- Demo/local track metadata is kept in browser storage. **EXPORTAR** downloads versioned JSON metadata and **IMPORTAR** validates compatible files (up to 100 tracks/1 MB); audio files themselves are never included, and locally selected files must be selected again after a reload.
- **MEZCLA TU PLAYLIST AQUÍ** lets you add multiple audio files from your device, then load each one into Deck A or Deck B. The file queue is temporary for the current browser session; selected files are not uploaded and must be added again after a reload.
- DJ Lab has no YouTube playback or playlist UI. Use authorized demos or audio files you provide locally; no audio is downloaded from YouTube.

The current lesson is a playable browser-only baseline. The completed analysis, beatmatch scoring, MIDI mapping, and validated library import/export checklist is in `todo.md`.
