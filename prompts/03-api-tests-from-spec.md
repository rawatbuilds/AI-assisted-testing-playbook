# Prompt 03: API spec to Playwright API tests

**Goal:** draft API tests from an OpenAPI document or endpoint documentation, with contract, negative and authorisation cases.

## Prompt

```
You are a senior SDET. Write Playwright API tests (TypeScript, using the `request` fixture) for the endpoints below.

Spec
<paste OpenAPI fragment or endpoint docs>

Cover, per endpoint
1. Happy path: status code, response shape (types, required fields), and a round trip (create -> read -> compare).
2. Negative: missing required fields, wrong types, unknown ids, malformed JSON.
3. Authorisation: no token, invalid token, valid token. Confirm a rejected call has no side effect.
4. Idempotency / repeat calls where the spec defines them.

Rules
- Tests create their own data through a fixture and clean it up afterwards.
- Assert the status code the spec documents. If the spec is silent, assert only "not 2xx" and add a comment.
- Never hard-code ids that exist in a shared environment.
- If the real API behaves differently from the docs, do not silently change the expectation. Flag it.
```

## How I use the output

1. Run against the real API and compare every failure with the documentation. Each mismatch is either a **spec bug**, an **API bug**, or a **test bug**, and I classify it before changing anything.
2. Where the API is quirky, I pin the observed behaviour *and* say so in a comment (see `TC-API-03`, which documents that failed auth returns HTTP 200).
3. Remove redundant status-only assertions in favour of shape and side-effect checks.

## Known failure modes

- Assumes REST conventions the API does not follow (401 for bad auth, 204 for delete).
- Checks only the status code and never the response body.
- Reuses one shared record across tests, which creates order dependence.
