#!/usr/bin/env python3
"""Cluster Playwright failures and prepare a *redacted* prompt for an AI assistant.

Why this exists
---------------
After a red CI run, the slow part is reading 30 stack traces to realise that 25 of
them are the same root cause. This script does the mechanical part:

  1. Reads Playwright's JSON report (reporter: json -> reports/results.json).
  2. Normalises each error message into a signature and groups matching failures.
  3. Classifies each group (network / timeout / locator / assertion / other).
  4. Writes a Markdown summary for humans.
  5. Optionally writes a prompt for an AI assistant with secrets and PII REDACTED.

The AI step is deliberately NOT automated here. The prompt asks for ranked hypotheses
plus the evidence that would confirm each one; a human then checks the trace, because
an AI root cause is a hypothesis until it is verified against the failing run.

Usage:
    python3 scripts/triage_failures.py reports/results.json \
        --out reports/triage.md --prompt-out reports/triage-prompt.md
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ANSI = re.compile(r"\x1b\[[0-9;]*m")

# Applied to anything that leaves the machine inside a prompt.
REDACTIONS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"), "<EMAIL>"),
    (
        re.compile(r"(?i)\b(token|authorization|cookie|password|passwd|secret|api[_-]?key)\b(\"?\s*[:=]\s*\"?)[^\s\",;]+"),
        r"\1\2<REDACTED>",
    ),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._~+/=-]+"), "Bearer <REDACTED>"),
    (re.compile(r"\b[0-9a-fA-F]{32,}\b"), "<HEX>"),
    (re.compile(r"\b(?:\d[ -]?){13,19}\b"), "<NUMBER>"),
]

CATEGORY_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("network", re.compile(r"ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|net::ERR_|getaddrinfo|socket hang up", re.I)),
    ("locator", re.compile(r"strict mode violation|waiting for (?:get|locator)|locator\(|getBy\w+\(", re.I)),
    ("timeout", re.compile(r"timeout \d+ms exceeded|Test timeout|exceeded", re.I)),
    ("assertion", re.compile(r"expect\(", re.I)),
]


@dataclass
class Failure:
    file: str
    title: str
    project: str
    status: str  # unexpected | flaky
    message: str


@dataclass
class Cluster:
    signature: str
    category: str
    failures: list[Failure] = field(default_factory=list)


def clean(text: str) -> str:
    return ANSI.sub("", text or "").strip()


def redact(text: str) -> str:
    for pattern, replacement in REDACTIONS:
        text = pattern.sub(replacement, text)
    return text


def signature_of(message: str) -> str:
    """First two meaningful lines, with volatile parts (numbers, ids, urls) normalised."""
    lines = [ln.strip() for ln in clean(message).splitlines() if ln.strip()]
    head = " | ".join(lines[:2])[:240]
    head = re.sub(r"apiRequestContext\.\w+", "apiRequestContext.<method>", head)  # same cause, different verb
    head = re.sub(r"https?://\S+", "<URL>", head)
    head = re.sub(r"\b[0-9a-fA-F]{8,}\b", "<ID>", head)
    head = re.sub(r"\d+", "N", head)
    # Signatures end up in CI job summaries, so they are redacted too, not just the AI prompt.
    return redact(head) or "(no error message)"


def categorize(message: str) -> str:
    text = clean(message)
    for name, pattern in CATEGORY_RULES:
        if pattern.search(text):
            return name
    return "other"


def walk(suite: dict, file_hint: str, out: list[Failure]) -> None:
    file_hint = suite.get("file") or file_hint
    for spec in suite.get("specs", []):
        for test in spec.get("tests", []):
            if test.get("status") not in ("unexpected", "flaky"):
                continue
            results = test.get("results", [])
            # A flaky test passed on its final retry, so read the last attempt that actually failed.
            failed = [r for r in results if r.get("status") not in ("passed", "skipped")]
            attempt = failed[-1] if failed else (results[-1] if results else {})
            error = attempt.get("error") or (attempt.get("errors") or [{}])[0]
            out.append(
                Failure(
                    file=spec.get("file") or file_hint or "?",
                    title=spec.get("title", "?"),
                    project=test.get("projectName", "?"),
                    status=test["status"],
                    message=error.get("message", ""),
                )
            )
    for child in suite.get("suites", []):
        walk(child, file_hint, out)


def load_failures(report_path: Path) -> tuple[list[Failure], dict]:
    report = json.loads(report_path.read_text(encoding="utf-8"))
    failures: list[Failure] = []
    for suite in report.get("suites", []):
        walk(suite, "", failures)
    return failures, report.get("stats", {})


def cluster(failures: list[Failure]) -> list[Cluster]:
    groups: dict[str, Cluster] = {}
    for f in failures:
        sig = signature_of(f.message)
        if sig not in groups:
            groups[sig] = Cluster(signature=sig, category=categorize(f.message))
        groups[sig].failures.append(f)
    return sorted(groups.values(), key=lambda c: len(c.failures), reverse=True)


def render_summary(clusters: list[Cluster], stats: dict) -> str:
    total = sum(len(c.failures) for c in clusters)
    lines = ["# Failure triage", ""]
    if stats:
        lines.append(
            f"Run stats: expected={stats.get('expected', 0)}, unexpected={stats.get('unexpected', 0)}, "
            f"flaky={stats.get('flaky', 0)}, skipped={stats.get('skipped', 0)}"
        )
        lines.append("")
    if not clusters:
        lines.append("No failing or flaky tests found.")
        return "\n".join(lines) + "\n"

    lines += [
        f"{total} failing or flaky test(s) collapse into {len(clusters)} distinct signature(s).",
        "",
        "| # | Count | Category | Signature |",
        "|---|-------|----------|-----------|",
    ]
    for i, c in enumerate(clusters, 1):
        sig = c.signature.replace("|", "\\|")
        lines.append(f"| {i} | {len(c.failures)} | {c.category} | `{sig}` |")
    lines.append("")

    for i, c in enumerate(clusters, 1):
        lines.append(f"## Cluster {i}: {c.category} ({len(c.failures)})")
        lines.append("")
        for f in c.failures:
            lines.append(f"- `{f.project}` {f.file}: {f.title} ({f.status})")
        lines.append("")

    if any(c.category == "network" for c in clusters):
        lines += [
            "> Network-category failures usually mean the environment could not reach the "
            "target, not that the product is broken. Check connectivity before debugging tests.",
            "",
        ]
    return "\n".join(lines) + "\n"


def render_prompt(clusters: list[Cluster]) -> str:
    body: list[str] = [
        "# Prompt: failure triage",
        "",
        "You are helping a QA engineer triage failed automated tests. The failure clusters below "
        "come from a Playwright run. Secrets and personal data were redacted before sharing.",
        "",
        "For EACH cluster:",
        "1. Give up to 3 ranked root-cause hypotheses (product bug, test bug, environment, test data, timing).",
        "2. For each hypothesis, name the specific evidence that would confirm or rule it out "
        "(trace step, network call, console log, recent commit, data state).",
        "3. State what you CANNOT determine from this text alone.",
        "",
        "Rules: do not propose code fixes yet; do not claim certainty; say 'unknown' where the "
        "information is missing; do not invent selectors, endpoints or log lines.",
        "",
        "## Clusters",
        "",
    ]
    for i, c in enumerate(clusters, 1):
        sample = c.failures[0]
        body += [
            f"### Cluster {i} - category: {c.category} - {len(c.failures)} test(s)",
            f"Signature: {redact(c.signature)}",
            f"Example test: {sample.project} / {sample.title}",
            "Error excerpt:",
            "```",
            redact(clean(sample.message))[:1500],
            "```",
            "",
        ]
    return "\n".join(body) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("report", type=Path, help="Playwright JSON report (e.g. reports/results.json)")
    parser.add_argument("--out", type=Path, default=Path("reports/triage.md"), help="Markdown summary path")
    parser.add_argument("--prompt-out", type=Path, help="also write a redacted AI prompt to this path")
    args = parser.parse_args()

    if not args.report.exists():
        print(f"Report not found: {args.report}. Run `npx playwright test` first.", file=sys.stderr)
        return 2

    failures, stats = load_failures(args.report)
    clusters = cluster(failures)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(render_summary(clusters, stats), encoding="utf-8")
    print(f"{len(failures)} failure(s) -> {len(clusters)} cluster(s); summary: {args.out}")

    if args.prompt_out and clusters:
        args.prompt_out.parent.mkdir(parents=True, exist_ok=True)
        args.prompt_out.write_text(render_prompt(clusters), encoding="utf-8")
        print(f"redacted prompt: {args.prompt_out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
