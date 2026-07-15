# SaaS API Tests

Tests for the PAI SaaS backend at pc-be-dev.noctocode.dev.
Uses Vitest + Axios. A SaaS token is obtained via global setup (`vitest.global-setup.ts`) and cached to `reports/saas-api-token.json`.

## saas.spec.ts

Tests core SaaS chatbot CRUD operations.

| Test | Endpoint | What it checks |
|---|---|---|
| should authenticate with SaaS credentials | POST /auth/signin | SaaS token returned with valid length |
| should list chatbots | GET /chatbot/list | Returns array with at least one chatbot |
| should limit results when limit param is set | GET /chatbot/list?limit=1 | Returns exactly 1 result |
| should return different results for different pages | GET /chatbot/list?page=0&page=1 | Different pages return different results |
| should return empty array for out-of-range page | GET /chatbot/list?page=99 | Returns empty array |
| should create a chatbot | POST /chatbot | New bot created with correct name and slug |
| should get a chatbot by id | GET /chatbot/{id} | Fetching by ID returns correct bot |
| should delete a chatbot and return 200 or 204 | DELETE /chatbot/{id} | Deletion succeeds with correct status |

## organization.spec.ts

Tests SaaS organization management API.

| Test | Endpoint | What it checks |
|---|---|---|
| should return organization details by id | GET /organization/{id} | Returns org with id, name, slug, createdAt |
| should list organization members | GET /organization/{id}/members | Returns members array with id, email, permissions |
| should return pagination fields on members list | GET /organization/{id}/members | page and limit fields present |
| should list pending invitations | GET /organization/{id}/invitations | Returns invitations array |
| should create a member invite | POST /organization/{id}/invitations | Invite created with correct email |
| should not allow duplicate invite for same email | POST /organization/{id}/invitations | Second invite returns 4xx |
| should delete the test invite | DELETE /organization/{id}/invitations/{inviteId} | Invite removed from list |

## deployment.spec.ts

Tests chatbot deployment and members API.

| Test | Endpoint | What it checks |
|---|---|---|
| should successfully deploy a chat type bot | POST /chatbot/{id}/deploy | Deploy returns 200 with message and domain |
| should return a valid domain after deployment | POST /chatbot/{id}/deploy | Domain matches known TLD pattern |
| should reject deployment of support type bot | POST /chatbot/{id}/deploy | Support bots return 400 |
| should reject deployment with invalid bot ID | POST /chatbot/{id}/deploy | Invalid ID returns 400, 403 or 404 |
| should list members for a chatbot | GET /chatbot/{id}/members | Members array with page and limit returned |
| should return 400 for non-existent bot members | GET /chatbot/{id}/members | Invalid bot ID returns error status |

## guidelines.spec.ts

Tests prompt templates and bot configuration API.
4 tests are skipped — pending GET /chatbot/{id}/config endpoint with options type (tracked).

| Test | Endpoint | What it checks |
|---|---|---|
| should list prompt templates | GET /chatbot/{id}/prompt-templates | Returns array with id, name, content, type, section |
| should return prompt templates with valid sections | GET /chatbot/{id}/prompt-templates | All sections match known valid values |
| should filter prompt templates by chatbotType | GET /chatbot/{id}/prompt-templates | All templates have support or chat type |

## knowledge.spec.ts

Tests SaaS knowledge management API — documents, folders, and web crawl jobs.

| Test | Endpoint | What it checks |
|---|---|---|
| should list documents for a chatbot | GET /chatbot/{id}/documents | Returns documents array and count |
| should list folders for a chatbot | GET /chatbot/{id}/folders | Returns folders array |
| should create a new folder | POST /chatbot/{id}/folders | Folder created with correct chatbotId |
| should rename a folder | PATCH /chatbot/{id}/folders/{folderId} | Folder name updated correctly |
| should upload a document | POST /chatbot/{id}/documents | Document uploaded and documentId returned |
| should list web crawl jobs | GET /chatbot/{id}/crawl-jobs | Returns requests array |
| should delete the test folder | DELETE /chatbot/{id}/folders/{folderId} | Folder removed from list |
