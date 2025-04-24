import { test, expect } from '@playwright/test';

test.describe('E2E: User List Page (/users)', () => {
  const mockUsers = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob',   email: 'bob@example.com' }
  ];

  test('displays all users in the table', async ({ page }) => {
    await page.route('**/users', (route, request) => {
      if (request.method() === 'GET' && request.resourceType() === 'xhr') {
        return route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(mockUsers)
        });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users');
    await expect(page.locator('table tbody tr')).toHaveCount(mockUsers.length);

    for (let i = 0; i < mockUsers.length; i++) {
      await expect(page.locator(`table tbody tr >> nth=${i} >> td >> nth=0`))
        .toHaveText(mockUsers[i].name);
      await expect(page.locator(`table tbody tr >> nth=${i} >> td >> nth=1`))
        .toHaveText(mockUsers[i].email);
    }
  });

  test('cancels deletion when confirmation is dismissed', async ({ page }) => {
    await page.addInitScript(() => { window.confirm = () => false; });

    await page.route('**/users', (route, request) => {
      if (request.method() === 'GET' && request.resourceType() === 'xhr') {
        return route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(mockUsers)
        });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users');
    await expect(page.locator('table tbody tr')).toHaveCount(mockUsers.length);

    await page.click('table tbody tr:first-child button:has-text("Löschen")');
    await expect(page.locator('table tbody tr')).toHaveCount(mockUsers.length);
  });

  test('shows error message when GET fails', async ({ page }) => {
    await page.route('**/users', (route, request) => {
      if (request.method() === 'GET' && request.resourceType() === 'xhr') {
        return route.fulfill({ status: 500 });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users');
    await expect(page.locator('.error')).toHaveText('Daten konnten nicht geladen werden.');
  });

  test('navigates back to Home page via Home button', async ({ page }) => {
    await page.route('**/users', (route, request) => {
      if (request.method() === 'GET' && request.resourceType() === 'xhr') {
        return route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(mockUsers)
        });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users');
    await page.click('.toolbar button');
    await expect(page).toHaveURL('http://localhost:4200/');
    await expect(page.locator('h1')).toHaveText('Willkommen beim Bookmanager');
  });
});
