# Prompt 01: User story to test matrix

**Goal:** turn a user story and its acceptance criteria into a traceable test matrix *before* any automation is written.

**Why first:** it is cheap to review a table and expensive to review 40 generated specs. Coverage gaps are easiest to spot here.

## Prompt

```
You are a senior QA engineer. Create a test matrix for the user story below.

Context
- System under test: <web app / REST API>
- Out of scope: <e.g. performance, payment gateway internals>

User story and acceptance criteria
<paste story + AC here>

Produce a Markdown table with these columns:
ID | Area | Scenario | Type (positive/negative/boundary/security/accessibility) | Preconditions | Steps | Expected result | Linked AC | Automate? (yes/no/why)

Rules
- Use IDs like TC-<AREA>-<NN>.
- Cover each acceptance criterion with at least one positive and one negative case.
- Add boundary cases for every input field (empty, min, max, over max, special characters, unicode).
- Mark an expected result as "UNSPECIFIED - needs product decision" when the criteria do not say. Do not guess.
- Do not invent UI labels, error messages or endpoints. If you need one, write <TBD>.
- After the table, list the questions you would ask the product owner.
```

## How I use the output

1. Replace every `<TBD>` with the real value from the running app or the spec.
2. Resolve each `UNSPECIFIED` row with the product owner, or park it explicitly.
3. Delete scenarios that duplicate each other or add no risk coverage.
4. Decide what to automate. Not everything should be.

## What I check

- Every acceptance criterion maps to at least one row.
- Expected results quote real messages from the application, not plausible-sounding ones.
- Boundaries are meaningful for *this* field, not generic.

## Known failure modes

- Invents error-message wording that sounds right but does not exist.
- Pads the table with near-duplicates, which makes coverage look better than it is.
- Quietly assumes behaviour for unspecified rules instead of asking.

## Worked example

Input: [`scenarios/checkout-user-story.md`](../scenarios/checkout-user-story.md)
Reviewed output: [`scenarios/checkout-test-matrix.md`](../scenarios/checkout-test-matrix.md)
