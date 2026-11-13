(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'djlab-library-v1';
  const MIDI_MAP_KEY = 'djlab-midi-map-v1';
  const YOUTUBE_PLAYLIST_ID = 'PLSaUi107fadQ';
  const MIDI_TARGETS = ['play-a', 'play-b', 'cue-a', 'cue-b', 'sync-a', 'sync-b', 'volume-a', 'volume-b', 'pitch-a', 'pitch-b', 'eq-a-low', 'eq-a-mid', 'eq-a-high', 'eq-b-low', 'eq-b-mid', 'eq-b-high', 'crossfader', 'jog-a', 'jog-b'];
  const MIDI_LABELS = Object.fromEntries([...$('#midi-target-select')?.options || []].map(option => [option.value, option.textContent]));
  const TARGET_BPM = 120;
  const decks = {};
  const mixPlaylist = [];
  const youtubeTitles = new Map();
  const youtubeDeckPlayers = new Map();
  const youtubeDeckReady = new Set();
  const youtubeDeckVideos = new Map();
  let youtubePlayer;
  let audioContext;
  let crossPosition = 0.5;
  let toastTimer;
  let midiAccess;
  let midiLearnEnabled = false;
  let midiLearnTarget = null;
  let lastJogValue = new Map();
  const midiMap = loadMidiMap();
  const library = loadSavedLibrary();
  const midiButtonStates = new Map();

  function normalizeLibraryTrack(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.trim().length > 160) return null;
    const source = item.source;
    const kind = item.kind;
    if (!['Demo', 'Local'].includes(source) || !['demo', 'local'].includes(kind)) return null;
    if ((source === 'Demo') !== (kind === 'demo')) return null;
    const bpm = item.bpm == null ? null : Number(item.bpm);
    const duration = item.duration == null ? 0 : Number(item.duration);
    if ((bpm !== null && (!Number.isFinite(bpm) || bpm < 20 || bpm > 400)) || !Number.isFinite(duration) || duration < 0 || duration > 86400) return null;
    if (item.artist != null && (typeof item.artist !== 'string' || item.artist.length > 160)) return null;
    if (item.id != null && (typeof item.id !== 'string' || item.id.length > 100)) return null;
    return {
      id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: item.name.trim(), artist: item.artist || (kind === 'demo' ? 'DJ Lab' : 'Audio local'),
      bpm, duration, source, kind
    };
  }

  function loadSavedLibrary() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.map(normalizeLibraryTrack).filter(Boolean).slice(0, 100) : [];
    } catch { return []; }
  }

  function loadMidiMap() {
    try {
      const value = JSON.parse(localStorage.getItem(MIDI_MAP_KEY) || '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.fromEntries(Object.entries(value).filter(([target, mapping]) =>
        MIDI_TARGETS.includes(target) && mapping && ['note', 'cc'].includes(mapping.type) &&
        Number.isInteger(mapping.channel) && mapping.channel >= 0 && mapping.channel <= 15 &&
        Number.isInteger(mapping.number) && mapping.number >= 0 && mapping.number <= 127
      ).map(([target, mapping]) => [target, { type: mapping.type, channel: mapping.channel, number: mapping.number }]));
    } catch { return {}; }
  }

  function persistMidiMap() {
    try { localStorage.setItem(MIDI_MAP_KEY, JSON.stringify(midiMap)); }
    catch { toast('No se pudo guardar el mapa MIDI.'); }
  }

  function persistLibrary() {
    try {
      const compact = library.map(({ id, name, artist, bpm, duration, source, kind }) => ({ id, name, artist, bpm, duration, source, kind }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch { toast('No se pudo guardar la biblioteca en este navegador.'); }
  }

  function ensureAudio() {
    if (!audioContext) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('Este navegador no tiene Web Audio API.');
      audioContext = new Context({ latencyHint: 'interactive' });
      for (const id of ['a', 'b']) createDeck(id);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  function createDeck(id) {
    const audio = $(`#audio-${id}`);
    const source = audioContext.createMediaElementSource(audio);
    const low = audioContext.createBiquadFilter();
    const mid = audioContext.createBiquadFilter();
    const high = audioContext.createBiquadFilter();
    low.type = 'lowshelf'; low.frequency.value = 100;
    mid.type = 'peaking'; mid.frequency.value = 2500; mid.Q.value = 0.8;
    high.type = 'highshelf'; high.frequency.value = 12000;
    const volume = audioContext.createGain();
    const cross = audioContext.createGain();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(low).connect(mid).connect(high).connect(volume).connect(cross).connect(analyser).connect(audioContext.destination);
    decks[id] = {
      id, audio, source, filters: { low, mid, high }, volume, cross, analyser,
      data: new Uint8Array(analyser.frequencyBinCount), bpm: id === 'a' ? 120 : 124,
      baseBpm: id === 'a' ? 120 : 124, pitch: 0, objectUrl: null, trackName: '', artist: '',
      demo: false, cuePoint: 0, lastPhase: 0, beatHistory: [], beatCandidate: null,
      bandLevels: { low: 0, mid: 0, high: 0 }, estimatedBpm: null, bpmSamples: []
    };
  }

  function setCrossfader(value) {
    crossPosition = Number(value) / 100;
    const slider = $('#crossfader');
    if (slider) slider.value = value;
    if (!audioContext) return;
    // Equal-power curve: constant perceived loudness through the center.
    decks.a.cross.gain.setTargetAtTime(Math.cos(crossPosition * Math.PI / 2), audioContext.currentTime, 0.015);
    decks.b.cross.gain.setTargetAtTime(Math.sin(crossPosition * Math.PI / 2), audioContext.currentTime, 0.015);
  }

  function setPitch(id, value) {
    const deck = decks[id];
    if (!deck) return;
    deck.pitch = Number(value);
    const rate = 1 + deck.pitch / 100;
    deck.audio.playbackRate = rate;
    deck.bpm = deck.baseBpm * rate;
    $(`#pitch-label-${id}`).textContent = `${deck.pitch >= 0 ? '+' : ''}${deck.pitch.toFixed(1)}%`;
    $(`#pitch-read-${id}`).textContent = `${deck.pitch >= 0 ? '+' : ''}${deck.pitch.toFixed(1)}%`;
    $(`#bpm-read-${id}`).textContent = deck.bpm.toFixed(1);
    updatePhase();
  }

  function attachTrack(id, url, details) {
    ensureAudio();
    const deck = decks[id];
    if (!deck) return;
    if (deck.objectUrl && deck.objectUrl.startsWith('blob:')) URL.revokeObjectURL(deck.objectUrl);
    deck.objectUrl = url;
    deck.audio.pause();
    deck.audio.src = url;
    deck.audio.loop = Boolean(details.loop);
    deck.audio.onloadedmetadata = () => {
      if (!deck.demo) analyzeOfflineBpm(id);
    };
    deck.trackName = details.name;
    deck.artist = details.artist || (details.demo ? 'DJ Lab · demo generativa' : 'Archivo local · solo este dispositivo');
    deck.demo = Boolean(details.demo);
    deck.bpmSamples = [];
    deck.beatHistory = [];
    deck.beatCandidate = null;
    deck.estimatedBpm = deck.demo ? Number(details.bpm) || null : null;
    deck.baseBpm = Number(details.bpm) || (id === 'a' ? 120 : 124);
    deck.cuePoint = 0;
    setPitch(id, deck.pitch);
    $(`#track-${id}`).textContent = deck.trackName;
    $(`#artist-${id}`).textContent = deck.artist;
    $(`#wave-title-${id}`).textContent = deck.trackName.toUpperCase();
    setStatus('AUDIO PREPARADO');
    $(`#analysis-status-${id}`).textContent = deck.demo ? `DEMO · ${deck.estimatedBpm.toFixed(1)} BPM` : 'LOCAL · BPM POR ESTIMAR';
    addToLibrary({ ...details, name: deck.trackName, bpm: deck.baseBpm, source: details.demo ? 'Demo' : 'Local' });
    updateTransport(id);
  }

  function addToLibrary(track) {
    const existing = library.findIndex(item => item.name === track.name && item.source === track.source);
    const entry = normalizeLibraryTrack({
      id: track.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: track.name,
      artist: track.artist || (track.demo ? 'DJ Lab' : 'Audio local'),
      bpm: Number(track.bpm) || null,
      duration: Number(track.duration) || (track.demo ? 60 / (Number(track.bpm) || 120) * 16 : 0),
      source: track.source || (track.demo ? 'Demo' : 'Local'),
      kind: track.demo ? 'demo' : 'local'
    });
    if (!entry) return;
    if (existing >= 0) library[existing] = entry; else library.unshift(entry);
    library.splice(100);
    persistLibrary();
    renderLibrary();
  }

  function makeDemoWav(bpm, seed) {
    const sampleRate = 22050;
    const beat = 60 / bpm;
    const beatCount = 16;
    const length = Math.ceil(sampleRate * beat * beatCount);
    const samples = new Float32Array(length);
    let state = seed >>> 0;
    const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
    for (let b = 0; b < beatCount; b++) {
      const start = Math.floor(b * beat * sampleRate);
      const kickLength = Math.floor(sampleRate * 0.24);
      for (let i = 0; i < kickLength && start + i < length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 17);
        const freq = 43 + 75 * Math.exp(-t * 28);
        samples[start + i] += Math.sin(2 * Math.PI * freq * t) * env * 0.78;
      }
      if (b % 4 === 1 || b % 4 === 3) {
        const clapStart = start + Math.floor(sampleRate * beat * 0.12);
        for (let i = 0; i < sampleRate * 0.15 && clapStart + i < length; i++) {
          const t = i / sampleRate;
          samples[clapStart + i] += (random() * 2 - 1) * Math.exp(-t * 24) * 0.17;
        }
      }
      const hatStart = start + Math.floor(sampleRate * beat * 0.5);
      for (let i = 0; i < sampleRate * 0.045 && hatStart + i < length; i++) {
        const t = i / sampleRate;
        samples[hatStart + i] += (random() * 2 - 1) * Math.exp(-t * 75) * 0.08;
      }
    }
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const write = (offset, text) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    write(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); write(8, 'WAVE');
    write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
    return new Blob([buffer], { type: 'audio/wav' });
  }

  function startDemo(id) {
    const bpm = id === 'a' ? 120 : 124;
    const name = id === 'a' ? 'Neon pulse · 01' : 'Afterglow · 02';
    const blob = makeDemoWav(bpm, id === 'a' ? 17 : 29);
    attachTrack(id, URL.createObjectURL(blob), { name, artist: 'DJ Lab · demo generativa', bpm, duration: 60 / bpm * 16, demo: true, loop: true });
    playDeck(id);
    toast(`Demo ${id.toUpperCase()} lista · ${bpm} BPM`);
  }

  async function playDeck(id) {
    try {
      ensureAudio();
      const deck = decks[id];
      if (!deck?.audio?.src) { toast('Carga una pista o inicia la demo primero.'); return; }
      if (deck.audio.paused) await deck.audio.play(); else deck.audio.pause();
      updateTransport(id);
      setStatus(deck.audio.paused ? 'AUDIO PREPARADO' : 'REPRODUCIENDO');
      updatePhase();
    } catch (error) {
      toast(error.message || 'No se pudo iniciar el audio.');
    }
  }

  function updateTransport(id) {
    const button = $(`.play-button[data-deck="${id}"]`);
    if (!button) return;
    const playing = Boolean(decks[id]?.audio && !decks[id].audio.paused);
    button.textContent = playing ? 'Ⅱ' : '▶';
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', `${playing ? 'Pausar' : 'Reproducir'} Deck ${id.toUpperCase()}`);
  }

  function syncDeck(id) {
    ensureAudio();
    const deck = decks[id];
    if (!deck) return;
    const target = id === 'a' ? decks.b.bpm : decks.a.bpm;
    deck.pitch = Math.max(-8, Math.min(8, (target / deck.baseBpm - 1) * 100));
    $(`[data-pitch="${id}"]`).value = deck.pitch;
    setPitch(id, deck.pitch);
    if (decks.a.audio.src && decks.b.audio.src) {
      const master = decks.a.audio.currentTime || 0;
      deck.audio.currentTime = master;
    }
    toast(`Deck ${id.toUpperCase()} sincronizado a ${target.toFixed(1)} BPM`);
  }

  function cueDeck(id) {
    const deck = decks[id];
    if (!deck?.audio?.src) { toast('Carga una pista antes de marcar CUE.'); return; }
    deck.audio.pause();
    deck.audio.currentTime = deck.cuePoint;
    updateTransport(id);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function analyzeFrequencyBands(id, sampleRate) {
    const deck = decks[id];
    const bins = deck.data.length;
    const maxHz = sampleRate / 2;
    const ranges = { low: [40, 250], mid: [250, Math.min(4000, maxHz)], high: [Math.min(4000, maxHz - 1), maxHz] };
    for (const [name, [lo, hi]] of Object.entries(ranges)) {
      const start = Math.max(0, Math.floor(lo / maxHz * bins));
      const end = Math.max(start + 1, Math.min(bins, Math.floor(hi / maxHz * bins)));
      let energy = 0;
      for (let i = start; i < end; i++) energy += deck.data[i] / 255;
      deck.bandLevels[name] = energy / (end - start);
      $(`#band-${name}-${id}`).textContent = `${Math.round(deck.bandLevels[name] * 100)}%`;
    }
    if (deck.audio.currentTime > 0.08 && deck.audio.currentTime < (deck.audio.duration || Infinity) - 0.08) {
      const lowEnergy = deck.bandLevels.low;
      deck.bpmSamples.push({ time: deck.audio.currentTime, energy: lowEnergy });
      const cutoff = deck.audio.currentTime - 12;
      while (deck.bpmSamples.length && deck.bpmSamples[0].time < cutoff) deck.bpmSamples.shift();
      estimateBpmFromEnergy(id);
    }
  }

  async function analyzeOfflineBpm(id) {
    const deck = decks[id];
    const url = deck.objectUrl;
    if (!url || url.startsWith('https://') || !window.AudioContext && !window.webkitAudioContext) return;
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const audioBuffer = await response.arrayBuffer();
      if (deck.objectUrl !== url) return;
      const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineContext) return;
      const context = new OfflineContext(1, 1, 11025);
      const decoded = await context.decodeAudioData(audioBuffer);
      const samples = decoded.getChannelData(0);
      const sampleRate = decoded.sampleRate;
      const hop = 256;
      const energies = [];
      for (let start = 0; start + 1024 < samples.length; start += hop) {
        let energy = 0;
        for (let i = 0; i < 1024; i++) energy += samples[start + i] ** 2;
        energies.push(Math.sqrt(energy / 1024));
      }
      if (deck.objectUrl !== url || energies.length < 20) return;
      const mean = energies.reduce((sum, value) => sum + value, 0) / energies.length;
      const peaks = [];
      for (let i = 1; i < energies.length - 1; i++) {
        if (energies[i] > mean * 1.45 && energies[i] >= energies[i - 1] && energies[i] > energies[i + 1] && i - (peaks.at(-1)?.index || -Infinity) > Math.floor(sampleRate * 0.22 / hop)) peaks.push({ index: i, time: i * hop / sampleRate });
      }
      const intervals = peaks.slice(1).map((peak, i) => peak.time - peaks[i].time).filter(value => value > 0.28 && value < 1.5).sort((a, b) => a - b);
      if (intervals.length < 3) return;
      let bpm = 60 / intervals[Math.floor(intervals.length / 2)];
      if (bpm < 70) bpm *= 2; else if (bpm > 160) bpm /= 2;
      if (bpm >= 70 && bpm <= 160) {
        deck.estimatedBpm = bpm;
        deck.baseBpm = bpm;
        setPitch(id, deck.pitch);
        $(`#analysis-status-${id}`).textContent = `LOCAL · ≈${bpm.toFixed(1)} BPM`;
        const entry = library.find(track => track.name === deck.trackName && track.source === 'Local');
        if (entry) { entry.bpm = bpm; persistLibrary(); renderLibrary(); }
      }
    } catch { $(`#analysis-status-${id}`).textContent = 'LOCAL · BPM NO DISPONIBLE'; }
  }

  function estimateBpmFromEnergy(id) {
    const deck = decks[id];
    const samples = deck.bpmSamples;
    if (samples.length < 36) return;
    const mean = samples.reduce((sum, sample) => sum + sample.energy, 0) / samples.length;
    const variance = samples.reduce((sum, sample) => sum + (sample.energy - mean) ** 2, 0) / samples.length;
    if (variance < 0.00002) return;
    const threshold = mean + Math.sqrt(variance) * 0.7;
    const peaks = [];
    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i].energy > threshold && samples[i].energy >= samples[i - 1].energy && samples[i].energy > samples[i + 1].energy && samples[i].time - (peaks.at(-1)?.time || -Infinity) > 0.22) peaks.push(samples[i]);
    }
    if (peaks.length < 5) return;
    const intervals = peaks.slice(1).map((peak, i) => peak.time - peaks[i].time).filter(interval => interval > 0.28 && interval < 1.5).sort((a, b) => a - b);
    if (intervals.length < 4) return;
    const interval = intervals[Math.floor(intervals.length / 2)];
    const bpm = 60 / interval;
    const normalized = bpm < 70 ? bpm * 2 : bpm > 160 ? bpm / 2 : bpm;
    if (normalized >= 70 && normalized <= 160) {
      deck.estimatedBpm = normalized;
      $(`#analysis-status-${id}`).textContent = `LOCAL · ≈${normalized.toFixed(1)} BPM`;
    }
  }

  function renderWave(id) {
    const deck = decks[id];
    if (!deck) return;
    const canvas = $(`#wave-${id}`);
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 67;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
      canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0c1016'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#202630'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    const colors = ['#fa596d', '#72e294', '#57aef4'];
    const bands = [[0, 250], [250, 4000], [4000, 12000]];
    const sampleRate = audioContext?.sampleRate || 44100;
    const bins = deck.data.length;
    const maxHz = sampleRate / 2;
    const active = Boolean(deck.analyser && !deck.audio.paused && deck.audio.src && !deck.audio.src.startsWith('https://www.youtube'));
    if (active) {
      deck.analyser.getByteFrequencyData(deck.data);
      analyzeFrequencyBands(id, sampleRate);
    }
    const columns = Math.max(1, Math.floor(width / 3));
    const offset = deck.audio.currentTime ? Math.floor(deck.audio.currentTime * 14) % columns : 0;
    for (let x = 0; x < columns; x++) {
      const pos = (x + offset) % columns;
      let total = 0;
      for (let band = 0; band < bands.length; band++) {
        const [lo, hi] = bands[band];
        const start = Math.max(0, Math.floor(lo / maxHz * bins));
        const end = Math.max(start + 1, Math.min(bins, Math.floor(hi / maxHz * bins)));
        let energy = 0;
        if (active) {
          for (let i = start; i < end; i++) energy += deck.data[i];
          energy /= (end - start) * 255;
        } else {
          const wave = Math.sin((pos * 0.083) + band * 1.7 + (id === 'b' ? 0.8 : 0));
          energy = deck.audio.src ? 0.12 + Math.abs(wave) * 0.2 : 0.035;
        }
        const barHeight = Math.max(2, energy * height * 0.75);
        const alpha = active ? 0.42 + Math.min(0.55, energy) : 0.20;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = colors[band];
        const yOffset = band === 0 ? -1 : band === 1 ? 0 : 1;
        ctx.fillRect(pos * 3, (height - barHeight) / 2 + yOffset * 5, 2, barHeight);
        total += energy;
      }
      if (active && total > 0.14) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = id === 'a' ? '#54e3dc' : '#ff4e97';
        ctx.fillRect(pos * 3, 0, 1, height);
      }
    }
    ctx.globalAlpha = 1;
    const progress = deck.audio.duration ? deck.audio.currentTime / deck.audio.duration : 0;
    const playX = progress * width;
    ctx.fillStyle = id === 'a' ? '#dcfff9' : '#ffe0ed';
    ctx.shadowColor = id === 'a' ? '#54e3dc' : '#ff4e97'; ctx.shadowBlur = 7;
    ctx.fillRect(playX, 0, 1, height); ctx.shadowBlur = 0;
    $(`#time-${id}`).textContent = `${formatTime(deck.audio.currentTime || 0)} / ${formatTime(deck.audio.duration)}`;
  }

  function updatePhase() {
    if (!decks.a || !decks.b) return;
    const a = decks.a, b = decks.b;
    const beatsA = a.audio.currentTime * a.bpm / 60;
    const beatsB = b.audio.currentTime * b.bpm / 60;
    const phaseA = ((beatsA % 1) + 1) % 1;
    const phaseB = ((beatsB % 1) + 1) % 1;
    let delta = Math.abs(phaseA - phaseB) * 60000 / Math.max(a.bpm, 1);
    delta = Math.min(delta, 60000 / Math.max(a.bpm, 1) - delta);
    $('#phase-readout').textContent = a.audio.src && b.audio.src ? `FASE ${Math.round(delta)} MS` : 'FASE —';
  }

  function measurePhaseOffset(a, b) {
    const phaseA = ((a.audio.currentTime * a.bpm / 60) % 1 + 1) % 1;
    const phaseB = ((b.audio.currentTime * b.bpm / 60) % 1 + 1) % 1;
    const beatOffset = ((phaseB - phaseA + 1.5) % 1) - 0.5;
    return beatOffset * 60000 / Math.max(1, (a.bpm + b.bpm) / 2);
  }

  function checkMix() {
    ensureAudio();
    const a = decks.a, b = decks.b;
    const card = $('#score-card');
    if (!a.audio.src || !b.audio.src) {
      card.className = 'score-card bad'; $('#score-title').textContent = 'FALTAN PISTAS';
      $('#score-message').textContent = 'Carga o inicia las demos en ambos decks.'; $('#score-value').textContent = '—';
      return { ready: false, bpmDifference: Infinity, phaseDifference: Infinity };
    }
    const bpmDifference = Math.abs(a.bpm - b.bpm);
    const phaseOffset = measurePhaseOffset(a, b);
    const phaseDifference = Math.abs(phaseOffset);
    const result = bpmDifference <= 0.5 && phaseDifference < 30 ? 'PERFECT' :
      bpmDifference <= 2 && phaseDifference < 70 ? 'GOOD' : 'DESINCRONIZADO';
    card.className = `score-card ${result === 'PERFECT' ? 'good' : result === 'GOOD' ? '' : 'bad'}`;
    $('#score-title').textContent = result === 'DESINCRONIZADO' ? result : `${result} · BEATMATCH`;
    const tempoText = `${bpmDifference.toFixed(1)} BPM de diferencia`;
    const message = result === 'PERFECT'
      ? `Tempo alineado y fase estable (${tempoText}). ¡Mezcla limpia!`
      : [
          bpmDifference <= 0.5 ? 'Tempo alineado.' : b.bpm > a.bpm ? 'Deck B va más rápido: baja PITCH B.' : 'Deck B va más lento: sube PITCH B.',
          phaseDifference < 30 ? 'Fase suficientemente alineada.' : phaseOffset > 0 ? `Deck B va adelantado ${Math.round(phaseDifference)} ms: frena con JOG B.` : `Deck B va atrasado ${Math.round(phaseDifference)} ms: empuja con JOG B.`,
          `${tempoText}.`
        ].join(' ');
    $('#score-message').textContent = message;
    $('#score-value').textContent = `${Math.round(phaseDifference)} ms · ${bpmDifference.toFixed(1)} BPM`;
    $('#phase-readout').textContent = `FASE ${Math.round(phaseDifference)} MS`;
    return { ready: true, bpmDifference, phaseDifference, phaseOffset, result };
  }

  const autoMix = { active: false, step: 0, total: 5, timer: null, mode: 'auto' };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  function autoMixSetControls(active) {
    autoMix.active = active;
    $('#auto-mix-start').disabled = active;
    $('#lesson-practice-start').disabled = active;
    $('#auto-mix-next').disabled = !active;
    $('#auto-mix-stop').disabled = !active;
    if (!active) $('#lesson-jog-controls').hidden = true;
  }

  function setAutoMixStatus(title, description, progress) {
    $('#auto-mix-step-title').textContent = title;
    $('#auto-mix-description').textContent = description;
    $('#auto-mix-progress').textContent = progress;
  }

  function resetAutoMixEq(id) {
    for (const band of ['low', 'mid', 'high']) {
      const input = $(`[data-eq="${band}"][data-deck="${id}"]`);
      if (!input) continue;
      input.value = 0;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function autoMixSetVolume(id, value) {
    const input = $(`[data-volume="${id}"]`);
    if (input) { input.value = String(Math.round(value * 100)); input.dispatchEvent(new Event('input', { bubbles: true })); }
    setVolume(id, value);
  }

  function animateAutoMixCrossfade(from, to, duration) {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = now => {
        if (!autoMix.active) { resolve(); return; }
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * (3 - 2 * t);
        setCrossfader(Math.round(from + (to - from) * eased));
        if (t < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  async function runAutoMixStep(step) {
    if (!autoMix.active) return;
    const a = decks.a, b = decks.b;
    if (autoMix.mode === 'practice') $('#lesson-jog-controls').hidden = step !== 3;
    switch (step) {
      case 1:
        if (!a?.audio?.src || !b?.audio?.src) {
          toast('Carga o inicia las demos en ambos decks antes de la guía.');
          stopAutoMix();
          return;
        }
        setAutoMixStatus('PASO 1 · VERIFICAR', 'Ambos decks tienen audio local/demo. Preparando tempo.', 'Paso 1 / 5');
        break;
      case 2:
        if (autoMix.mode === 'practice') {
          setAutoMixStatus('PASO 2 · TEMPO', `Mueve PITCH B hasta acercar ambos decks a ${a.bpm.toFixed(1)} BPM. Luego comprueba: diferencia máxima 0.5 BPM.`, 'Paso 2 / 5');
        } else {
          setAutoMixStatus('PASO 2 · TEMPO', 'Igualando el BPM de Deck B al de Deck A (solo audio local/demo).', 'Paso 2 / 5');
          syncDeck('b');
          await delay(700);
        }
        break;
      case 3:
        if (autoMix.mode === 'practice') {
          setAutoMixStatus('PASO 3 · FASE', 'Escucha los golpes y alinea sus pulsos con JOG B ±25 ms. Comprueba cuando la fase esté dentro de 30 ms.', 'Paso 3 / 5');
          $('#lesson-jog-controls').hidden = false;
        } else {
          setAutoMixStatus('PASO 3 · FASE', 'Alineando el primer beat de Deck B con Deck A.', 'Paso 3 / 5');
          try {
            const offsetMs = measurePhaseOffset(a, b);
            nudgeDeck('b', -offsetMs / 1000);
          } catch (e) { /* defensivo */ }
          await delay(500);
        }
        break;
      case 4:
        if (autoMix.mode === 'practice') {
          setAutoMixStatus('PASO 4 · PREPARAR', 'Deja el crossfader hacia A y escucha la mezcla con la EQ en posición neutra (0 dB). Así preparas una entrada limpia.', 'Paso 4 / 5');
        } else {
          setAutoMixStatus('PASO 4 · PREPARAR', 'Crossfader a A, volúmenes y EQ neutros para la transición.', 'Paso 4 / 5');
          setCrossfader(0);
          autoMixSetVolume('a', 0.82);
          autoMixSetVolume('b', 0.78);
          resetAutoMixEq('a');
          resetAutoMixEq('b');
          await delay(600);
        }
        break;
      case 5:
        if (autoMix.mode === 'practice') {
          setAutoMixStatus('PASO 5 · CROSSFADE', 'Haz la transición a mano: desplaza el crossfader poco a poco hacia B mientras escuchas cómo cambia el balance.', 'Paso 5 / 5');
        } else {
          setAutoMixStatus('PASO 5 · CROSSFADE', 'Transición automática de A a B (crossfader).', 'Paso 5 / 5');
          await animateAutoMixCrossfade(0, 100, 9000);
          if (!autoMix.active) return;
          finishAutoMix('Mezcla automática finalizada. Comprueba el beatmatch.');
        }
        break;
      default:
        break;
    }
  }

  function beginMixGuide(mode) {
    ensureAudio();
    autoMix.mode = mode;
    autoMix.step = 1;
    autoMixSetControls(true);
    setAutoMixStatus('PASO 1 · VERIFICAR', mode === 'practice'
      ? 'Confirma que hay una pista local/demo en cada deck. Pulsa Play en ambos para escuchar y practicar.'
      : 'Iniciando guía de mezcla automática.', 'Paso 1 / 5');
    runAutoMixStep(1);
  }

  function startAutoMix() { beginMixGuide('auto'); }
  function startPracticeLesson() { beginMixGuide('practice'); }

  function finishAutoMix(message) {
    autoMix.active = false;
    autoMixSetControls(false);
    setAutoMixStatus('COMPLETADO', message, autoMix.mode === 'practice' ? 'Clase completada · 5 / 5' : 'Listo');
  }

  function nextAutoMixStep() {
    if (!autoMix.active) return;
    if (autoMix.mode === 'practice') {
      const score = checkMix();
      if (autoMix.step === 1 && (!decks.a.audio.src || !decks.b.audio.src)) {
        toast('Carga o inicia una demo en ambos decks para continuar.');
        return;
      }
      if (autoMix.step === 2 && (!score.ready || score.bpmDifference > 0.5)) {
        setAutoMixStatus('AJUSTA EL TEMPO', 'Usa PITCH B hasta que la diferencia sea de 0.5 BPM o menos; después vuelve a comprobar.', 'Paso 2 / 5');
        return;
      }
      if (autoMix.step === 3 && (!score.ready || score.bpmDifference > 0.5 || score.phaseDifference >= 30)) {
        setAutoMixStatus('ALINEA LA FASE', 'Mantén el tempo dentro de 0.5 BPM y usa JOG B ±25 ms hasta quedar por debajo de 30 ms.', 'Paso 3 / 5');
        return;
      }
      if (autoMix.step === 4) {
        const crossfader = Number($('#crossfader').value);
        const eqIsNeutral = $$('[data-eq]').every(input => Math.abs(Number(input.value)) <= 1.5);
        if (crossfader > 10 || !eqIsNeutral) {
          setAutoMixStatus('PREPARA LA MEZCLA', 'Lleva el crossfader hacia A y deja los controles de EQ cerca de 0 dB; luego comprueba otra vez.', 'Paso 4 / 5');
          return;
        }
      }
      if (autoMix.step === 5) {
        if (Number($('#crossfader').value) < 90) {
          setAutoMixStatus('TERMINA EL CROSSFADE', 'Desplaza el crossfader gradualmente hacia B (al menos 90%) y comprueba para terminar.', 'Paso 5 / 5');
          return;
        }
        finishAutoMix('Transición manual completada. ¡Buen trabajo mezclando!');
        return;
      }
    }
    autoMix.step = Math.min(autoMix.step + 1, autoMix.total);
    runAutoMixStep(autoMix.step);
  }

  function stopAutoMix() {
    autoMix.active = false;
    autoMixSetControls(false);
    if (autoMix.step < autoMix.total) {
      setAutoMixStatus('DETENIDO', 'Guía detenida. Puedes iniciar de nuevo cuando quieras.', `Paso ${autoMix.step} / 5`);
    }
  }

  function setStatus(text) { const el = $('#audio-status'); if (el) el.textContent = text; }

  function toast(message) {
    const el = $('#toast'); if (!el) return; el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2300);
  }

  function renderLibrary() {
    const body = $('#library-body');
    $('#library-count').textContent = `${library.length} ${library.length === 1 ? 'pista' : 'pistas'}`;
    if (!library.length) {
      body.innerHTML = '<tr class="empty-row"><td colspan="5"><span>♫</span><strong>Tu biblioteca empieza acá</strong><small>Inicia una demo o carga archivos de audio desde tu dispositivo.</small></td></tr>';
      return;
    }
    body.replaceChildren(...library.slice(0, 20).map(track => {
      const row = document.createElement('tr');
      const name = document.createElement('td'); name.innerHTML = `<div class="library-track"><i>♪</i><span><b></b><small></small></span></div>`;
      name.querySelector('b').textContent = track.name; name.querySelector('small').textContent = track.artist || track.source;
      const duration = document.createElement('td'); duration.textContent = formatTime(track.duration || 0);
      const bpm = document.createElement('td'); bpm.textContent = track.bpm ? Number(track.bpm).toFixed(1) : '—';
      const source = document.createElement('td'); source.textContent = track.source || 'Local';
      const action = document.createElement('td');
      const loadA = document.createElement('button'); loadA.className = 'table-load'; loadA.textContent = 'A'; loadA.title = 'Cargar en Deck A';
      const loadB = document.createElement('button'); loadB.className = 'table-load'; loadB.textContent = 'B'; loadB.title = 'Cargar en Deck B';
      loadA.addEventListener('click', () => loadLibraryTrack(track, 'a')); loadB.addEventListener('click', () => loadLibraryTrack(track, 'b'));
      action.append(loadA, document.createTextNode(' '), loadB); row.append(name, duration, bpm, source, action); return row;
    }));
  }

  async function importLibraryFile(file) {
    if (!file || file.size > 1024 * 1024) { toast('El archivo JSON supera el límite de 1 MB.'); return; }
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.version !== 1 || !Array.isArray(payload.tracks) || payload.tracks.length > 100) {
        throw new Error('Formato o versión no compatible.');
      }
      const imported = payload.tracks.map(normalizeLibraryTrack);
      if (!imported.length || imported.some(track => !track)) throw new Error('Hay pistas inválidas en el archivo.');
      for (const track of imported) {
        const existing = library.findIndex(item => item.name === track.name && item.source === track.source);
        if (existing >= 0) library[existing] = track;
        else library.unshift(track);
      }
      library.splice(100);
      persistLibrary();
      renderLibrary();
      toast(`Se importaron ${imported.length} pistas. Los archivos de audio no están incluidos.`);
    } catch (error) {
      toast(`No se importó la biblioteca: ${error.message || 'JSON inválido.'}`);
    }
  }

  function loadLibraryTrack(track, id) {
    if (track.kind === 'demo') {
      startDemo(id);
      return;
    }
    const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'audio/*';
    picker.addEventListener('change', () => {
      const file = picker.files?.[0];
      if (file) loadLocalFile(file, id);
    }, { once: true });
    picker.click();
    toast('Vuelve a elegir el archivo: el navegador no guarda el audio en la biblioteca.');
  }

  function loadLocalFile(file, id) {
    if (!file.type.startsWith('audio/')) { toast('Elige un archivo de audio compatible.'); return; }
    const url = URL.createObjectURL(file);
    attachTrack(id, url, { name: file.name.replace(/\.[^.]+$/, ''), artist: 'Archivo local · solo este dispositivo', duration: 0, bpm: id === 'a' ? 120 : 124, demo: false, loop: false });
    const deck = decks[id];
    deck.audio.onloadedmetadata = () => {
      const entry = library.find(item => item.name === deck.trackName && item.source === 'Local');
      if (entry) { entry.duration = deck.audio.duration || 0; persistLibrary(); renderLibrary(); }
    };
    toast(`Audio local cargado en Deck ${id.toUpperCase()}`);
  }

  function addPlaylistFiles(files) {
    const audioFiles = [...files].filter(file => file.type.startsWith('audio/'));
    if (!audioFiles.length) { toast('Elige uno o más archivos de audio compatibles.'); return; }
    mixPlaylist.push(...audioFiles);
    renderMixPlaylist();
    toast(`${audioFiles.length} ${audioFiles.length === 1 ? 'pista añadida' : 'pistas añadidas'} a tu playlist`);
  }

  function renderMixPlaylist() {
    const list = $('#mix-playlist');
    if (!mixPlaylist.length) {
      const empty = document.createElement('li');
      empty.className = 'playlist-empty';
      empty.textContent = 'Aún no hay pistas. Añade archivos de audio para empezar a mezclar.';
      list.replaceChildren(empty);
      return;
    }
    list.replaceChildren(...mixPlaylist.map((file, index) => {
      const item = document.createElement('li');
      item.className = 'mix-playlist-item';
      const name = document.createElement('span');
      name.className = 'mix-playlist-name';
      name.textContent = file.name;
      const actions = document.createElement('span');
      actions.className = 'mix-playlist-actions';
      for (const id of ['a', 'b']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'table-load';
        button.textContent = id.toUpperCase();
        button.setAttribute('aria-label', `Cargar ${file.name} en Deck ${id.toUpperCase()}`);
        button.addEventListener('click', () => loadLocalFile(file, id));
        actions.append(button);
      }
      item.append(name, actions);
      return item;
    }));
  }

  function initYouTubePlayer() {
    window.onYouTubeIframeAPIReady = () => {
      youtubePlayer = new window.YT.Player('youtube-player', {
        events: {
          onReady: () => {
            refreshYouTubePlaylist();
            window.setTimeout(refreshYouTubePlaylist, 1200);
          },
          onStateChange: refreshYouTubePlaylist
        }
      });
      for (const deck of ['a', 'b']) {
        const player = new window.YT.Player(`youtube-deck-player-${deck}`, {
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: () => {
              youtubeDeckReady.add(deck);
              const videoId = youtubeDeckVideos.get(deck);
              if (videoId) playYouTubeTrack(videoId, deck);
              else setYouTubeDeckStatus(deck, 'Listo · elige una pista de la playlist');
            },
            onStateChange: event => updateYouTubeDeckState(deck, event),
            onError: event => updateYouTubeDeckError(deck, event.data),
            onAutoplayBlocked: () => setYouTubeDeckStatus(deck, 'Pulsa reproducir dentro del reproductor de YouTube')
          }
        });
        youtubeDeckPlayers.set(deck, player);
      }
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      $('#youtube-playlist-status').textContent = 'No se pudieron cargar los metadatos. El reproductor o el enlace externo siguen disponibles.';
      for (const deck of ['a', 'b']) setYouTubeDeckStatus(deck, 'No se pudo cargar YouTube. Comprueba tu conexión o abre la playlist externa.');
    };
    document.head.append(script);
  }

  function setYouTubeDeckStatus(deck, message) {
    $(`#youtube-deck-status-${deck}`).textContent = message;
  }

  function playYouTubeTrack(videoId, deck) {
    const player = youtubeDeckPlayers.get(deck);
    if (!player || !youtubeDeckReady.has(deck)) return;
    youtubeDeckVideos.set(deck, videoId);
    setYouTubeDeckStatus(deck, `Cargando · ${youtubeTitles.get(videoId) || videoId}`);
    player.loadVideoById(videoId);
  }

  function updateYouTubeDeckState(deck, event) {
    const player = youtubeDeckPlayers.get(deck);
    if (!player) return;
    const state = event.data;
    const video = player.getVideoData?.();
    if (video?.video_id && video.title) youtubeTitles.set(video.video_id, video.title);
    const title = video?.title || youtubeTitles.get(youtubeDeckVideos.get(deck)) || 'Pista de YouTube';
    if (state === window.YT.PlayerState.PLAYING) setYouTubeDeckStatus(deck, `Reproduciendo · ${title}`);
    else if (state === window.YT.PlayerState.PAUSED) setYouTubeDeckStatus(deck, `En pausa · ${title}`);
    else if (state === window.YT.PlayerState.ENDED) setYouTubeDeckStatus(deck, `Finalizada · ${title}`);
    else if (state === window.YT.PlayerState.CUED) setYouTubeDeckStatus(deck, `Lista · ${title}`);
    refreshYouTubePlaylist();
  }

  function updateYouTubeDeckError(deck, code) {
    const message = code === 101 || code === 150
      ? 'Esta pista no permite reproducción incrustada. Ábrela en YouTube Music.'
      : 'YouTube no pudo reproducir esta pista. Inténtalo de nuevo o abre la playlist.';
    setYouTubeDeckStatus(deck, message);
  }

  function refreshYouTubePlaylist() {
    if (!youtubePlayer) return;
    let ids = [];
    try {
      ids = youtubePlayer.getPlaylist() || [];
      const current = youtubePlayer.getVideoData?.();
      if (current?.video_id && current.title) youtubeTitles.set(current.video_id, current.title);
    } catch { /* El reproductor aún puede estar inicializándose. */ }

    const uniqueIds = [...new Set(ids.filter(id => typeof id === 'string' && id))];
    if (!uniqueIds.length) {
      $('#youtube-playlist-status').textContent = 'YouTube todavía no expone las pistas. Inicia la playlist en el reproductor para cargar la lista.';
      return;
    }
    const currentIndex = youtubePlayer.getPlaylistIndex?.();
    $('#youtube-playlist-status').textContent = `${uniqueIds.length} pistas · los títulos se completan cuando YouTube los expone al reproducirlos`;
    const list = $('#youtube-track-list');
    list.replaceChildren(...uniqueIds.map((videoId, index) => {
      const item = document.createElement('li');
      item.className = 'youtube-track-item';
      if (index === currentIndex) item.classList.add('is-current');

      const details = document.createElement('span');
      details.className = 'youtube-track-details';
      const title = document.createElement('strong');
      title.textContent = youtubeTitles.get(videoId) || `Pista ${index + 1}`;
      const subtitle = document.createElement('small');
      subtitle.textContent = youtubeTitles.has(videoId) ? 'YouTube Music · información del reproductor' : `YouTube · ${videoId}`;
      details.append(title, subtitle);

      const actions = document.createElement('span');
      actions.className = 'youtube-track-actions';
      for (const deck of ['a', 'b']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'table-load';
        button.textContent = deck.toUpperCase();
        button.title = `Reproducir desde YouTube en Deck ${deck.toUpperCase()}`;
        button.setAttribute('aria-label', `Reproducir ${title.textContent} desde YouTube en Deck ${deck.toUpperCase()}`);
        button.addEventListener('click', () => {
          youtubeDeckVideos.set(deck, videoId);
          if (youtubeDeckReady.has(deck)) playYouTubeTrack(videoId, deck);
          else setYouTubeDeckStatus(deck, 'Conectando con el reproductor oficial de YouTube…');
        });
        actions.append(button);
      }
      item.append(details, actions);
      return item;
    }));
  }

  async function enableMidi() {
    if (!navigator.requestMIDIAccess) { toast('WebMIDI no está disponible en este navegador.'); return; }
    try {
      midiAccess = await navigator.requestMIDIAccess();
      for (const input of midiAccess.inputs.values()) input.onmidimessage = handleMidi;
      midiAccess.onstatechange = () => {
        for (const input of midiAccess.inputs.values()) input.onmidimessage = handleMidi;
        refreshMidiState();
      };
      refreshMidiState();
      toast(midiAccess.inputs.size ? 'Controladora MIDI conectada.' : 'MIDI listo: conecta una controladora.');
    } catch { toast('No se concedió acceso MIDI. Puedes mezclar con controles táctiles.'); }
  }

  function refreshMidiState() {
    const connected = Boolean(midiAccess && midiAccess.inputs.size);
    $('#midi-state').textContent = connected ? 'ON' : 'LISTO';
    $('#midi-button').classList.toggle('midi-active', connected);
  }

  function midiMessageLabel(mapping) {
    return `${mapping.type === 'note' ? 'Nota' : 'CC'} ${mapping.number} · canal ${mapping.channel + 1}`;
  }

  function updateMidiLearnStatus() {
    const target = $('#midi-target-select').value;
    const mapping = midiMap[target];
    const status = $('#midi-learn-status');
    status.textContent = midiLearnEnabled
      ? `ESCUCHANDO · ${MIDI_LABELS[target] || target}`
      : mapping ? `${MIDI_LABELS[target] || target} · ${midiMessageLabel(mapping)}` : 'MIDI · asignación universal';
    $('#midi-learn-toggle').textContent = midiLearnEnabled ? 'CANCELAR APRENDIZAJE' : 'APRENDER CONTROL';
    $('#midi-learn-toggle').classList.toggle('midi-active', midiLearnEnabled);
  }

  function handleMidi(event) {
    const [status, data1, data2] = event.data;
    const command = status & 0xf0;
    const channel = status & 0x0f;
    const isNote = command === 0x90 && data2 > 0;
    const isCC = command === 0xb0;
    if (midiLearnEnabled && (isNote || isCC)) {
      const target = $('#midi-target-select').value;
      midiMap[target] = { type: isNote ? 'note' : 'cc', number: data1, channel };
      midiLearnEnabled = false;
      midiLearnTarget = null;
      persistMidiMap();
      updateMidiLearnStatus();
      toast(`${MIDI_LABELS[target] || target}: ${midiMessageLabel(midiMap[target])}`);
      return;
    }
    for (const [target, mapping] of Object.entries(midiMap)) {
      if (!mapping || mapping.channel !== channel || data1 !== mapping.number) continue;
      if (mapping.type === 'note' && isNote) {
        if (target.startsWith('play-')) playDeck(target.slice(-1));
        else if (target.startsWith('cue-')) cueDeck(target.slice(-1));
        else if (target.startsWith('sync-')) syncDeck(target.slice(-1));
        else if (target.startsWith('jog-')) nudgeDeck(target.slice(-1), 0.025);
      } else if (mapping.type === 'cc' && isCC) {
        dispatchMidiControl(target, data2);
      }
    }
  }

  function dispatchMidiControl(target, value) {
    if (value > 0 && target.startsWith('play-')) { playDeck(target.slice(-1)); return; }
    if (value > 0 && target.startsWith('cue-')) { cueDeck(target.slice(-1)); return; }
    if (value > 0 && target.startsWith('sync-')) { syncDeck(target.slice(-1)); return; }
    if (target.startsWith('jog-')) {
      const delta = value > 64 ? value - 128 : value;
      if (delta) nudgeDeck(target.slice(-1), Math.sign(delta) * Math.min(Math.abs(delta), 8) * 0.012);
      return;
    }
    const controls = {
      'volume-a': $('[data-volume="a"]'), 'volume-b': $('[data-volume="b"]'),
      'pitch-a': $('[data-pitch="a"]'), 'pitch-b': $('[data-pitch="b"]'),
      'eq-a-low': $('[data-eq="low"][data-deck="a"]'), 'eq-a-mid': $('[data-eq="mid"][data-deck="a"]'), 'eq-a-high': $('[data-eq="high"][data-deck="a"]'),
      'eq-b-low': $('[data-eq="low"][data-deck="b"]'), 'eq-b-mid': $('[data-eq="mid"][data-deck="b"]'), 'eq-b-high': $('[data-eq="high"][data-deck="b"]'),
      crossfader: $('#crossfader')
    };
    const input = controls[target];
    if (!input) return;
    const min = Number(input.min || 0), max = Number(input.max || 127);
    input.value = String(min + (value / 127) * (max - min));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function nudgeDeck(id, seconds) {
    const audio = decks[id]?.audio;
    if (audio?.src && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
      updatePhase();
    }
  }

  function setVolume(id, value) {
    ensureAudio();
    const deck = decks[id];
    if (!deck?.volume) return;
    deck.volume.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), audioContext.currentTime, 0.015);
    const label = $(`#volume-label-${id}`);
    if (label) label.textContent = `${Math.round(value * 100)}%`;
  }

  function animate() {
    if (audioContext) {
      renderWave('a'); renderWave('b');
      updateTransport('a'); updateTransport('b'); updatePhase();
    } else {
      for (const id of ['a', 'b']) renderWavePlaceholder(id);
    }
    requestAnimationFrame(animate);
  }

  function renderWavePlaceholder(id) {
    const canvas = $(`#wave-${id}`);
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 500, height = canvas.clientHeight || 67;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) { canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio); }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#0c1016'; ctx.fillRect(0, 0, width, height);
    const colors = ['#fa596d', '#72e294', '#57aef4'];
    for (let x = 0; x < width; x += 3) {
      const rhythm = Math.abs(Math.sin(x * 0.045 + (id === 'b' ? 1 : 0)) * Math.cos(x * 0.012));
      for (let band = 0; band < 3; band++) {
        const amp = 2 + rhythm * (band === 0 ? 13 : band === 1 ? 9 : 6);
        ctx.globalAlpha = 0.27; ctx.fillStyle = colors[band]; ctx.fillRect(x, height / 2 - amp / 2 + band * 3 - 3, 2, amp);
      }
    }
    ctx.globalAlpha = 1;
  }

  $$('.play-button').forEach(button => button.addEventListener('click', () => playDeck(button.dataset.deck)));
  $$('.demo-button').forEach(button => button.addEventListener('click', () => startDemo(button.dataset.deck)));
  $$('.cue-button').forEach(button => button.addEventListener('click', () => cueDeck(button.dataset.deck)));
  $$('[data-action="sync"]').forEach(button => button.addEventListener('click', () => syncDeck(button.dataset.deck)));
  $$('[data-load]').forEach(input => input.addEventListener('change', () => { if (input.files?.[0]) loadLocalFile(input.files[0], input.dataset.load); input.value = ''; }));
  $('#playlist-files').addEventListener('change', event => {
    addPlaylistFiles(event.target.files || []);
    event.target.value = '';
  });
  $$('[data-eq]').forEach(input => input.addEventListener('input', () => {
    ensureAudio(); const deck = decks[input.dataset.deck]; deck.filters[input.dataset.eq].gain.setTargetAtTime(Number(input.value), audioContext.currentTime, 0.02);
    const label = input.closest('.knob-control'); label.querySelector('small').textContent = `${Number(input.value) > 0 ? '+' : ''}${input.value} dB`;
    const degrees = -135 + ((Number(input.value) + 24) / 30) * 270;
    label.querySelector('.knob').style.setProperty('--rotation', `${degrees}deg`);
  }));
  $$('[data-volume]').forEach(input => input.addEventListener('input', () => setVolume(input.dataset.volume, Number(input.value) / 100)));
  $$('[data-pitch]').forEach(input => input.addEventListener('input', () => { ensureAudio(); setPitch(input.dataset.pitch, input.value); }));
  $('#crossfader').addEventListener('input', event => { ensureAudio(); setCrossfader(event.target.value); });
  $('#check-beat').addEventListener('click', checkMix);
  $('#auto-mix-start').addEventListener('click', startAutoMix);
  $('#lesson-practice-start').addEventListener('click', startPracticeLesson);
  $('#lesson-jog-back').addEventListener('click', () => nudgeDeck('b', -0.025));
  $('#lesson-jog-forward').addEventListener('click', () => nudgeDeck('b', 0.025));
  $('#auto-mix-next').addEventListener('click', nextAutoMixStep);
  $('#auto-mix-stop').addEventListener('click', stopAutoMix);
  $('#midi-button').addEventListener('click', enableMidi);
  $('#midi-target-select').addEventListener('change', () => { midiLearnEnabled = false; updateMidiLearnStatus(); });
  $('#midi-learn-toggle').addEventListener('click', () => {
    midiLearnEnabled = !midiLearnEnabled;
    midiLearnTarget = midiLearnEnabled ? $('#midi-target-select').value : null;
    updateMidiLearnStatus();
    if (midiLearnEnabled && !midiAccess) enableMidi();
    if (midiLearnEnabled) toast(`Mueve un control MIDI para asignar ${MIDI_LABELS[midiLearnTarget] || midiLearnTarget}.`);
  });
  $('#midi-clear-maps').addEventListener('click', () => {
    for (const target of Object.keys(midiMap)) delete midiMap[target];
    persistMidiMap(); updateMidiLearnStatus(); toast('Asignaciones MIDI reiniciadas.');
  });
  $('#import-library-file').addEventListener('change', event => {
    importLibraryFile(event.target.files?.[0]);
    event.target.value = '';
  });
  $('#export-library').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tracks: library }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'djlab-library.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast('Biblioteca exportada en JSON.');
  });
  for (const id of ['a', 'b']) {
    $(`#audio-${id}`).addEventListener('play', () => updateTransport(id));
    $(`#audio-${id}`).addEventListener('pause', () => updateTransport(id));
    $(`#audio-${id}`).addEventListener('ended', () => updateTransport(id));
  }
  renderLibrary();
  initYouTubePlayer();
  setCrossfader(50);
  requestAnimationFrame(animate);
})();
