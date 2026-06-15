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

## saas-dashboard.spec.ts

Tests the PAI SaaS dashboard behavior.
Uses `reports/saas-session.json` for authenticated tests.

| Test | What it checks |
|---|---|
| should redirect unauthenticated users to login | Accessing dashboard without session redirects to login |
| should login and land on dashboard | Authenticated session lands on dashboard URL |
| should show key dashboard metrics | Total agents, messages, resolution rate, token usage visible |
| should show support bots and AI assistants sections | Both bot type sections visible on overview |
| should show organization name in sidebar | noctocode.dev visible in sidebar |
| should show New button on dashboard | New button visible for creating agents |

## saas-agent.spec.ts

Tests PAI SaaS agent pages — knowledge, guidelines, style config, and team management.
Uses `reports/saas-session.json` for all tests.

| Test | What it checks |
|---|---|
| should show knowledge page with files and crawl sections | Files heading, Website URLs, Upload and Crawl buttons visible |
| should navigate to knowledge from agent sidebar | Sidebar link navigates to knowledge page |
| should show guidelines page with all sections | All guideline sections visible |
| should show New guideline button in each section | At least one New guideline button visible |
| should navigate to guidelines from agent sidebar | Sidebar link navigates to guidelines page |
| should show style config page | Style Config heading, Light and Dark theme visible |
| should show Save changes button | Save changes button visible |
| should show Upload buttons for logo slots | At least 6 Upload buttons visible |
| should show team management page | Team management heading visible |
| should show members table with correct columns | Member, Permissions, Joined columns visible |
| should show Invite member button | Invite member button visible |
| should show pending invitations section | Pending Invitations heading visible |

## widget.spec.ts

Tests the embedded support widget on the Telaris dummy site.

| Test | What it checks |
|---|---|
| should show the chat launcher button | Launcher button visible on page load |
| should open the widget when launcher is clicked | Input textarea visible after opening |
| should show greeting message on open | First bot bubble visible after opening |
| should send a message and clear the input | Input cleared after sending |
| should send message with Enter key | Enter key submits the message |
| should not send empty message | Send button disabled with empty input |
| should close the widget when close button is clicked | Input not visible after closing |
| should handle special characters without crashing | Special chars sent without errors |
| should not expose system prompt instructions | Raw system prompt text not visible |
| should refuse bomb making instructions | Bot refuses harmful request |

## forgot-password.spec.ts

Tests the forgot password flow.

| Test | What it checks |
|---|---|
| should show forgot password form | Form with email input and Send reset link button visible |
| should navigate to forgot password from login page | Forgot password link on login navigates correctly |
| should show confirmation screen after submitting email | Check your email screen shown after submission |
| should navigate back to login when Sign in is clicked | Sign in link navigates back to login |

## image-generation.spec.ts

Tests the image generation toolbar behavior.

| Test | What it checks |
|---|---|
| should show image toolbar when Create image is clicked | Both select dropdowns visible after opening image mode |
| should show all aspect ratio options | Square, widescreen and story options present |
| should show all style options | Fast, balanced, quality and max options present |
| should be able to change aspect ratio | Selecting widescreen updates the value |
| should be able to change quality style | Selecting quality updates the value |
| should close image mode when X is clicked | Dropdowns not visible after closing |