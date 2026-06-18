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
| should navigate to new job page when Subtitles from video is clicked | Clicking Subtitles from video navigates to /jobs/new |
| should navigate to translate page when Translate subtitles is clicked | Clicking Translate subtitles navigates to /jobs/translate |
| should navigate to jobs when Total Jobs card is clicked | Clicking Total Jobs card navigates to /jobs |
| should navigate to billing when GPU seconds card is clicked | Clicking GPU seconds card navigates to /settings#billing |
| should navigate to billing when Tokens Used card is clicked | Clicking Tokens Used card navigates to /settings#billing |
| should navigate to jobs when View All is clicked | Clicking View All navigates to /jobs |
| should show at least one job in recent jobs | test-video.mp4 appears in recent jobs |
| should show completed status on recent job | At least one Completed status is visible in recent jobs |
| should open New Job menu when clicked | Clicking New Job button opens a dropdown menu |

## subtitles-transcribe.spec.ts

Tests the Transcribe & Translate new job form at /jobs/new.
Uses `reports/subtitles-session.json` for all tests.
Requires `tests/fixtures/test-video.mp4` for file upload tests (gitignored).

| Test | What it checks |
|---|---|
| should show new job page | New job heading and subtitle are visible |
| should show source language auto-detect info | Auto-detected from video info card is visible |
| should show target languages section with search | Target languages section and search button are visible |
| should search and find a target language | Opening language dialog and searching shows results |
| should show pre-selected target languages | English, Spanish and French are pre-selected |
| should show output format options | SRT and VTT subtitle file options are visible |
| should show file upload drop zone | Drop zone, Browse Files button and size limit are visible |
| should show Start processing button disabled before file upload | Start processing is disabled with no file |
| should show estimated time section | Estimated time section is visible before file upload |
| should enable Start processing after file is attached | Start processing becomes enabled after file upload |
| should show estimated time after file is attached | Estimated time placeholder disappears after file upload |
| should submit a job and redirect to jobs page | Submitting a job redirects away from /jobs/new |