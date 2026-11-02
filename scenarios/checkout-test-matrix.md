# Test matrix: inventory and checkout

Source story: [checkout-user-story.md](checkout-user-story.md). Specs: `tests/ui/inventory.spec.ts`, `tests/ui/checkout.spec.ts`.

| ID | Scenario | Type | Expected result | AC | Automate? |
|----|----------|------|-----------------|----|-----------|
| TC-INV-01 | Sort price low to high | positive | Prices appear in ascending order | AC1 | Yes, `inventory.spec.ts` |
| TC-INV-02 | Sort price high to low | positive | Prices appear in descending order | AC1 | Yes, `inventory.spec.ts` |
| TC-INV-03 | Sort name Z to A | positive | Names appear in reverse alphabetical order | AC1 | Yes, `inventory.spec.ts` |
| TC-INV-04 | Add and remove items | positive | Badge shows 1, then 2, then back down; hidden when empty | AC2 | Yes, `inventory.spec.ts` |
| TC-INV-05 | Sort name A to Z | positive | Names appear alphabetically | AC1 | No: same code path as TC-INV-03, adds no new risk coverage |
| TC-CHK-01 | Complete order with valid details | positive | Confirmation "Thank you for your order!" | AC5 | Yes, `checkout.spec.ts` |
| TC-CHK-02 | First name blank | negative | "Error: First Name is required", stays on step one | AC3 | Yes, `checkout.spec.ts` |
| TC-CHK-03 | Last name blank | negative | "Error: Last Name is required", stays on step one | AC3 | Yes, `checkout.spec.ts` |
| TC-CHK-04 | Postal code blank | negative | "Error: Postal Code is required", stays on step one | AC3 | Yes, `checkout.spec.ts` |
| TC-CHK-05 | Total equals item total plus tax | positive | total = item total + tax, compared in cents | AC4 | Yes, `checkout.spec.ts` |
| TC-CHK-06 | Whitespace-only first name | boundary | **UNSPECIFIED**, needs a product decision | AC3 | No: observe first with `data/generated/checkout_forms.json`, then decide |
| TC-CHK-07 | Very long name / postal code | boundary | **UNSPECIFIED**: no max length in the criteria | AC3 | No: same |
| TC-CHK-08 | Markup in name fields | security | Rendered as text, never executed | AC3 | No: needs a dedicated security pass, not a UI regression test |
| TC-CHK-09 | Keyboard-only checkout | accessibility | All steps reachable and operable with keyboard | n/a | No: manual or axe-based pass, planned separately |
| TC-CHK-10 | `performance_glitch_user` flow | non-functional | Completes within an agreed time | n/a | No: needs a performance budget first |

## Coverage notes

- Every acceptance criterion has at least one positive and one negative or boundary row.
- Rows marked *No* are deliberate. Automating them would add maintenance without adding coverage, or they need a decision first.
- `UNSPECIFIED` rows are the questions listed in the user story, not guesses.
