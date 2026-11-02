import { test, expect } from '../../fixtures/ui';

/**
 * Traceability: TC-INV-* IDs map to scenarios/checkout-test-matrix.md
 */
test.describe('Inventory', () => {
  test('TC-INV-01 price low-to-high sorts ascending', async ({ loggedInInventory: inventory }) => {
    await inventory.sortBy('lohi');

    const prices = await inventory.prices();
    expect(prices).toHaveLength(6);
    // Compare against an independently sorted copy, not against a hard-coded list.
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('TC-INV-02 price high-to-low sorts descending', async ({ loggedInInventory: inventory }) => {
    await inventory.sortBy('hilo');

    const prices = await inventory.prices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('TC-INV-03 name Z-to-A sorts reverse alphabetically', async ({ loggedInInventory: inventory }) => {
    await inventory.sortBy('za');

    const names = await inventory.names();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('TC-INV-04 cart badge tracks add and remove', async ({ loggedInInventory: inventory }) => {
    await expect(inventory.cartBadge).toHaveCount(0);

    await inventory.addToCart('sauce-labs-backpack');
    await expect(inventory.cartBadge).toHaveText('1');

    await inventory.addToCart('sauce-labs-bike-light');
    await expect(inventory.cartBadge).toHaveText('2');

    await inventory.removeFromCart('sauce-labs-backpack');
    await expect(inventory.cartBadge).toHaveText('1');

    await inventory.removeFromCart('sauce-labs-bike-light');
    await expect(inventory.cartBadge).toHaveCount(0);
  });
});
