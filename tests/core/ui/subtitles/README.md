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
- `scripts/fix-subtitles-tenant.ts` — accepts pending tenant invite for QA user
- `scripts/submit-test-job.ts` — submits a test video job to populate the QA tenant

Test fixtures:
- `tests/fixtures/test-video.mp4` — short test video for job submission (gitignored)

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
| should sign out and redirect to login | Clicking sign out redirects to login page |

## subtitles-dashboard.spec.ts

Tests the PAI Subtitles dashboard overview page.
Uses `reports/subtitles-session.json` for all tests.

| Test | What it checks |
|---|---|
| should land on overview after login | Overview heading is visible |
| should show navigation items | Overview, Jobs, Transcribe & Translate, Translate and Team links are visible |
| should show New Job button | New Job button is visible |
| should show search bar | Search jobs input is visible |
| should show theme toggle | Theme toggle button is visible |
| should show action cards | Subtitles from video and Translate subtitles cards are visible |
| should show metrics cards | Total Jobs, GPU usage, Top Languages and Tokens Used cards are visible |
| should show total jobs as a number | Total Jobs card is visible |
| should show processing volume chart | Processing Volume - last 7 days chart is visible |
| should show recent jobs section | Recent Jobs section and View All link are visible |
| should show recent jobs table columns | FILE / REFERENCE, DURATION and STATUS columns are visible |
| should navigate to jobs page | Clicking Jobs navigates to /jobs |
| should navigate to team page | Clicking Team navigates to /team |