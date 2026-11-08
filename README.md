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
- Press **COMPROBAR MEZCLA** for the introductory beatmatch feedback. The MIDI button offers optional WebMIDI support where the browser and device allow it.
- Demo/local track metadata is kept in browser storage. **EXPORTAR** downloads that metadata as JSON; audio files themselves are not copied, and locally selected files must be selected again after a reload.
- The shared YouTube Music playlist opens in a new tab. DJ Lab does not import or stream playlist tracks; use **CARGAR** for audio files available on your device.

The current lesson is a first playable baseline. Detailed FFT/BPM analysis, expanded rhythm scoring and MIDI mapping, plus JSON import are deferred in `todo.md`.
