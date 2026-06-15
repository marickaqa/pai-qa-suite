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

## incognito.spec.ts

Tests the incognito mode toggle behavior.

| Test | What it checks |
|---|---|
| should show incognito toggle | Toggle is visible on the chat page |
| should be off by default | Toggle starts in off state |
| should turn on when clicked | Toggle switches to on state |
| should turn off when clicked again | Toggle switches back to off state |
| should not save chat to history when incognito is on | Chat count stays the same after sending in incognito |

## theme.spec.ts

Tests the dark/light mode toggle.

| Test | What it checks |
|---|---|
| should start in dark mode | HTML element has dark class on load |
| should switch to light mode when toggle is clicked | Dark class removed after clicking sun icon |
| should switch back to dark mode when toggle is clicked again | Dark class restored after clicking moon icon |

## sidebar.spec.ts

Tests the chat history sidebar behavior.

| Test | What it checks |
|---|---|
| should show chat history heading | Chat History heading is visible |
| should filter chats when searching | Search input filters the chat list |
| should show no results for non-existent search term | No chats shown for gibberish search |
| should clear search and restore all chats | Clearing search restores full chat list |
| should delete a chat | Chat count decreases after deletion |

## file-upload.spec.ts

Tests file attachment behavior in the chat interface.

| Test | What it checks |
|---|---|
| should show filename chip after file is attached | Filename appears as a chip after selecting a file |
| should remove file when X is clicked | Clicking X removes the file chip |
| should accept expected file types | Input accepts .pdf and .txt at minimum |
| should allow sending a message with an attached file | Message with file attached gets a response |