import { test, expect} from '@playwright/test';

test.describe('E2E: User Detail Page (/users/:id)', () => {
  const mockUser = {
    id: 'abc',
    name: 'Max Mustfrau',
    email: 'max@mustfrau.de',
    books: [
      {
        id: '1',
        isbn: '10',
        title: 'Book A',
        authors: [],
        publisher: '',
        publishedDate: '',
        description: '',
        coverUrl: '',
        rating: 5,
        reviews: []
      },
      {
        id: '2',
        isbn: '20',
        title: 'Book B',
        authors: [],
        publisher: '',
        publishedDate: '',
        description: '',
        coverUrl: '',
        rating: null,
        reviews: []
      }
    ]
  };

  test('displays user info and book list', async ({ page }) => {
    await page.route('**/users/abc', (route, request) => {
      if (request.resourceType() === 'xhr' && request.url().startsWith('http://localhost:8080')) {
        return route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockUser)
        });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users/abc');
    await page.waitForSelector('section.info h2');
    await expect(page.locator('section.info h2')).toHaveText(mockUser.name);
    await expect(page.locator('section.info p')).toHaveText(mockUser.email);
    await expect(page.locator('table.book-table tbody tr')).toHaveCount(mockUser.books.length);
    await expect(page.locator('table.book-table tbody tr:nth-child(1) td:nth-child(1)')).toHaveText('10');
    await expect(page.locator('table.book-table tbody tr:nth-child(1) td:nth-child(2)')).toHaveText('Book A');
    await expect(page.locator('table.book-table tbody tr:nth-child(1) td:nth-child(3)')).toHaveText('5');
  });

  test('shows "Keine Bücher vorhanden." when no books', async ({ page }) => {
    await page.route('**/users/abc', (route, request) => {
      if (request.resourceType() === 'xhr' && request.url().startsWith('http://localhost:8080')) {
        return route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...mockUser, books: [] })
        });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users/abc');
    await page.waitForSelector('text=Keine Bücher vorhanden.');
    await expect(page.locator('text=Keine Bücher vorhanden.')).toBeVisible();
  });

  test('shows error message when GET fails', async ({ page }) => {
    await page.route('**/users/abc', (route, request) => {
      if (request.resourceType() === 'xhr' && request.url().startsWith('http://localhost:8080')) {
        return route.fulfill({ status: 500 });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users/abc');
    await page.waitForSelector('.error');
    await expect(page.locator('.error').first()).toHaveText('Benutzerdaten konnten nicht geladen werden.');
  });

  test('navigates back to Home page via Home button', async ({ page }) => {
    await page.route('**/users/abc', (route, request) => {
      if (request.resourceType() === 'xhr' && request.url().startsWith('http://localhost:8080')) {
        return route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockUser)
        });
      }
      return route.continue();
    });

    await page.goto('http://localhost:4200/users/abc');
    await page.waitForSelector('.toolbar button');
    await page.click('.toolbar button');
    await expect(page).toHaveURL('http://localhost:4200/');
    await expect(page.locator('h1')).toHaveText('Willkommen beim Bookmanager');
  });
});
