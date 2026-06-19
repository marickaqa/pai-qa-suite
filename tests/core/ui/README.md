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
- `tests/fixtures/test-video.mp4` — short test video for job submission
- `tests/fixtures/test-subtitles.srt` — short SRT file for subtitle translation tests

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
Requires `tests/fixtures/test-video.mp4` for file upload tests.

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
| should add a language via the dialog | Selecting Danish in the dialog adds it to the list |
| should remove a language using the remove button | Clicking Remove Russian removes it from the list |

## subtitles-translate.spec.ts

Tests the Translate subtitles form at /jobs/translate.
Uses `reports/subtitles-session.json` for all tests.
Requires `tests/fixtures/test-subtitles.srt` for file upload tests.

| Test | What it checks |
|---|---|
| should show translate subtitles page | Translate subtitles heading and subtitle are visible |
| should show source language auto-detect info | Auto-detected from subtitles info card is visible |
| should show target languages section with search | Target languages section and search button are visible |
| should show pre-selected target languages | English, Spanish and French are pre-selected |
| should show output format options | SRT and VTT subtitle file options are visible |
| should show file upload drop zone for subtitle files | Drop zone, Browse Files button and SRT/VTT label are visible |
| should show Start translation button disabled before file upload | Start translation is disabled with no file |
| should show estimated time section | Estimated time section is visible before file upload |
| should enable Start translation after SRT file is attached | Start translation becomes enabled after file upload |
| should submit a translation job and redirect | Submitting a job redirects away from /jobs/translate |
| should add a language via the dialog | Selecting Danish in the dialog adds it to the list |
| should remove a language using the remove button | Clicking Remove Russian removes it from the list |

## subtitles-jobs.spec.ts

Tests the Jobs list page and job detail page.
Uses `reports/subtitles-session.json` for all tests.

| Test | What it checks |
|---|---|
| should show jobs page with table | Jobs heading, FILE / REFERENCE and STATUS columns are visible |
| should show job rows with file name and status | test-video.mp4 and Completed status are visible |
| should navigate to job detail when row is clicked | Clicking a row navigates to job detail page |
| should show job detail tabs | Activity, Confidence and Violations tabs are visible |
| should show output files with download buttons | Output files section with SRT and VTT download links are visible |
| should show job details panel | Job details panel with Created, File size and Tokens used are visible |
| should show Download all and Re-run buttons | Download all link and Re-run button are visible |

## subtitles-jobs-filter.spec.ts

Tests the Jobs list filtering, search, and pagination.
Uses `reports/subtitles-session.json` for all tests.

| Test | What it checks |
|---|---|
| should show status filter tabs | All, Processing, Completed, Failed and Pending tabs are visible |
| should show job count in All tab | All tab shows a numeric count |
| should filter by Completed status | Clicking Completed tab shows completed jobs |
| should show search bar | Search jobs input is visible |
| should search for a job by filename | Searching test-video shows matching jobs |
| should show Filters button | Filters button is visible |
| should open filters panel when Filters is clicked | Clicking Filters shows Status, Language and Created filter sections |
| should show date range filter options | Last 7 days, Last 30 days and All time options are visible |
| should show pagination info | Showing X-Y of Z jobs text is visible |