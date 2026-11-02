import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { users } from '../data/users';

type UiFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  checkoutPage: CheckoutPage;
  /** A page already logged in as the standard user. */
  loggedInInventory: InventoryPage;
};

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  loggedInInventory: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.standard.username, users.standard.password);
    await use(new InventoryPage(page));
  },
});

export { expect } from '@playwright/test';
