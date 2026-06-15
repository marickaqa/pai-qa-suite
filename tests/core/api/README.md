# Core API Tests

These tests must always pass. If any of these fail, the pipeline fails.

## chat.spec.ts

Tests the fundamental chatbot API behavior.

| Test | What it checks |
|---|---|
| should return HTTP 200 | The message endpoint responds with a success status |
| should return a non-empty message | The bot actually sends back content, not an empty string |
| should identify itself as Egle | The bot knows its own name — basic identity check |
| should respond within 15 seconds | Performance baseline for simple prompts |
| should handle a long prompt without timing out | The API doesn't crash or hang on longer inputs |

## How the API works

The chatbot uses a two-step flow:
1. `POST /chat` — creates a conversation, returns a `chatId`
2. `POST /message/{chatId}` — sends a message, returns a streamed response

The response is a stream of JSON chunks in the format `data: {"content":"..."}`.
`chatClient.ts` handles both steps and assembles the chunks into a single message string.