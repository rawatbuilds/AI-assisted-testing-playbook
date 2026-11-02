# Test matrix: login

Spec: `tests/ui/login.spec.ts`. Messages below were taken from the running application, not from a model's memory.

| ID | Scenario | Type | Expected result | Automate? |
|----|----------|------|-----------------|-----------|
| TC-LOGIN-01 | Valid standard user | positive | Product list shown, 6 items | Yes |
| TC-LOGIN-02 | Locked-out user | negative | "Epic sadface: Sorry, this user has been locked out." | Yes |
| TC-LOGIN-03 | Wrong password | negative | "Epic sadface: Username and password do not match any user in this service" | Yes |
| TC-LOGIN-04 | Empty username | negative | "Epic sadface: Username is required" | Yes |
| TC-LOGIN-05 | Empty password | negative | "Epic sadface: Password is required" | Yes |
| TC-LOGIN-06 | SQL-injection-style input | security | Treated as plain wrong credentials, no session | Yes |
| TC-LOGIN-07 | Open protected page without logging in | security | Redirected to login with an access error | Yes |
| TC-LOGIN-08 | Brute-force lockout after repeated failures | security | **UNSPECIFIED** for this demo app | No: behaviour not defined by the target |
