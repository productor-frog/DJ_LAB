import fs from 'node:fs';

const BASE_URL = process.env.SMOKE_URL || 'http://localhost:3002';

async function resolvePlaywright() {
  const candidates = [
    '/home/runner/.local/share/omgithub-playwright/node_modules/playwright/index.js',
    '/home/runner/.local/share/omgithub-playwright/node_modules/playwright-core/index.js',
  ];
  for (const c of candidates) {
    try { return await import(c); } catch {}
  }
  // Try normal resolution
  try { return await import('playwright'); } catch {}
  throw new Error('Playwright no disponible. Instálalo o ajusta la ruta en tests/smoke.mjs.');
}

const pw = await resolvePlaywright();
const chromium = (pw.default && pw.default.chromium) || pw.chromium;

const browser = await chromium.launch({
  executablePath: '/home/runner/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => pageErrors.push(String(err)));

let failed = false;
const checks = [];
function check(name, ok, detail = '') { checks.push({ name, ok, detail }); if (!ok) failed = true; }

try {
  const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  check('HTTP 200', !!response && response.status() === 200, response ? String(response.status()) : 'no response');
  check('Inicio abre con índice principal', await page.locator('#home').count() === 1 && await page.locator('#home-title').isVisible());
  check('Portal ofrece cinco áreas', await page.locator('.portal-card').count() === 5);
  check('Navegación a cabina y biblioteca', await page.locator('.top-nav a[href="#cabina"]').count() === 1 && await page.locator('.top-nav a[href="#biblioteca"]').count() === 1);
  check('Áreas futuras se identifican como planificadas', await page.locator('.portal-card-planned').count() === 2 && await page.locator('.next-up-card small').allTextContents().then(labels => labels.every(label => label.includes('planificado'))));
  await page.locator('.portal-card[href="#cabina"]').click();
  check('Portal navega a cabina sin quitar la cabina del DOM', page.url().endsWith('#cabina') && await page.locator('#audio-a').count() === 1);
  await page.locator('.top-nav a[href="#home"]').click();

  await page.waitForSelector('#audio-a', { state: 'attached', timeout: 10000 });
  await page.waitForSelector('#audio-b', { state: 'attached', timeout: 10000 });
  check('Deck A presente', await page.locator('#audio-a').count() === 1);
  check('Deck B presente', await page.locator('#audio-b').count() === 1);
  check('Wave A presente', await page.locator('#wave-a').count() === 1);
  check('Wave B presente', await page.locator('#wave-b').count() === 1);
  check('Crossfader presente', await page.locator('#crossfader').count() === 1);
  check('Botón comprobar mezcla', await page.locator('#check-beat').count() === 1);
  check('Guía auto-mix', await page.locator('#auto-mix-start').count() === 1);
  check('Clase práctica', await page.locator('#lesson-practice-start').count() === 1);
  check('JOG B de la clase', await page.locator('#lesson-jog-back').count() === 1 && await page.locator('#lesson-jog-forward').count() === 1);
  check('Playlist local disponible', await page.locator('#playlist-files').count() === 1 && await page.locator('#mix-playlist').count() === 1);
  check('Sin reproductores externos', await page.locator('iframe').count() === 0 && await page.locator('[id*="youtube"], [class*="youtube"]').count() === 0);

  const repositoryTracks = [
    { name: 'beautiful feeling (vita)', file: '001 - beautiful feeling (vita).mp3' },
    { name: '[432Hz] Ultraviolet', file: '002 - [432Hz] Ultraviolet.mp3' },
    { name: '[432Hz] Neon Boulevard', file: '003 - [432Hz] Neon Boulevard.mp3' },
    { name: 'gris', file: '004 - gris.mp3' },
  ];
  for (const track of repositoryTracks) {
    const libraryRow = page.locator('#library-body tr').filter({ hasText: track.name });
    const playlistItem = page.locator('#mix-playlist .mix-playlist-item').filter({ hasText: track.name });
    check(`Biblioteca incluye ${track.name}`, await libraryRow.count() === 1);
    check(`Playlist incluye ${track.name} con carga a ambos decks`, await playlistItem.count() === 1 && await playlistItem.getByRole('button').count() === 2);
    const encodedPath = track.file.split('/').map(encodeURIComponent).join('/');
    const audioResponse = await page.request.head(`${BASE_URL}/tests/${encodedPath}`);
    check(`MP3 disponible: ${track.name}`, audioResponse.status() === 200 && (audioResponse.headers()['content-type'] || '').startsWith('audio/'), `${audioResponse.status()} ${audioResponse.headers()['content-type'] || ''}`);
  }

  const firstTrackTags = page.locator('#library-body tr').nth(0).locator('.library-tags-input');
  await firstTrackTags.fill('warm-up, house');
  await firstTrackTags.dispatchEvent('change');
  const secondTrackTags = page.locator('#library-body tr').nth(1).locator('.library-tags-input');
  await secondTrackTags.fill('closing');
  await secondTrackTags.dispatchEvent('change');
  check('Etiquetas se editan por pista', await page.locator('#library-body .library-tags-input').nth(0).inputValue() === 'warm-up, house' && await page.locator('#library-body .library-tags-input').nth(1).inputValue() === 'closing');
  check('Selector de etiquetas se actualiza dinámicamente', await page.locator('#library-tag-filter option').allTextContents().then(labels => labels.includes('warm-up') && labels.includes('house') && labels.includes('closing')));
  await page.locator('#library-tag-filter').selectOption('warm-up');
  check('Filtro por etiqueta filtra pistas y actualiza conteo', await page.locator('#library-body tr:not(.empty-row)').count() === 1 && (await page.locator('#library-count').textContent()).trim() === '1 de 4 pistas');
  await page.locator('#library-tag-filter').selectOption('all');
  const librarySearch = page.locator('#library-search');
  await librarySearch.fill('house');
  check('Búsqueda incluye etiquetas', await page.locator('#library-body tr:not(.empty-row)').count() === 1 && (await page.locator('#library-count').textContent()).trim() === '1 de 4 pistas');
  await librarySearch.fill('biblioteca DJ Lab');
  check('Búsqueda filtra por artista y actualiza conteo', await page.locator('#library-body tr').count() === 4 && (await page.locator('#library-count').textContent()).trim() === '4 de 4 pistas');
  await librarySearch.fill('ULTRAVIOLET');
  check('Búsqueda por nombre ignora mayúsculas', await page.locator('#library-body tr').count() === 1 && (await page.locator('#library-body').textContent()).includes('[432Hz] Ultraviolet') && (await page.locator('#library-count').textContent()).trim() === '1 de 4 pistas');
  await librarySearch.fill('sin coincidencia posible');
  check('Búsqueda sin resultados muestra estado vacío y conteo cero', await page.locator('#library-body .empty-row strong').textContent() === 'No hay coincidencias' && (await page.locator('#library-count').textContent()).trim() === '0 de 4 pistas');
  await librarySearch.fill('');
  check('Limpiar búsqueda restaura biblioteca completa', await page.locator('#library-body tr').count() === 4 && (await page.locator('#library-count').textContent()).trim() === '4 pistas');
  await page.reload({ waitUntil: 'networkidle' });
  check('Etiquetas se conservan al recargar la biblioteca', await page.locator('#library-body .library-tags-input').nth(0).inputValue() === 'warm-up, house' && await page.locator('#library-body .library-tags-input').nth(1).inputValue() === 'closing');
  await page.locator('#library-source-filter').selectOption('Demo');
  check('Filtro dedicado Demo no muestra pistas locales', await page.locator('#library-count').textContent() === '0 de 4 pistas');
  await page.locator('#library-source-filter').selectOption('Local');
  check('Filtro dedicado Local conserva cuatro pistas', await page.locator('#library-body tr').count() === 4);
  await page.locator('#library-bpm-filter').selectOption('known');
  const knownBpmValues = await page.locator('#library-body tr:not(.empty-row) td:nth-child(3)').allTextContents();
  check('Filtro BPM conocido muestra solo valores analizados', knownBpmValues.length === Number((await page.locator('#library-count').textContent()).match(/^(\d+)/)?.[1]) && knownBpmValues.every(value => Number(value) > 0));
  await page.locator('#library-bpm-filter').selectOption('unknown');
  const pendingBpmValues = await page.locator('#library-body tr:not(.empty-row) td:nth-child(3)').allTextContents();
  check('Filtro BPM pendiente muestra solo pistas sin BPM', pendingBpmValues.length === Number((await page.locator('#library-count').textContent()).match(/^(\d+)/)?.[1]) && pendingBpmValues.every(value => value.trim() === '—'));
  await page.locator('#library-filter-reset').click();
  await page.locator('#library-tag-filter').selectOption('warm-up');
  await page.locator('#library-filter-reset').click();
  check('Limpiar filtros reinicia búsqueda y selectores', await page.locator('#library-search').inputValue() === '' && await page.locator('#library-source-filter').inputValue() === 'all' && await page.locator('#library-bpm-filter').inputValue() === 'all' && await page.locator('#library-tag-filter').inputValue() === 'all' && await page.locator('#library-body tr').count() === 4);

  const preloadedDecks = await page.evaluate(() => ['a', 'b'].map(id => ({
    id,
    name: document.querySelector(`#track-${id}`)?.textContent,
    path: document.querySelector(`#audio-${id}`)?.currentSrc ? decodeURIComponent(new URL(document.querySelector(`#audio-${id}`).currentSrc).pathname) : '',
    canPlayMp3: Boolean(document.querySelector(`#audio-${id}`)?.canPlayType('audio/mpeg')),
  })));
  check('Deck A precargado con MP3 local', preloadedDecks[0].name === repositoryTracks[0].name && preloadedDecks[0].path.endsWith(`/tests/${repositoryTracks[0].file}`) && preloadedDecks[0].canPlayMp3, JSON.stringify(preloadedDecks[0]));
  check('Deck B precargado con MP3 local', preloadedDecks[1].name === repositoryTracks[1].name && preloadedDecks[1].path.endsWith(`/tests/${repositoryTracks[1].file}`) && preloadedDecks[1].canPlayMp3, JSON.stringify(preloadedDecks[1]));
  for (const [track, deck] of [[repositoryTracks[2], 'A'], [repositoryTracks[3], 'B']]) {
    await page.locator('#mix-playlist .mix-playlist-item').filter({ hasText: track.name }).getByRole('button', { name: `Cargar ${track.name} en Deck ${deck}` }).click();
    await page.waitForFunction(({ id, file }) => {
      const audio = document.querySelector(`#audio-${id.toLowerCase()}`);
      return audio?.currentSrc && decodeURIComponent(new URL(audio.currentSrc).pathname).endsWith(`/tests/${file}`);
    }, { id: deck, file: track.file });
    const loadedName = await page.locator(`#track-${deck.toLowerCase()}`).textContent();
    check(`${track.name} carga en Deck ${deck}`, loadedName === track.name, loadedName);
  }

  const title = await page.title();
  check('Título DJ Lab', /DJ Lab/i.test(title), title);

  // Allow a short settle time for deferred scripts
  await page.waitForTimeout(1500);

  // Exercise the practical beatmatch lesson with the built-in authorized demos.
  await page.locator('.demo-button[data-deck="a"]').click();
  await page.locator('.demo-button[data-deck="b"]').click();
  await page.waitForFunction(() => document.querySelector('#audio-a')?.src && document.querySelector('#audio-b')?.src);
  await page.locator('#lesson-practice-start').click();
  check('Clase inicia en verificación', (await page.locator('#auto-mix-step-title').textContent()).includes('PASO 1'));
  await page.locator('#auto-mix-next').click();
  await page.locator('[data-pitch="b"]').evaluate(input => { input.value = '-3.2'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#auto-mix-next').click();
  check('Clase solicita alinear fase', (await page.locator('#auto-mix-step-title').textContent()).includes('PASO 3'));
  check('JOG aparece durante el paso de fase', await page.locator('#lesson-jog-controls').isVisible());
  await page.evaluate(async () => {
    for (const id of ['a', 'b']) {
      const audio = document.querySelector(`#audio-${id}`);
      audio.pause();
      audio.currentTime = 0.5;
    }
  });
  await page.waitForTimeout(100);
  await page.locator('#lesson-jog-back').click();
  const joggedTime = await page.locator('#audio-b').evaluate(audio => audio.currentTime);
  check('JOG B retrasa aproximadamente 25 ms', Math.abs(joggedTime - 0.475) < 0.008, `${joggedTime.toFixed(3)} s`);
  await page.locator('#auto-mix-next').click();
  check('Clase pasa a preparar', (await page.locator('#auto-mix-step-title').textContent()).includes('PASO 4'));
  await page.locator('#crossfader').evaluate(input => { input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#auto-mix-next').click();
  check('Clase pasa al crossfade manual', (await page.locator('#auto-mix-step-title').textContent()).includes('PASO 5'));
  await page.locator('#crossfader').evaluate(input => { input.value = '100'; input.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('#auto-mix-next').click();
  check('Clase práctica completa', (await page.locator('#auto-mix-step-title').textContent()).includes('COMPLETADO'));

  check('Sin errores de consola propios', consoleErrors.length === 0, consoleErrors.join(' | '));
  check('Sin pageerror', pageErrors.length === 0, pageErrors.join(' | '));

  const shotDir = '/tmp/opencode';
  fs.mkdirSync(shotDir, { recursive: true });
  await page.screenshot({ path: `${shotDir}/smoke.jpg`, type: 'jpeg', quality: 60 });
} catch (error) {
  failed = true;
  checks.push({ name: 'Excepción', ok: false, detail: String(error) });
} finally {
  await browser.close();
}

for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}: ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
}
if (failed) {
  console.error('SMOKE FAILED');
  process.exit(1);
} else {
  console.log('SMOKE OK');
  process.exit(0);
}
