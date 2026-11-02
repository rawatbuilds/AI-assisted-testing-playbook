# Prompt 02: Test matrix to Playwright spec

**Goal:** draft Playwright (TypeScript) specs for matrix rows that are marked *Automate: yes*.

## Prompt

```
You are a senior SDET writing Playwright tests in TypeScript.

Project conventions
- Page Object Model: locators live in pages/*.ts, tests contain no raw selectors.
- Locators: prefer getByRole / getByLabel / getByTestId. No XPath, no nth-child, no CSS chains.
- No page.waitForTimeout(). Use web-first assertions (expect(locator).toHaveText etc.).
- Each test is independent: its own setup, no reliance on execution order.
- Test titles start with the matrix ID, e.g. "TC-LOGIN-03 wrong password is rejected".
- Data-driven cases use an array + loop, one row per matrix row.

I will paste: (1) the matrix rows to automate, (2) the existing page objects, (3) HTML or an accessibility snapshot of the real page.

Output
- The spec file only, then a list of every locator you used and where in the supplied HTML you found it.
- If a locator or message is not present in the supplied material, write <NOT FOUND IN INPUT> instead of guessing.
```

## How I use the output

1. Run it against the real app. Anything that fails on first run is a hallucinated locator or message.
2. **Mutation check:** change an expected value and confirm the test goes red. A test that cannot fail is not a test.
3. Remove assertions that only check the page loaded when a business rule should be checked.
4. Move repeated setup into fixtures.

## What I check

- Assertions verify behaviour (total = subtotal + tax), not just presence.
- No fixed sleeps, no order dependence, no hard-coded environment URLs.
- Locators exist in the real DOM, confirmed with the Playwright inspector.

## Known failure modes

- Hallucinated `data-test` ids and error strings.
- `expect(await locator.isVisible()).toBe(true)` instead of web-first assertions, which loses auto-waiting and produces flaky tests.
- Happy-path-only coverage unless negatives are asked for explicitly.
- Overly broad `toContainText` assertions that pass for the wrong reason.
