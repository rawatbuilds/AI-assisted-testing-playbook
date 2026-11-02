import type { Locator, Page } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortSelect: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  /** slug example: "sauce-labs-backpack" */
  async addToCart(slug: string): Promise<void> {
    await this.page.getByTestId(`add-to-cart-${slug}`).click();
  }

  async removeFromCart(slug: string): Promise<void> {
    await this.page.getByTestId(`remove-${slug}`).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  /** Prices as numbers, in on-screen order. */
  async prices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  async names(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }
}
