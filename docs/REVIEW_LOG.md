# AI review log

The point of this log: AI output is a draft. Here is what was wrong with the first draft of this repo, how it was caught, and what changed. Entries 1-6 come from building this repository itself.

| # | Artifact | What the AI-drafted version did | Problem | How it was caught | Fix |
|---|----------|--------------------------------|---------|-------------------|-----|
| 1 | `tsconfig.json` | Used `"moduleResolution": "node"`, the long-standing default | Removed in TypeScript 7 (error TS5108), so `npm run typecheck` fails on a current toolchain | Ran `tsc` instead of assuming it works | Switched to `"module": "preserve"` + `"moduleResolution": "bundler"`, valid for TS 5.4+ and 7 |
| 2 | `scripts/triage_failures.py` | Read the **last** attempt of each test to get its error | For a flaky test the last attempt is the *passing* retry, so the error was empty and the failure was filed under "(no error message)" | Ran the script on a fixture containing a flaky test | Read the last attempt that actually failed |
| 3 | `scripts/triage_failures.py` | Redacted emails and tokens in the AI prompt only | The Markdown summary, which CI appends to the public job summary, still contained them | `grep` for the planted email and token in every output file | Redact at signature creation, so every output is clean |
| 4 | `.github/workflows/playwright.yml` | Used `npm ci` and `cache: npm` | Both need a `package-lock.json`, which did not exist yet, so the first CI run would fail | Reviewing why `npm install` could not produce a lockfile in the authoring environment | `npm install` with a comment to switch to `npm ci` once a lockfile is committed |
| 5 | `scripts/triage_failures.py` | Treated `.get` and `.post` failures as different errors | One root cause (DNS failure) was split into two clusters | Ran the script on a **real** Playwright report, not just the fixture | Normalise the HTTP verb in the signature; 11 failures now collapse to 1 cluster |
| 6 | My own verification | Passed `--reporter=line` on the CLI | That overrides the configured reporters, so `reports/results.json` was stale output from an earlier `--list` run and the triage reported "0 failures" | Noticed `skipped=27` did not match a run that had just failed | Re-ran with the repo's own reporters. Lesson: check that the input you are triaging is the run you think it is |

## Patterns worth remembering

- **Config and tooling defaults go stale.** AI reproduces what was common in training data. Run it against the current toolchain.
- **"Last result" logic breaks on retries.** Anything that reads Playwright results must think about retries and flaky status.
- **Redaction has to cover every output path**, not just the one you were thinking about.
- **Test the tooling on real output**, not only on hand-written fixtures. A fixture encodes your assumptions about the format.

## What I could not verify while building this

The UI and API specs were typechecked and confirmed to be discovered by Playwright (27 tests), but they were **not executed against the live demo sites** in the authoring environment, which had no route to them. Selectors, error messages and status codes in the specs come from the demo apps' public behaviour and must be confirmed by a real run. Anything that fails on the first run is most likely a wrong locator, message or status code. Record those below.

## First live run (fill this in)

| # | Test ID | What failed | Cause (AI draft wrong / app quirk / environment) | Fix |
|---|---------|-------------|--------------------------------------------------|-----|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## Mutation checks (fill this in)

For a sample of tests, deliberately break the expected value and confirm the test goes red.

| Test ID | Change made | Went red? |
|---------|-------------|-----------|
| TC-LOGIN-03 | Changed the expected error text | |
| TC-CHK-05 | Added 1 cent to the expected total | |
| TC-API-07 | Changed expected status 403 to 200 | |
