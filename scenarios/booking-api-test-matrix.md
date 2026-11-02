# Test matrix: booking API

Spec: `tests/api/booking.spec.ts`. Target: https://restful-booker.herokuapp.com (public demo API, intentionally quirky).

| ID | Scenario | Type | Expected result | Automate? |
|----|----------|------|-----------------|-----------|
| TC-API-01 | Health check | positive | 201 on `/ping` (this API's convention) | Yes |
| TC-API-02 | Valid credentials | positive | Token returned | Yes |
| TC-API-03 | Bad credentials | negative | No token, reason "Bad credentials". **Quirk:** HTTP 200, not 401 | Yes, pins observed behaviour and says so |
| TC-API-04 | Create booking | positive | Id returned, body echoes input, shape valid | Yes |
| TC-API-05 | Read booking by id | positive | Returns what was created | Yes |
| TC-API-06 | Update with token | positive | 200 and the change is visible on re-read | Yes |
| TC-API-07 | Delete without token | security | 403, booking still exists (no side effect) | Yes |
| TC-API-08 | Delete with token | positive | 201 (quirk), subsequent read is 404 | Yes |
| TC-API-09 | Missing required field | negative | Not accepted (demo API returns 500, so only "not 2xx" is asserted) | Yes |
| TC-API-10 | Filter by first name | positive | Created booking id is in the result list | Yes |
| TC-API-11 | Unknown id | negative | 404 | Yes |
| TC-API-12 | Boundary and wrong-type payloads | boundary | **UNSPECIFIED**, see `data/generated/bookings.json` | Partly: generated, then observed by a human before any assertion is written |

## Notes

- Quirks are pinned and commented, not hidden. A stricter real-world API would return 401 for bad auth and 204 for delete.
- Each test creates its own booking through a fixture and removes it afterwards, so tests are independent and can run in parallel.
