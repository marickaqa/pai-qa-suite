# pai-qa-suite

Automated test suite for the Perception AI products: the **Egle chatbot**, the **SaaS platform** (paicloud.ai), and the **Subtitles** tool.

Tests run against the **dev** environments. A safety interlock refuses to run against production unless explicitly allowed — see [Production safety](#production-safety).

---

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env          # then fill in the values (see below)
npm run test:core             # API tests
npm run test:ui:core          # browser tests
```

---

## Environment setup

All configuration lives in `.env` (never committed). Copy `.env.example` and fill it in:

- **URLs** — all default to dev. Do not change these to production values.
- **Credentials** — chatbot, SaaS, and subtitles accounts each have their own email/password pair.
- **IDs** — the QA tenant and test-bot IDs used by the suite.
- **`GROQ_API_KEY`** — used by the monitoring tier for AI-based response evaluation.
- **FTP** — used by the subtitles FTP tests.

If a required variable is missing, the setup scripts and global setup fail immediately with a message naming the missing variable.

---

## The test tiers

The suite is organised into tiers, each with its own config and run command. The CI pipeline runs them in order: **core → ui → known-bugs / monitoring**.

| Tier | Command | What it is |
|------|---------|-----------|
| **Core API** | `npm run test:core` | Vitest API tests. The main correctness suite — auth, chat, documents, groups, SaaS config, organisation, subtitles FTP. Must be green. |
| **Core UI** | `npm run test:ui:core` | Playwright browser tests across chatbot, SaaS, and subtitles. Must be green. |
| **Known bugs** | `npm run test:bugs` (API) / `npm run test:ui:bugs` (UI) | Tests that reproduce **registered, unfixed bugs**. These are expected to fail visibly — a *passing* known-bug test means the bug is fixed and the test should be promoted to core. Never used to hide broken functionality. |
| **Monitoring** | `npm run test:monitoring` | Response-quality checks (RAG accuracy, guardrails) using AI evaluation. Non-blocking; tracks drift over time. |
| **Stress (FTP)** | `npm run test:stress:ftp` | Local-only load tests for the subtitles FTP pipeline. Not run in CI. |
| **Prod smoke** | `npm run test:prod-smoke` | Read-only post-deploy checks against **production**. Manual trigger only; requires `ALLOW_PROD=1`. See below. |

Run everything (core API + UI): `npm run test:all`

---

## Production safety

The suite creates and deletes real resources, so it must never run against production by accident.

- A guard (`utils/prodGuard.ts`) runs at the start of every tier. If any target URL points at a known production domain, the run **aborts immediately** unless `ALLOW_PROD=1` is set.
- `.env.example` ships with dev URLs only.
- The **prod smoke** tier is the one intentional exception: it is strictly read-only and still requires `ALLOW_PROD=1` to run.

```powershell
# intentionally run the read-only prod smoke tier
$env:ALLOW_PROD="1"; npm run test:prod-smoke; Remove-Item Env:\ALLOW_PROD
```

**Rule of thumb: if a test creates, edits, or deletes anything, it must never touch production.**

---

## Working with known bugs

Known bugs are tracked in a single registry: `config/known-bugs.ts`. This is the source of truth — don't duplicate bug descriptions across test files.

To register a new bug:

1. Add an entry to `config/known-bugs.ts` (id, description, expected vs actual behaviour, status).
2. Write a test in the appropriate known-bugs tier (`tests/known-bugs/api/` or `tests/known-bugs/ui/`) that reproduces it.
3. The test should **fail visibly** while the bug is open — that's the point.
4. When the bug is fixed, the test starts passing; promote it to the core tier and mark the registry entry fixed.

The guiding principle: **fail loudly over silent skips.** A broken feature that silently passes is worse than a visible red test.

---

## Conventions

- **Teardown discipline** — any test that creates a real resource must delete it afterwards, and the deletion must be verified (not assumed).
- **No `waitForTimeout`** — wait on conditions (element state, network responses), never fixed sleeps. Sleeps are slow and hide real bugs.
- **Probe before writing** — confirm live API/UI behaviour with a quick script before committing a full spec.
- **Full error output** — when reporting a failure, paste the complete output, not a paraphrase.

---

## Repository layout

```
tests/
  core/            core API + UI tests (must be green)
  known-bugs/      registered-bug reproductions (expected red)
  monitoring/      AI-evaluated quality checks
  stress/          local-only load tests
  prod-smoke/      read-only post-deploy checks
  fixtures/        test media (small, in-repo)
config/
  known-bugs.ts    single source of truth for known bugs
utils/             shared helpers (auth, prod guard, preflight, evaluators)
scripts/           one-off setup / maintenance scripts (see scripts/README.md)
```

Config files (`vitest.*.config.ts`, `playwright.config.ts`, `*-setup.ts`) live at the repo root.
