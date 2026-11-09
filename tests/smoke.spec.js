const { test, expect } = require('@playwright/test');

test('loads the mixer, both decks, and local demos without app errors', async ({ page }) => {
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', message => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      url: message.location().url,
    });
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/DJ Lab/);
  await expect(page.getByRole('heading', { name: 'Tu primera mezcla.' })).toBeVisible();
  await expect(page.locator('.deck[data-deck="a"]')).toBeVisible();
  await expect(page.locator('.deck[data-deck="b"]')).toBeVisible();

  await page.locator('.demo-button[data-deck="a"]').click();
  await page.locator('.demo-button[data-deck="b"]').click();
  await expect(page.locator('#track-a')).toHaveText('Neon pulse · 01');
  await expect(page.locator('#track-b')).toHaveText('Afterglow · 02');
  await expect(page.locator('#audio-a')).toHaveJSProperty('paused', false);
  await expect(page.locator('#audio-b')).toHaveJSProperty('paused', false);

  const origin = new URL(page.url()).origin;
  const appConsoleErrors = consoleMessages.filter(message =>
    message.type === 'error' && (!message.url || message.url.startsWith(origin)),
  );
  await test.info().attach('browser-console.txt', {
    body: consoleMessages.map(message =>
      `[${message.type}] ${message.url || '(no source)'} ${message.text}`,
    ).join('\n') || 'No browser console messages.',
    contentType: 'text/plain',
  });

  expect(pageErrors, 'uncaught browser page errors').toEqual([]);
  expect(appConsoleErrors, 'console errors from DJ Lab').toEqual([]);
});
