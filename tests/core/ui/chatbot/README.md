# Chatbot UI Tests

Tests for the PAI chatbot at pc-fe-dev.noctocode.dev.
Uses `reports/session.json` for all authenticated tests.
Login, signup and forgot-password tests use a fresh context with no session.

## login.spec.ts

Tests the login page behavior.

| Test | What it checks |
|---|---|
| should show the login form | Email, password fields and Sign In button are visible |
| should login successfully with valid credentials | Valid credentials redirect away from login page |
| should show error with wrong password | Wrong password shows an error, stays on login page |
| should not login with empty email | Empty email does not proceed to dashboard |
| should not login with empty password | Empty password does not proceed to dashboard |
| should show password toggle icon | Eye icon is visible next to the password field |
| should show password in plain text when toggle is clicked | Input type changes from password to text after clicking toggle |
| should hide password again when toggle is clicked twice | Input type returns to password after clicking toggle twice |

## signup.spec.ts

Tests the signup flow from the login page.
Uses a fresh context with no session.

| Test | What it checks |
|---|---|
| should show signup link on login page | Sign Up link is visible on the login page |
| should navigate to signup page when link is clicked | Clicking Sign Up navigates to /signup |
| should show signup form with all fields | Email, password and confirm password fields and Sign Up button are visible |
| should not submit with empty fields | Empty form does not proceed past signup page |
| should show error for mismatched passwords | Mismatched passwords show an error message |
| should show error for invalid email format | Invalid email format stays on signup page |
| should show error for already registered email | Existing email shows an error message |
| should show sign in link on signup page | Sign In link is visible on the signup page |
| should show generic confirmation for already registered email (no enumeration) | Same check your email confirmation shown regardless of whether email is registered |

## logout.spec.ts

Tests the logout flow from the chatbot UI.
Logout is accessed via the profile button at the bottom of the sidebar.
Uses the saved session from `reports/session.json`.

| Test | What it checks |
|---|---|
| should show email in profile button before logout | Profile button with email is visible in sidebar |
| should show logout option when profile is clicked | Clicking profile button shows Log out option |
| should log out and redirect to login page | Clicking Log out redirects to login page |
| should not be able to access chat after logout | Navigating to / after logout redirects to login |

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
| should rename chat via header button | Rename modal opens, new name saved and visible in header |
| should rename chat via sidebar history button | Rename modal opens from sidebar, new name saved and visible |
| should copy chat response to clipboard | Copy button copies bot response text to clipboard |
| should always show copy button on assistant response without hover | Copy button visible on assistant messages without hovering |
| should show download button on assistant response | Download button visible on assistant messages |
| should show PDF Markdown and DOCX options when download button is clicked | Clicking Download shows PDF, Markdown and DOCX format options |
| should close download dropdown when a format is selected | Selecting a format closes the dropdown |

## multi-turn.spec.ts

Tests multi-turn conversation context retention.
Each test starts a fresh chat to ensure isolation.
Verifies the bot remembers information from earlier in the same conversation and does not leak context across separate chats.

| Test | What it checks |
|---|---|
| should remember a name given earlier in the conversation | Bot recalls a name established two turns earlier |
| should remember a number given earlier in the conversation | Bot recalls a number established two turns earlier |
| should maintain context across three turns | Bot recalls destination and duration after three exchanges |
| should not confuse context from a new chat | A new chat has no memory of the previous chat's context |

## incognito.spec.ts

Tests the incognito mode toggle behavior.
Incognito chats are encrypted, appear in history with an Incognito badge, and are deleted after 1 hour.

| Test | What it checks |
|---|---|
| should show incognito toggle | Toggle is visible on the chat page |
| should be off by default | Toggle starts in off state |
| should turn on when clicked | Toggle switches to on state |
| should turn off when clicked again | Toggle switches back to off state |
| should show incognito chat in history with incognito label | Incognito chat appears in sidebar with Incognito badge |

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
| should reject unsupported file types | Unsupported file type does not appear as a chip |
| should handle oversized file gracefully | File over 10MB shows an error message |

## file-creation.spec.ts

Tests file creation triggered by natural language commands.
The chatbot creates PDF or TXT files when asked — no UI button.

| Test | What it checks |
|---|---|
| should create a TXT file when asked | Bot response references a .txt file |
| should create a PDF file when asked | Bot response references a .pdf file |
| should show a download link or attachment for created TXT file | A downloadable link or attachment appears for TXT files |
| should show a download link or attachment for created PDF file | A downloadable link or attachment appears for PDF files |

## email-export.spec.ts

Tests the email export behavior triggered by natural language commands.
The chatbot sends files to the signed-in user's email when asked — no UI button.

| Test | What it checks |
|---|---|
| should confirm sending file to signed-in email when asked | Bot confirms file was sent to the signed-in email address |
| should only send to signed-in email not a different address | Bot does not send to a different email address when requested |

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

## forgot-password.spec.ts

Tests the forgot password flow.

| Test | What it checks |
|---|---|
| should show forgot password form | Form with email input and Send reset link button visible |
| should navigate to forgot password from login page | Forgot password link on login navigates correctly |
| should show confirmation screen after submitting email | Check your email screen shown after submission |
| should navigate back to login when Sign in is clicked | Sign in link navigates back to login |

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
| should not expose raw tool call syntax — knowledge base query | No raw tool call syntax in KB lookup response |
| should not expose raw tool call syntax — pricing query | No raw tool call syntax in pricing response |
| should not expose raw tool call syntax — knowledge base query (BUG-019) | No raw tool call syntax on handoff fallback |
| should not expose raw tool call syntax — multi-prompt handoff scenario | No raw tool call syntax across 3 consecutive handoff-triggering prompts |

## widget-rag.spec.ts

Tests RAG knowledge retrieval accuracy for the embedded support widget.
Verifies the widget answers from its indexed knowledge base rather than general LLM knowledge.

| Test | What it checks |
|---|---|
| should return correct Starter plan price (€19/month) | Bot returns €19 when asked about the Starter plan cost |
| should confirm there is no data cap on any plan | Bot confirms unlimited data across all plans |
| should return correct installation time (24-48 hours) | Bot references 24 or 48 hour installation time |
| should return support phone number | Bot returns 064 064 064 or 080 8000 support number |
| should return company location (Ljubljana) | Bot references Ljubljana as the company location |
| should respond to money back guarantee question | Bot returns a relevant refund/guarantee policy response |
---

## QA suggestions

Features not yet built — add tests when implemented.

| Feature | Suggested tests |
|---|---|
| Regenerate response | Should resend the last message and produce a new response; should not duplicate the message in history |
| Message reactions / feedback | Should allow thumbs up/down on a response; should persist the rating state |