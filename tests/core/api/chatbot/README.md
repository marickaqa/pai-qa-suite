# Chatbot API Tests

Tests for the PAI chatbot backend at pc-be-dev.noctocode.dev.
Uses Vitest + Axios. A single auth token is obtained via global setup (`vitest.global-setup.ts`) and cached to `reports/api-token.json` — all spec files read from the cache to avoid hitting the rate limit (10 req/min per account).

## auth.spec.ts

Tests the chatbot authentication endpoints.
Signup tests use a timestamped email (`qa-test-{timestamp}@noctocode.dev`) to avoid conflicts.
This file signs in directly — it cannot use the token cache since it tests auth itself.

| Test | Endpoint | What it checks |
|---|---|---|
| should return a token with valid credentials | POST /auth/signin | Valid credentials return a token string |
| should return 401 with wrong password | POST /auth/signin | Wrong password returns 401 |
| should return 401 with non-existent email | POST /auth/signin | Unknown email returns 401 |
| should return 400 with missing email | POST /auth/signin | Missing email returns 400/422 |
| should return 400 with missing password | POST /auth/signin | Missing password returns 400/422 |
| should return user profile with valid token | GET /auth/get | Valid token returns user id and email |
| should return 401 with no token | GET /auth/get | Missing auth header returns 401 |
| should return 401 with invalid token | GET /auth/get | Garbage token returns 401 |
| should return 200 when signing out with valid token | POST /auth/signout | Signout returns 200/204 |
| should invalidate the token after signout | POST /auth/signout | Token rejected after signout |
| should create a new account with valid data | POST /auth/signup | New timestamped email returns 200/201 |
| should return 409 for already registered email | POST /auth/signup | Duplicate email returns 400/409/422 |
| should return 400 for invalid email format | POST /auth/signup | Invalid email format returns 400/422 |
| should return 400 with missing fields | POST /auth/signup | Empty body returns 400/422 |
| should return 200 for a valid registered email | POST /auth/forgot-password | Known email returns 200 |
| should return 200 for a non-existent email — BUG-020 | POST /auth/forgot-password | Currently returns 400 — user enumeration risk, tracked as BUG-020 |
| should return 400 for missing email | POST /auth/forgot-password | Empty body returns 400/422 |

## chat-history.spec.ts

Tests chat CRUD and search endpoints.
Uses cached token from global setup.

| Test | Endpoint | What it checks |
|---|---|---|
| should list all chats for the user | GET /chat | Returns 200 with array of chats |
| should get a specific chat by id | GET /chat/{chatId} | Returns 200 with correct chat id |
| should search chats | GET /chat/search?q=test | Returns 200 |
| should get authenticated user profile | GET /auth/get | Returns user id and email matching env |
| should return 401 with no token on GET /chat | GET /chat | Missing token returns 401 |
| should return 400 or 404 for non-existent chat id | GET /chat/{chatId} | Unknown id returns 400/404 |
| should delete a chat | DELETE /chat/{chatId} | Deletion returns 200/204 and chat is gone |

## chat-documents.spec.ts

Tests document upload, list, download, and delete on a chat.
Uses cached token from global setup. Creates and cleans up a dedicated chat in beforeAll/afterAll.

| Test | Endpoint | What it checks |
|---|---|---|
| should upload a text file and return document metadata | POST /chat/{chatId}/document | Returns 201 with documentId, filename, status |
| should return 400 when no file is provided | POST /chat/{chatId}/document | Missing file returns 400 |
| should return 401 with no token | POST /chat/{chatId}/document | Missing token returns 401 |
| should return 400 or 404 for non-existent chatId | POST /chat/{chatId}/document | Unknown chat returns 400/404 |
| should return documents object with documents array and count | GET /chat/{chatId}/document | Returns object with documents array and count |
| should include the uploaded document in the list | GET /chat/{chatId}/document | Uploaded doc appears in list by id |
| should return 401 with no token | GET /chat/{chatId}/document | Missing token returns 401 |
| should download the uploaded document | GET /chat/{chatId}/document/{id}/download | Returns 200 |
| should return 400 or 404 for non-existent document | GET /chat/{chatId}/document/{id}/download | Unknown doc returns 400/404 |
| should return 401 with no token | GET /chat/{chatId}/document/{id}/download | Missing token returns 401 |
| should delete an uploaded document | DELETE /chat/{chatId}/document/{id} | Returns 200/204 |
| should return 400 or 404 after deleting a document | DELETE /chat/{chatId}/document/{id} | Deleted doc not accessible |
| should return 400 or 404 for non-existent document | DELETE /chat/{chatId}/document/{id} | Unknown doc returns 400/404 |
| should return 401 with no token | DELETE /chat/{chatId}/document/{id} | Missing token returns 401 |

## chat-images.spec.ts

Tests image upload and retrieval on a chat.
Uses cached token from global setup.

| Test | Endpoint | What it checks |
|---|---|---|
| should upload an image and return imageId and url | POST /chats/{chatId}/images | Returns 201 with imageId and URL |
| should return 400 when no file is provided | POST /chats/{chatId}/images | Missing file returns 400 |
| should return 401 with no token | POST /chats/{chatId}/images | Missing token returns 401 |
| should return 400 or 404 for non-existent chatId | POST /chats/{chatId}/images | Unknown chat returns 400/404 |
| should retrieve an uploaded image by id | GET /chats/{chatId}/images/{imageId} | Returns 200 |
| should return 401 with no token | GET /chats/{chatId}/images/{imageId} | Missing token returns 401/500 |
| should return 400 or 404 for non-existent imageId | GET /chats/{chatId}/images/{imageId} | Unknown image returns 400/404/500 |

## chat-groups.spec.ts

Tests chat group conversion and retrieval.
Uses cached token from global setup.
GET /chat/{chatId}/group currently hangs — tracked as BUG-021.

| Test | Endpoint | What it checks |
|---|---|---|
| should convert a chat to a group and return success message | POST /chat/{chatId}/group | Returns 200 with message containing "group" |
| should return 401 with no token | POST /chat/{chatId}/group | Missing token returns 401 |
| should return 400, 403 or 404 for non-existent chatId | POST /chat/{chatId}/group | Unknown chat returns 400/403/404 |
| should return group info for a group chat — BUG-021 | GET /chat/{chatId}/group | Currently hangs and times out — tracked as BUG-021 |
| should return 401 with no token | GET /chat/{chatId}/group | Missing token returns 401 |
| should return 400, 403 or 404 for non-existent chatId | GET /chat/{chatId}/group | Unknown chat returns 400/403/404 |

## chat.spec.ts

Tests the core message sending flow via the chatClient utility.

| Test | Endpoint | What it checks |
|---|---|---|
| should return HTTP 200 | POST /message/{chatId} | Valid prompt returns 200 |
| should return a non-empty message | POST /message/{chatId} | Response message is non-empty string |
| should identify itself as Egle | POST /message/{chatId} | Bot identifies as Egle |
| should respond within 15 seconds | POST /message/{chatId} | Response time under 15s |
| should handle a long prompt without timing out | POST /message/{chatId} | Long prompt completes within 30s |

## schema.spec.ts

Tests response schema validation on the chat API.

| Test | Endpoint | What it checks |
|---|---|---|
| should return a valid response schema | POST /message/{chatId} | Response passes Zod schema validation |
| should always return a string message, never null or undefined | POST /message/{chatId} | Message field is always a string |
| should always return a positive response time | POST /message/{chatId} | responseTime is greater than 0 |
| should return a message with meaningful content | POST /message/{chatId} | Trimmed message is non-empty |

## guardrails.spec.ts

Tests safety guardrails and jailbreak resistance using `datasets/safety.json` and `datasets/jailbreaks.json`.
Known failures (household chemicals, bomb making) are excluded from core and tracked in known-bugs.

| Test | Endpoint | What it checks |
|---|---|---|
| [safety] should refuse harmful prompts | POST /message/{chatId} | Each safety dataset prompt triggers a refusal |
| [jailbreak] should refuse jailbreak attempts | POST /message/{chatId} | Each jailbreak prompt triggers a refusal |

## isolation.spec.ts

Tests multi-tenant data isolation using the SaaS token.
Uses cached SaaS token from global setup.

| Test | Endpoint | What it checks |
|---|---|---|
| should allow access to own organization | GET /organization/{id} | Own org returns 200 |
| should deny access to another organization chatbots | GET /chatbot | Wrong org header returns 403 |
| should deny access to another organization members | GET /organization-members | Wrong org header returns 403 |
| should deny creating resources in another organization | POST /chatbot | Wrong org header returns 403 |
| should deny inviting members to another organization | POST /organization-members/invite | Wrong org header returns 403 |