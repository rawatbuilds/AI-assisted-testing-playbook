#!/usr/bin/env python3
"""Generate synthetic, boundary-focused test data for the booking API and checkout form.

Design rules (see docs/AI_USAGE_PRINCIPLES.md):
  * Everything is synthetic. No real names, emails, card numbers or production data.
  * Deterministic: the same --seed always produces the same files, so diffs are reviewable.
  * Every case carries an explicit `expectation`:
        accept       -> the spec clearly says this must be accepted
        reject       -> the spec clearly says this must be refused
        unspecified  -> the spec is silent; a human decides after observing behaviour
    AI-suggested boundaries are cheap; deciding the *expected result* is the QA job,
    so unclear cases are labelled "unspecified" instead of being guessed.

Usage:
    python3 scripts/generate_test_data.py --seed 7 --out data/generated
"""
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

FIRST_NAMES = ["Asha", "Rohan", "Meera", "Kabir", "Ishita", "Vikram", "Nisha", "Arjun"]
LAST_NAMES = ["Verma", "Iyer", "Nair", "Singh", "Rao", "Kulkarni", "Das", "Mehta"]


def base_booking(rng: random.Random) -> dict:
    return {
        "firstname": rng.choice(FIRST_NAMES),
        "lastname": rng.choice(LAST_NAMES),
        "totalprice": rng.randint(100, 5000),
        "depositpaid": rng.choice([True, False]),
        "bookingdates": {"checkin": "2026-12-01", "checkout": "2026-12-05"},
        "additionalneeds": rng.choice(["Breakfast", "Late checkout", "Airport pickup"]),
    }


def case(case_id: str, category: str, expectation: str, payload: dict, note: str = "") -> dict:
    return {
        "id": case_id,
        "category": category,
        "expectation": expectation,
        "note": note,
        "payload": payload,
    }


def booking_cases(rng: random.Random) -> list[dict]:
    cases: list[dict] = []

    # 1) Valid records: the spec clearly accepts these.
    for i in range(1, 4):
        cases.append(case(f"BK-VALID-{i:02d}", "valid", "accept", base_booking(rng)))

    # 2) Missing required fields: the spec clearly rejects these.
    for field in ["firstname", "lastname", "totalprice", "depositpaid", "bookingdates"]:
        payload = base_booking(rng)
        del payload[field]
        cases.append(case(f"BK-MISSING-{field.upper()}", "missing-required", "reject", payload, f"omits {field}"))

    # 3) Boundaries the spec does not define: observe first, decide later.
    def variant(case_id: str, category: str, note: str, **changes) -> None:
        payload = base_booking(rng)
        payload.update(changes)
        cases.append(case(case_id, category, "unspecified", payload, note))

    variant("BK-PRICE-ZERO", "boundary", "free booking", totalprice=0)
    variant("BK-PRICE-NEGATIVE", "boundary", "negative price", totalprice=-1)
    variant("BK-PRICE-HUGE", "boundary", "very large price", totalprice=2_147_483_647)
    variant("BK-PRICE-DECIMAL", "boundary", "fractional price", totalprice=99.99)
    variant("BK-NAME-ONE-CHAR", "boundary", "1-character name", firstname="A", lastname="B")
    variant("BK-NAME-LONG-256", "boundary", "256-character name", firstname="A" * 256)
    variant("BK-NAME-UNICODE", "boundary", "non-Latin names", firstname="आशा", lastname="वर्मा")
    variant("BK-NAME-WHITESPACE", "boundary", "whitespace-only name", firstname="   ")
    variant("BK-NAME-MARKUP", "boundary", "markup in a name field (stored XSS probe)", firstname="<b>x</b>")
    variant("BK-TYPE-PRICE-STRING", "wrong-type", "price sent as a string", totalprice="1250")
    variant("BK-TYPE-DEPOSIT-STRING", "wrong-type", "deposit flag sent as a string", depositpaid="yes")
    variant(
        "BK-DATES-REVERSED",
        "boundary",
        "checkout before checkin",
        bookingdates={"checkin": "2026-12-05", "checkout": "2026-12-01"},
    )
    variant(
        "BK-DATES-SAME-DAY",
        "boundary",
        "zero-night stay",
        bookingdates={"checkin": "2026-12-01", "checkout": "2026-12-01"},
    )
    variant(
        "BK-DATES-BAD-FORMAT",
        "wrong-format",
        "date in DD/MM/YYYY",
        bookingdates={"checkin": "01/12/2026", "checkout": "05/12/2026"},
    )
    return cases


def checkout_cases() -> list[dict]:
    """Shipping-form inputs. Postal codes are synthetic and not tied to real people."""
    rows = [
        ("CF-VALID-01", "valid", "accept", ("Asha", "Verma", "560001"), "typical"),
        ("CF-VALID-02", "valid", "accept", ("Li", "Wu", "10001"), "short names"),
        ("CF-EMPTY-FIRST", "missing-required", "reject", ("", "Verma", "560001"), "first name blank"),
        ("CF-EMPTY-LAST", "missing-required", "reject", ("Asha", "", "560001"), "last name blank"),
        ("CF-EMPTY-POSTAL", "missing-required", "reject", ("Asha", "Verma", ""), "postal code blank"),
        ("CF-WHITESPACE-FIRST", "boundary", "unspecified", ("   ", "Verma", "560001"), "whitespace-only first name"),
        ("CF-LONG-NAME", "boundary", "unspecified", ("A" * 300, "Verma", "560001"), "300-character first name"),
        ("CF-POSTAL-LETTERS", "boundary", "unspecified", ("Asha", "Verma", "ABCDE"), "letters in postal code"),
        ("CF-POSTAL-LONG", "boundary", "unspecified", ("Asha", "Verma", "1" * 40), "40-digit postal code"),
        ("CF-MARKUP", "boundary", "unspecified", ("<script>x</script>", "Verma", "560001"), "markup in a name field"),
        ("CF-UNICODE", "boundary", "unspecified", ("आशा", "वर्मा", "560001"), "non-Latin names"),
    ]
    return [
        case(cid, cat, exp, {"firstName": f, "lastName": l, "postalCode": p}, note)
        for cid, cat, exp, (f, l, p), note in rows
    ]


def write_json(path: Path, cases: list[dict]) -> None:
    path.write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--seed", type=int, default=7, help="RNG seed (default: 7)")
    parser.add_argument("--out", type=Path, default=Path("data/generated"), help="output directory")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    rng = random.Random(args.seed)

    bookings = booking_cases(rng)
    checkout = checkout_cases()
    write_json(args.out / "bookings.json", bookings)
    write_json(args.out / "checkout_forms.json", checkout)

    def summary(name: str, cases: list[dict]) -> str:
        counts: dict[str, int] = {}
        for c in cases:
            counts[c["expectation"]] = counts.get(c["expectation"], 0) + 1
        return f"{name}: {len(cases)} cases ({', '.join(f'{k}={v}' for k, v in sorted(counts.items()))})"

    print(summary("bookings.json", bookings))
    print(summary("checkout_forms.json", checkout))
    print(f"written to {args.out}/")


if __name__ == "__main__":
    main()
