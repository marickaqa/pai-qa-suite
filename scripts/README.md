# scripts/

One-off setup and maintenance scripts. These are **not** part of the test suite — they're run by hand when setting up or fixing the QA environment.

Run them with `tsx` (the tsconfig uses ESM + bundler resolution, which `ts-node` can't execute):

```bash
npx tsx scripts/<name>.ts
```

All scripts read credentials and IDs from `.env`. None of them print secrets.

| Script | What it does | Safe to re-run? |
|--------|--------------|-----------------|
| `setup-subtitles-qa.ts` | Creates the subtitles QA test users (QA-automation user + no-tenant user) and adds them to the QA tenant. | ⚠️ Re-running errors if users already exist — that's fine, it just means setup is already done. |
| `verify-subtitles-users.ts` | Marks the no-tenant QA user's email as verified. | ✅ Idempotent. |
| `check-jobs.ts` | Lists the current subtitles jobs for the QA tenant. Read-only diagnostic. | ✅ Read-only, always safe. |
| `submit-test-job.ts` | Submits a test video transcription/translation job (uses `tests/fixtures/test-video.mp4`). | ✅ Safe, but each run creates a real job — don't spam it. |
| `test-ftp.ts` | Connects to the FTP server and verifies access. Read-only diagnostic. | ✅ Read-only, always safe. |
| `create-second-tenant.ts` | Creates a second subtitles tenant (for multi-org / isolation testing). | ⚠️ Creates real state. Run once; use `delete-second-tenant.ts` to undo. |
| `delete-second-tenant.ts` | Deletes the second tenant created above (hardcoded tenant ID). | ⚠️ Destructive. Only affects the known second-tenant ID. |
| `fix-subtitles-tenant.ts` | Repair script for the QA tenant's membership/config when it drifts. | ⚠️ Run only when the QA tenant is in a broken state; check what it does first. |

**Legend:** ✅ safe to run anytime · ⚠️ creates or changes real state — read before running.

If you add a new script, add a row here so the next person knows whether it's safe to run.
