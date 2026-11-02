# Prompt 06: Bug report drafting

**Goal:** turn my raw notes into a clear, reproducible bug report. AI writes the prose, I supply the facts.

## Prompt

```
Turn my notes into a bug report. Use only the facts I give you. Do not add steps, versions or causes.

Notes
<what I did, what I expected, what happened, environment, build, trace/screenshot references>

Format
- Title: <component> - <symptom> (under 80 chars)
- Environment
- Preconditions
- Steps to reproduce (numbered, one action each)
- Expected result
- Actual result
- Evidence (list what is attached)
- Severity / priority suggestion with a one-line reason
- Open questions (anything missing that a developer will ask)
```

## What I check before filing

- I reproduced it myself at least twice, and every step still works as written.
- No invented detail: versions, ids and messages match what I actually saw.
- Severity reflects real user impact, not how dramatic the wording is.
- No customer data, tokens or internal hostnames in the text or screenshots.

## Known failure modes

- Fills gaps with plausible but made-up reproduction steps.
- Inflates severity language ("critical", "severe") without evidence.
- Merges two distinct defects into one report.
