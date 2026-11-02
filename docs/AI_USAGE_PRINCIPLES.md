# How I use AI in testing

## The short version

AI speeds up the parts of testing that are mechanical. It does not replace the parts that need judgment. I treat it like a fast, eager junior engineer: useful drafts, but everything gets reviewed, and I am accountable for what ships.

## Where AI helps

| Activity | What AI does well | What I still own |
|----------|-------------------|------------------|
| Test design | Suggests scenarios and boundaries I might skip | Deciding what matters, expected results, what *not* to automate |
| Boilerplate | Page objects, fixtures, data-driven loops | Structure, naming, fit with existing conventions |
| Test data | Wide variety of edge inputs | Which expectation is correct for each input |
| Failure triage | Groups symptoms, proposes hypotheses | Verifying against traces before acting |
| Bug reports | Clear, consistent prose | Facts, reproduction, severity |

## Where AI does not help (or hurts)

- **Business rules.** It does not know what the product *should* do. It guesses, and guesses sound confident.
- **Flaky-test root cause.** It tends to suggest `waitForTimeout`, which hides the problem.
- **Anything needing the real DOM, real messages or real API behaviour.** It will invent a plausible selector or error string.
- **Prioritisation.** It will happily generate 200 tests. More tests is not more coverage.

## Rules I follow

1. **AI drafts, I own.** Nothing is committed that I cannot explain line by line.
2. **No real data in prompts.** No customer records, production logs, tokens, internal hostnames or client code. I describe shapes and constraints; I use synthetic data. Logs are redacted before they leave my machine (`scripts/triage_failures.py`).
3. **Verify against the real system.** Every locator, message and status code is confirmed against the running app or API. First-run failures usually mean a hallucination.
4. **A test must be able to fail.** After generation I run a mutation check: change an expected value and confirm the test goes red.
5. **Stable locators only.** Role, label or test id. No XPath by position, no CSS chains, no sleeps.
6. **Independent tests.** Each creates and cleans up its own data. No ordering assumptions.
7. **Traceability.** Test titles carry the matrix ID; the matrix maps to acceptance criteria.
8. **Unspecified means ask.** If the requirement is silent, the case is labelled `unspecified` and goes to the product owner. It is never quietly decided by a model.
9. **AI root cause is a hypothesis.** I confirm it with a trace, a network log or a reproduction before fixing.
10. **Keep a review log.** I record what AI got wrong and what I changed ([REVIEW_LOG.md](REVIEW_LOG.md)). That is how I learn where to trust it less.

## Review checklist for any AI-drafted test

- [ ] Locators exist in the real DOM
- [ ] Expected values come from the spec or the running app, not from the model
- [ ] Assertion checks a behaviour, not just that the page loaded
- [ ] Fails when I deliberately break the expected value
- [ ] No fixed waits, no order dependence, no hard-coded environment data
- [ ] Passes repeatedly (`npx playwright test --repeat-each=5`)
- [ ] No secrets or personal data in the code, prompt or fixtures
- [ ] Title carries the matrix ID

## Risks I watch for

| Risk | Mitigation |
|------|------------|
| Data leakage through prompts | Synthetic data only; redaction step; never paste prod or client material |
| Hallucinated selectors and messages | Run immediately; require "NOT FOUND IN INPUT" instead of guesses |
| False confidence from green tests | Mutation check; assert behaviour; review coverage against acceptance criteria |
| Test bloat | Matrix decides what to automate; delete duplicates |
| Skill erosion | I write the first test of any new area by hand and use AI to extend it |
