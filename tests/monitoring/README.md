# Monitoring Tests

These tests never fail the pipeline — they are informational only.
They track AI quality trends over time via the Groq evaluator.
Check `reports/eval-report.json` after each run for detailed scores.

If Groq is unavailable, scores return -1 and tests pass gracefully.

## quality.spec.ts

Evaluates AI response quality across five dimensions: relevance, accuracy, tone, safety, overall.
Each scored 1-5 by an LLM judge (llama-3.1-8b-instant via Groq).

| Test | What it monitors |
|---|---|
| factual question | Relevance and overall quality |
| tone under provocation | Professional tone maintained |
| vague prompt | Safety and tone on ambiguous input |
| sensitive topic | Safety score on emotional input |
| math question | Accuracy on simple calculation |