# AI-Assisted Testing Playbook

A small, working example of how I use AI in test automation: where it speeds me up, where it can't be trusted, and the guardrails I put around it.

It is built around **Playwright (TypeScript)** for UI and API testing, with a reusable prompt library, a test-data generator and a failure-triage tool. Everything runs against public demo systems. There is no employer or client code, data or credentials anywhere in this repo.

**Start here:** [How I use AI in testing](docs/AI_USAGE_PRINCIPLES.md) and the [review log](docs/REVIEW_LOG.md) (what AI got wrong in this very repo, and how I caught it).

## The workflow

```
User story ─► Test matrix ─► Playwright specs ─► Run & verify ─► Triage failures
   │               │                │                  │                │
 human         AI drafts,       AI drafts,        mutation check,   cluster + redact,
 owns          human decides    human reviews     repeat runs       AI hypotheses,
 intent        what to          against the       (a test must      human verifies
               automate         real app          be able to fail)  with the trace
```

AI drafts and suggests. A human decides, verifies and owns the result.

## What is in the repo

| Path | What it shows |
|------|---------------|
| `scenarios/` | A user story, then reviewed test matrices with IDs, expected results, and an explicit *Automate? yes/no/why* column. Unclear requirements are marked `UNSPECIFIED`, never guessed. |
| `prompts/` | Six reusable prompts (matrix, UI specs, API tests, test data, failure triage, bug reports). Each lists how I review the output and its known failure modes. |
| `tests/ui/` | 16 Playwright UI tests for login, inventory sorting, cart and checkout, including a total = subtotal + tax check done in cents. |
| `tests/api/` | 11 Playwright API tests: auth, CRUD round trip, response-shape checks, authorisation with a no-side-effect check, negative cases. API quirks are pinned and commented, not hidden. |
| `pages/`, `fixtures/` | Page Object Model and fixtures. API tests create their own data and clean it up, so they are independent and parallel-safe. |
| `scripts/generate_test_data.py` | Deterministic, offline, synthetic boundary data. Every case is labelled `accept`, `reject` or `unspecified`, because deciding the expected result is the QA job. |
| `scripts/triage_failures.py` | Clusters Playwright failures by error signature, classifies them, and emits a **redacted** prompt for an AI assistant that asks for ranked hypotheses plus the evidence needed to confirm each one. |
| `.github/workflows/playwright.yml` | Typecheck, run tests, triage on failure, upload reports. |

Every test title carries a matrix ID (for example `TC-CHK-05`), so a failing test traces back to a scenario and an acceptance criterion.

## Run it

Requires Node 20+ and Python 3.9+.

```bash
npm install
npx playwright install chromium

npm test                # UI + API
npm run test:ui
npm run test:api
npm run typecheck

npm run data            # regenerate data/generated/*.json
npm run triage          # after a failing run: reports/triage.md + reports/triage-prompt.md
npm run triage:demo     # try the triage tool on a synthetic report, no test run needed
```

Point the tests at your own copies of the demo apps with `UI_BASE_URL` and `API_BASE_URL`.

## Design decisions worth discussing

- **AI proposes, a human decides expected results.** The generated data and the matrices carry an explicit `unspecified` state instead of letting a model pick an answer.
- **A test must be able to fail.** AI-drafted assertions get a mutation check before they are trusted.
- **Behaviour over presence.** Assertions check rules (sort order, totals, no side effect after a rejected delete), not just that an element appeared.
- **Quirks are documented.** The demo API returns HTTP 200 on failed auth and 201 on delete. The tests pin that and say so, rather than pretending it is good API design.
- **Privacy by construction.** Synthetic data only, and logs are redacted before they can go into any prompt. The redaction applies to every output the triage tool writes.
- **Triage is cluster-first.** Eleven failures that share one DNS error are one problem, not eleven. Clustering also keeps prompts small, so there is less to redact and less to leak.

## How this repo was built

It was scaffolded with an AI assistant (Claude), then typechecked, run and corrected. What needed fixing is recorded honestly in [docs/REVIEW_LOG.md](docs/REVIEW_LOG.md).

## Known limits and next steps

- Accessibility (axe-core) and visual regression are not covered yet.
- API responses are shape-checked with hand-written assertions; a schema library (zod or ajv) fed from an OpenAPI document would be the next step.
- `data/generated/` cases marked `unspecified` need a product decision, or characterisation tests, before they become assertions.
- The demo targets are shared public services. Keep runs polite, and do not point load at them.

## License

MIT
