# Known Bug API Tests

These tests run on every push but do NOT fail the pipeline.
They fail loudly so bugs stay visible in the CI report.
When a test passes, the bug is fixed — move it to core tests and remove it from known-bugs.ts.

## status-codes.spec.ts

Tests correct HTTP status codes on the SaaS chatbot API.

**BUG-001** — FIXED on 2026-06-15. DELETE /chatbot/{id} now returns 200/204 correctly.
Moved to tests/core/api/saas.spec.ts.

**BUG-002** — OPEN. GET /chatbot/{id} returns 400 for non-existent resources.
Expected: 404. Actual: 400.

| Test | Expected | Current | Status |
|---|---|---|---|
| DELETE returns 200 or 204 | 200 or 204 | 200 or 204 | ✅ Fixed — moved to core |
| GET non-existent returns 404 | 404 | 400 | ❌ Open |