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

## schema.spec.ts

Tests that the API response always has the correct shape and types.

| Test | What it checks |
|---|---|
| should return a valid response schema | Response has status (number), message (string), responseTime (number) |
| should always return a string message, never null or undefined | Message field is always a string, never missing |
| should always return a positive response time | responseTime is always a real measured value above 0 |
| should return a message with meaningful content | Message is not just empty whitespace |

## How the API works

The chatbot uses a two-step flow:
1. `POST /chat` — creates a conversation, returns a `chatId`
2. `POST /message/{chatId}` — sends a message, returns a streamed response

The response is a stream of JSON chunks in the format `data: {"content":"..."}`.
`chatClient.ts` handles both steps and assembles the chunks into a single message string.

## saas.spec.ts

Tests core SaaS chatbot API behavior. Note: DELETE test was previously a known bug (BUG-001)
and was fixed on 2026-06-15.

| Test | What it checks |
|---|---|
| should authenticate with SaaS credentials | SaaS token is returned and has valid length |
| should list chatbots | Returns array with at least one chatbot |
| should create a chatbot | New bot created with correct name and slug |
| should get a chatbot by id | Fetching by ID returns correct bot |
| should delete a chatbot and return 200 or 204 | Deletion succeeds with correct status code |

## organization.spec.ts

Tests SaaS organization management API.

| Test | What it checks |
|---|---|
| should get organization details | Org details returned with id, name, slug, createdAt |
| should list organization members | Members array returned with id, email, permissions |
| should return pagination fields on members list | page and limit fields present |
| should list pending invitations | Invitations array returned |
| should create a member invite | Invite created with correct email |
| should not allow duplicate invite for same email | Second invite for same email returns 4xx |
| should delete the test invite | Invite removed from invitations list |

## knowledge.spec.ts

Tests SaaS knowledge management API — documents, folders, and web crawl jobs.

| Test | What it checks |
|---|---|
| should list documents for a chatbot | Documents array and count returned |
| should list folders for a chatbot | Folders array returned |
| should create a new folder | Folder created with correct chatbotId |
| should rename a folder | Folder name updated correctly |
| should upload a document | Document uploaded and documentId returned |
| should list web crawl jobs | Requests array returned |
| should delete the test folder | Folder removed from folders list |