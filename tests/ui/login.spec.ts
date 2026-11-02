import { test, expect } from '../../fixtures/ui';
import { users, PASSWORD } from '../../data/users';

/**
 * Traceability: TC-LOGIN-* IDs map to scenarios/login-test-matrix.md
 */
test.describe('Login', () => {
  test('TC-LOGIN-01 standard user lands on the product list', async ({ loginPage, inventoryPage, page }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(6);
  });

  // Data-driven negatives. Each row is one row of the test matrix.
  const negativeCases = [
    {
      id: 'TC-LOGIN-02',
      name: 'locked-out user is rejected',
      username: users.lockedOut.username,
      password: PASSWORD,
      error: 'Epic sadface: Sorry, this user has been locked out.',
    },
    {
      id: 'TC-LOGIN-03',
      name: 'wrong password is rejected',
      username: users.standard.username,
      password: 'definitely-wrong',
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
    {
      id: 'TC-LOGIN-04',
      name: 'empty username is rejected',
      username: '',
      password: PASSWORD,
      error: 'Epic sadface: Username is required',
    },
    {
      id: 'TC-LOGIN-05',
      name: 'empty password is rejected',
      username: users.standard.username,
      password: '',
      error: 'Epic sadface: Password is required',
    },
    {
      id: 'TC-LOGIN-06',
      name: 'SQL-injection-style input is treated as plain credentials',
      username: "' OR 1=1 --",
      password: "' OR 1=1 --",
      error: 'Epic sadface: Username and password do not match any user in this service',
    },
  ];

  for (const c of negativeCases) {
    test(`${c.id} ${c.name}`, async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(c.username, c.password);

      await expect(loginPage.error).toHaveText(c.error);
      // Stays on the login page: no session was created.
      await expect(page).not.toHaveURL(/inventory\.html/);
    });
  }

  test('TC-LOGIN-07 protected page redirects to login when not authenticated', async ({ page, loginPage }) => {
    await page.goto('/inventory.html');

    await expect(page).not.toHaveURL(/inventory\.html/);
    await expect(loginPage.error).toContainText('You can only access');
  });
});
