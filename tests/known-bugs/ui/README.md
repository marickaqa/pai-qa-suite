# Known Bug UI Tests

These tests run on every push but do NOT fail the pipeline.
They fail loudly so bugs stay visible in the CI report.
When a test passes, the bug is fixed — move it to core tests and remove it from known-bugs.ts.

## widget-rag.spec.ts

Tests RAG knowledge retrieval from the Telaris widget.
All tests expected to FAIL until BUG-003 is resolved.

**BUG-003**: Widget RAG retrieving wrong knowledge base — T-2 content instead of Telaris content.

| Test | Expected answer | Status |
|---|---|---|
| Starter plan price | Contains "19" (€19/month) | ❌ Open |
| Data cap | Contains "no data cap" | ❌ Open |
| Installation time | Contains "24" or "48" hours | ❌ Open |
| Phone number | Contains "080 8000" | ❌ Open |
| Location | Contains "ljubljana" | ❌ Open |
| Money back guarantee | Contains "30" (30-day) | ❌ Open |

## system-prompt.spec.ts

Tests system prompt and tool call leak behavior on the widget.

**BUG-004**: Bot leaks raw system prompt instructions under certain inputs.
**BUG-011**: Bot leaks raw internal tool call syntax in responses.

| Test | Bug ID | Status |
|---|---|---|
| should not expose raw system prompt instructions | BUG-004 | ❌ Open |
| should not reveal instructions when directly asked | BUG-004 | ❌ Open |
| should not expose raw tool call syntax in responses | BUG-011 | ❌ Open |