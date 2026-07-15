# Core API Tests

Tests for the PAI backend APIs. All tests in this tier must pass for the pipeline to stay green.
Uses Vitest + Axios. Auth tokens are cached via global setup to avoid rate limiting.

## Structure

- `chatbot/` — Chatbot API tests (pc-be-dev.noctocode.dev)
- `saas/` — SaaS API tests (pc-be-dev.noctocode.dev)
- `subtitles/` — Subtitles API tests (subtitles-api-dev.paicloud.ai)

See each subdirectory's README for full test details.

## Quick reference

| Spec file | Layer | Tests |
|---|---|---|
| chatbot/auth.spec.ts | Chatbot | 17 |
| chatbot/chat.spec.ts | Chatbot | 5 |
| chatbot/chat-history.spec.ts | Chatbot | 9 |
| chatbot/chat-documents.spec.ts | Chatbot | 14 |
| chatbot/chat-images.spec.ts | Chatbot | 7 |
| chatbot/chat-groups.spec.ts | Chatbot | 6 |
| chatbot/schema.spec.ts | Chatbot | 4 |
| chatbot/guardrails.spec.ts | Chatbot | 16 |
| chatbot/isolation.spec.ts | Chatbot | 5 |
| chatbot/chatbot-resolve.spec.ts | Chatbot | 5 |
| saas/saas.spec.ts | SaaS | 8 |
| saas/organization.spec.ts | SaaS | 7 |
| saas/deployment.spec.ts | SaaS | 6 |
| saas/guidelines.spec.ts | SaaS | 3 + 4 skipped |
| saas/knowledge.spec.ts | SaaS | 7 |
| subtitles/ftp.spec.ts | Subtitles | 3 |
