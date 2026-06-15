# Core UI Tests

These tests must always pass. If any fail, the pipeline fails.
All tests use the saved session from `reports/session.json`.
Login tests use a fresh context with no session.

## login.spec.ts

Tests the login page behavior.

| Test | What it checks |
|---|---|
| should show the login form | Email, password fields and Sign In button are visible |
| should login successfully with valid credentials | Valid credentials redirect away from login page |
| should show error with wrong password | Wrong password shows an error, stays on login page |
| should not login with empty email | Empty email does not proceed to dashboard |
| should not login with empty password | Empty password does not proceed to dashboard |

## chat.spec.ts

Tests the core chat interface behavior.

| Test | What it checks |
|---|---|
| should show the main chat UI after login | Textarea, New Chat button and Chat History are visible |
| should send a message and clear the input | After sending, the input field is cleared |
| should show a response after sending a message | A prose response appears after sending |
| should create a new chat when New Chat is clicked | Clicking New Chat shows the welcome message |
| should show chat history in sidebar | At least one chat exists in the sidebar |
| should send message when Enter is pressed | Enter key submits the message |
| should add new line when Shift+Enter is pressed | Shift+Enter adds a newline, does not submit |
| should not send empty message when Enter is pressed | Empty input does not trigger a response |