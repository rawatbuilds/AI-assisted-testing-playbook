import type { Locator, Page } from '@playwright/test';

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage {
  readonly checkoutButton: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.checkoutButton = page.getByTestId('checkout');
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.completeHeader = page.getByTestId('complete-header');
  }

  /** Fill the shipping form. Pass an empty string to leave a field blank. */
  async fillShipping(info: ShippingInfo): Promise<void> {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
  }

  /** "Item total: $29.99" -> 29.99 */
  static money(label: string): number {
    const match = label.match(/\$(\d+(?:\.\d{1,2})?)/);
    if (!match) throw new Error(`No dollar amount found in label: "${label}"`);
    return Number(match[1]);
  }
}
