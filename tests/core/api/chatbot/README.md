# Chatbot API Tests

Tests for the PAI chatbot backend at pc-be-dev.noctocode.dev.
Uses Vitest + Axios. Auth tokens are obtained fresh per test file via `/auth/signin`.

## auth.spec.ts

Tests the chatbot authentication endpoints.
Signup tests use a timestamped email (`qa-test-{timestamp}@noctocode.dev`) to avoid conflicts.

| Test | Endpoint | What it checks |
|---|---|---|
| should return a token with valid credentials | POST /auth/signin | Valid credentials return a token string |
| should return 401 with wrong password | POST /auth/signin | Wrong password returns 401 |
| should return 401 with non-existent email | POST /auth/signin | Unknown email returns 401 |
| should return 400 with missing email | POST /auth/signin | Missing email returns 400/422 |
| should return 400 with missing password | POST /auth/signin | Missing password returns 400/422 |
| should return user profile with valid token | GET /auth/get | Valid token returns user id and email |
| should return 401 with no token | GET /auth/get | Missing auth header returns 401 |
| should return 401 with invalid token | GET /auth/get | Garbage token returns 401 |
| should return 200 when signing out with valid token | POST /auth/signout | Signout returns 200/204 |
| should invalidate the token after signout | POST /auth/signout | Token rejected after signout |
| should create a new account with valid data | POST /auth/signup | New timestamped email returns 200/201 |
| should return 409 for already registered email | POST /auth/signup | Duplicate email returns 400/409/422 |
| should return 400 for invalid email format | POST /auth/signup | Invalid email format returns 400/422 |
| should return 400 with missing fields | POST /auth/signup | Empty body returns 400/422 |
| should return 200 for a valid registered email | POST /auth/forgot-password | Known email returns 200 |
| should return 200 for a non-existent email — BUG-020 | POST /auth/forgot-password | Currently returns 400 — user enumeration risk, tracked as BUG-020 |
| should return 400 for missing email | POST /auth/forgot-password | Empty body returns 400/422 |