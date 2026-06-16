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

## email-export.spec.ts

Tests the email export behavior triggered by natural language commands.
The chatbot sends files to the signed-in user's email when asked — no UI button.

| Test | What it checks |
|---|---|
| should confirm sending file to signed-in email when asked | Bot confirms file was sent to the signed-in email address |
| should only send to signed-in email not a different address | Bot does not send to a different email address when requested |

## file-creation.spec.ts

Tests file creation triggered by natural language commands.
The chatbot creates PDF or TXT files when asked — no UI button.

| Test | What it checks |
|---|---|
| should create a TXT file when asked | Bot response references a .txt file |
| should create a PDF file when asked | Bot response references a .pdf file |
| should show a download link or attachment for created TXT file | A downloadable link or attachment appears for TXT files |
| should show a download link or attachment for created PDF file | A downloadable link or attachment appears for PDF files |

## saas-auth.spec.ts

Tests the PAI SaaS authentication flows at chat.paicloud.ai.
Google OAuth is deferred — not automatable without a real Google session.
Uses a fresh context with no session for all tests.

| Test | What it checks |
|---|---|
| should show sign in form | Email, password fields and Sign In button are visible |
| should show Create an account link on login page | Create an account link is visible on login page |
| should sign in with valid credentials | Valid credentials redirect away from login page |
| should show error with wrong password | Wrong password stays on login page |
| should not sign in with empty email | Empty email does not proceed past login |
| should not sign in with empty password | Empty password does not proceed past login |
| should show sign up form | Email, password fields and Sign Up button are visible |
| should show sign in link on signup page | Sign In link is visible on signup page |
| should navigate to signup from login page | Create an account link navigates to /signup |
| should not submit signup with empty fields | Empty form stays on signup page |
| should show error for already registered email | Existing email stays on signup page |
| should show no-org empty state for user without organization | User with no org sees the no-organization screen (skipped if no credentials) |

## saas-create-agent.spec.ts

Tests the Create New Agent flow at chat.paicloud.ai/agent/new.
Covers form visibility, type toggle defaults, validation, and successful creation.

| Test | What it checks |
|---|---|
| should show create agent form with all fields | Name, slug, Chat/Support toggle and Create agent button are visible |
| should default to Chat type when opened via ?type=chat | Chat button is pressed, Support is not |
| should default to Support type when opened via ?type=support | Support button is pressed, Chat is not |
| should toggle from Chat to Support when Support is clicked | Support becomes pressed after clicking |
| should toggle from Support to Chat when Chat is clicked | Chat becomes pressed after clicking |
| should not submit with empty name | Empty name stays on create page |
| should not submit with empty slug | Empty slug stays on create page |
| should auto-populate slug from name | Slug field populates after typing a name |
| should create a chat agent and redirect to agent page | Chat agent creation redirects away from /agent/new |
| should create a support agent and redirect to agent page | Support agent creation redirects away from /agent/new |

## saas-support-bot.spec.ts

Tests the support bot agent pages at chat.paicloud.ai.
Uses the stable Telaris test agent for all tests.
Destructive actions (archive, delete) are visibility-only — not executed.

| Test | What it checks |
|---|---|
| should show team page with Add member button | Agent team heading and Add member button are visible |
| should show members table with correct columns | Member, Permissions and Joined column headers are visible |
| should show role descriptions on team page | Admin, Analytics and Chats role descriptions are visible |
| should open Add member dialog when button is clicked | Clicking Add member opens a dialog |
| should show guidelines page with all sections | Guidelines heading and all section names are visible |
| should show New guideline button | At least one New guideline button is visible |
| should expand a guideline section when clicked | Clicking a section reveals the New guideline button |
| should show enable/disable toggle on existing guideline | A toggle switch is visible on an existing guideline |
| should show knowledge page with Files and Website URLs sections | Knowledge heading, Files and Website URLs sections are visible |
| should show Upload file and New folder buttons | Upload file and New folder buttons are visible |
| should show Crawl website button | Crawl website button is visible |
| should show existing crawled website in Website URLs table | A completed crawl entry is visible |
| should show widget page with all config fields | Header text, Theme, Primary colour, Launcher position, spacing and Starter questions are visible |
| should show live preview iframe | Live preview section is visible |
| should show theme toggle buttons | System, Dark and Light theme buttons are visible |
| should show launcher position toggle buttons | Left and Right position buttons are visible |
| should show Add question button for starter questions | Add question button is visible |
| should show Save widget button | Save widget button is visible |
| should show embed code section | Embed code section and HTML button are visible |
| should show danger zone page with Archive and Delete buttons | Archive chatbot and Delete chatbot buttons are visible |
| should show archive description text | Archive description text is visible |
| should show delete warning text | Cannot be undone warning text is visible |

## saas-ai-assistant.spec.ts

Tests the AI assistant agent pages at chat.paicloud.ai.
Uses the stable AI assistant test agent for all tests.
Destructive actions (archive, delete) are visibility-only — not executed.

| Test | What it checks |
|---|---|
| should show team page with Add member button | Agent team heading and Add member button are visible |
| should show members table with correct columns | Member, Permissions and Joined column headers are visible |
| should show role descriptions on team page | Admin, Analytics and Chats role descriptions are visible |
| should open Add member dialog when button is clicked | Clicking Add member opens a dialog |
| should show guidelines page with all sections | Guidelines heading and all section names are visible |
| should show New guideline button | At least one New guideline button is visible |
| should show enable/disable toggle on existing guideline | A toggle switch is visible on an existing guideline |
| should show style config page | Style Config heading is visible |
| should show all 6 logo upload slots | Light theme, Dark theme, Vertical light, Vertical dark, Icon light and Icon dark slots are visible |
| should show at least 6 Upload buttons | Exactly 6 Upload buttons are visible |
| should show Save changes button | Save changes button is visible |
| should show danger zone page with Archive and Delete buttons | Archive chatbot and Delete chatbot buttons are visible |
| should show archive description text | Archive description text is visible |
| should show delete warning text | Cannot be undone warning text is visible |

## saas-dashboard.spec.ts

Tests the PAI SaaS dashboard behavior at chat.paicloud.ai.
Uses `reports/saas-session.json` for authenticated tests.

| Test | What it checks |
|---|---|
| should redirect unauthenticated users to login | Accessing dashboard without session redirects to login |
| should login and land on dashboard | Authenticated session lands on dashboard URL |
| should show key dashboard metrics | Total agents, messages, resolution rate, token usage labels are visible |
| should show support bots and AI assistants sections | Both bot type sections visible on overview |
| should show organization name in sidebar | noctocode.dev visible in sidebar |
| should show New button on dashboard | New button visible for creating agents |
| should show total agents count as a number | Total agents card shows a numeric value |
| should show dynamic metric values for messages, resolution rate and token usage | All three metric cards have numeric values |
| should show theme toggle button on dashboard | Toggle theme button is visible |
| should toggle from dark to light mode when theme button is clicked | Clicking toggle changes the HTML class |