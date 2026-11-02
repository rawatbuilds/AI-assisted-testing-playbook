import { test, expect } from '../../fixtures/ui';
import { CheckoutPage } from '../../pages/CheckoutPage';

/**
 * Traceability: TC-CHK-* IDs map to scenarios/checkout-test-matrix.md
 */
const shipping = { firstName: 'Asha', lastName: 'Verma', postalCode: '560001' };

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedInInventory: inventory, checkoutPage }) => {
    await inventory.addToCart('sauce-labs-backpack');
    await inventory.cartLink.click();
    await checkoutPage.checkoutButton.click();
  });

  test('TC-CHK-01 completes an order with valid details', async ({ checkoutPage, page }) => {
    await checkoutPage.fillShipping(shipping);
    await checkoutPage.continueButton.click();
    await expect(page).toHaveURL(/checkout-step-two/);

    await checkoutPage.finishButton.click();
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  // Required-field validation, one row per missing field.
  const missingField = [
    { id: 'TC-CHK-02', field: 'firstName', info: { ...shipping, firstName: '' }, error: 'Error: First Name is required' },
    { id: 'TC-CHK-03', field: 'lastName', info: { ...shipping, lastName: '' }, error: 'Error: Last Name is required' },
    { id: 'TC-CHK-04', field: 'postalCode', info: { ...shipping, postalCode: '' }, error: 'Error: Postal Code is required' },
  ];

  for (const c of missingField) {
    test(`${c.id} blocks checkout when ${c.field} is empty`, async ({ checkoutPage, page }) => {
      await checkoutPage.fillShipping(c.info);
      await checkoutPage.continueButton.click();

      await expect(checkoutPage.error).toHaveText(c.error);
      await expect(page).toHaveURL(/checkout-step-one/);
    });
  }

  test('TC-CHK-05 order total equals item total plus tax', async ({ checkoutPage }) => {
    await checkoutPage.fillShipping(shipping);
    await checkoutPage.continueButton.click();

    const subtotal = CheckoutPage.money(await checkoutPage.subtotalLabel.innerText());
    const tax = CheckoutPage.money(await checkoutPage.taxLabel.innerText());
    const total = CheckoutPage.money(await checkoutPage.totalLabel.innerText());

    expect(subtotal).toBeGreaterThan(0);
    // Round to cents to avoid floating-point noise (e.g. 29.99 + 2.4).
    expect(Math.round((subtotal + tax) * 100)).toBe(Math.round(total * 100));
  });
});
