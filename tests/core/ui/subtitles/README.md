# Subtitles Tests

Tests for the PAI Subtitles product at subtitles-dev.paicloud.ai.
No self-service signup — users are created by superadmin or tenant admins.

## Test Accounts

| Account | Role | Tenant |
|---|---|---|
| qa-subtitles@noctocode.com | Admin | qa-automation |
| qa-notenant2@noctocode.com | User | None |

## Setup

Test accounts are created and verified via scripts:
- `scripts/setup-subtitles-qa.ts` — creates QA tenant and users
- `scripts/verify-subtitles-users.ts` — verifies email and sets passwords

## subtitles-auth.spec.ts

Tests the PAI Subtitles authentication flows.
Uses a fresh context with no session for all tests.

| Test | What it checks |
|---|---|
| should redirect unauthenticated users to login | Accessing / without session redirects to login |
| should show sign in form | Email, password fields and Sign In button are visible |
| should sign in with valid credentials | Valid credentials redirect away from login page |
| should show error with wrong password | Wrong password stays on login page |
| should not sign in with empty email | Empty email stays on login page |
| should not sign in with empty password | Empty password stays on login page |
| should show no-tenant state for user without a tenant | User with no tenant sees no organizations screen |
| should sign out and redirect to login | Clicking sign out redirects to login page |