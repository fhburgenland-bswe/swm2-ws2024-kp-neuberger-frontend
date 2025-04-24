import { test, expect } from '@playwright/test';

test('E2E: Nutzer anlegen (nur Create)', async ({ page }) => {
  const mockUser = {
    id: 'abc123',
    name: 'Max Mustermann',
    email: 'max@mustermann.de',
    books: []
  };

  await page.addInitScript(`
    window.__lastAlert = null;
    window.alert = (msg) => { window.__lastAlert = msg; };
  `);

  await page.route('**/users', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockUser),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('http://localhost:4200/users/create');
  await page.fill('input[formControlName="name"]', mockUser.name);
  await page.fill('input[formControlName="email"]', mockUser.email);
  await page.click('button[type="submit"]');
  const alertText = await page.evaluate(() => (window as any).__lastAlert);
  expect(alertText).toBe('Benutzer angelegt');
});
