# Prompt 04: Boundary and edge-case test data

**Goal:** generate synthetic data that probes limits, without leaking real data into a prompt.

## Prompt

```
Generate boundary and edge-case test data for these fields.

Fields and rules
<name: string, 1-50 chars, letters/spaces/hyphens>
<price: integer, 0-100000>
<checkin/checkout: ISO dates, checkout after checkin>

For each field give: valid minimum, valid maximum, just-below, just-above, empty, null/missing,
wrong type, whitespace-only, very long, unicode (Devanagari, emoji), markup/injection probe.

Output as JSON: [{ id, category, expectation, note, payload }]

Rules
- expectation is one of: accept | reject | unspecified.
- Use "unspecified" whenever the rules above do not clearly decide. Do not guess.
- All data must be fictional. No real people, emails, phone numbers or card numbers.
```

## Privacy rule

I never paste production records, customer data or logs into a prompt. I describe the *shape* and *constraints* of the data, never the contents. This repo's generator (`scripts/generate_test_data.py`) is deterministic and offline, so the output is reviewable in a diff.

## How I use the output

The valuable part is the `expectation` column. AI is good at *suggesting* a boundary. It is poor at knowing what the product *should* do with it. Cases labelled `unspecified` become questions for the product owner, or characterisation tests that record observed behaviour without asserting it.
