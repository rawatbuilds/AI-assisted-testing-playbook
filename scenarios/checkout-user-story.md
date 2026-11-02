# Input: user story used for prompt 01

Target: https://www.saucedemo.com (public demo shop). Acceptance criteria below are written for this exercise.

## Story

As a shopper, I want to browse products, add them to a cart and check out with my shipping details, so that I can place an order.

## Acceptance criteria

- **AC1** The product list can be sorted by name (A-Z, Z-A) and by price (low-high, high-low), and the order shown matches the chosen option.
- **AC2** The cart badge shows the number of items in the cart and disappears when the cart is empty.
- **AC3** Checkout requires first name, last name and postal code. Leaving any of them blank shows a specific error and keeps the shopper on the form.
- **AC4** The order overview shows item total, tax and total, and total = item total + tax.
- **AC5** Completing checkout with valid details shows an order confirmation.

## Out of scope

Payment processing, inventory stock levels, performance and cross-browser testing.

## Open questions (raised during matrix review)

- Is whitespace-only input a valid name? (the criteria do not say)
- Is there a maximum length for name and postal code fields?
- Should the postal code be validated against a format?
