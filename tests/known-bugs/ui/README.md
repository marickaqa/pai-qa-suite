# Known Bug UI Tests

These tests run on every push but do NOT fail the pipeline.
They fail loudly in the report so bugs stay visible.
When a test starts passing, the bug is fixed — remove it from known-bugs.ts.

## widget-rag.spec.ts

Tests RAG knowledge retrieval from the Telaris widget.
All tests in this file are expected to FAIL until BUG-003 is resolved.

**BUG-003**: Widget RAG retrieval not surfacing crawled Telaris content.
Bot has 18 pages of Telaris content indexed but answers from general LLM knowledge instead.

| Test | Expected answer | Bug behavior |
|---|---|---|
| Starter plan price | Contains "19" (€19/month) | General LLM answer |
| Data cap | Contains "no data cap" | General LLM answer |
| Installation time | Contains "24" or "48" hours | General LLM answer |
| Phone number | Contains "080 8000" | General LLM answer |
| Location | Contains "ljubljana" | General LLM answer |
| Money back guarantee | Contains "30" (30-day) | General LLM answer |