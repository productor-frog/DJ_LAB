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
