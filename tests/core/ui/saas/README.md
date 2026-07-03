# SaaS UI Tests

Tests for the PAI SaaS dashboard at chat.paicloud.ai.
Uses `reports/saas-session.json` for all authenticated tests.
Auth tests use a fresh context with no session.

## saas-auth.spec.ts

Tests the PAI SaaS authentication flows.
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
| should show no-org empty state for user without organization | User with no org sees the no-organization screen |

## saas-dashboard.spec.ts

Tests the PAI SaaS dashboard overview page.
Uses `reports/saas-session.json` for all tests.

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
| should show branding section with widget logo upload slots | Branding heading, Widget logos, Light theme and Dark theme labels visible |

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

## saas-guidelines.spec.ts

Tests guideline CRUD operations on the Telaris support bot agent.
Each test is self-contained — created guidelines are deleted after.

| Test | What it checks |
|---|---|
| should show New guideline form when button is clicked | Clicking New guideline shows name, content, Create and Cancel fields |
| should cancel guideline creation when Cancel is clicked | Clicking Cancel hides the form |
| should not submit guideline with empty name | Empty name keeps the form visible |
| should not submit guideline with empty content | Empty content keeps the form visible |
| should create a new guideline and show it in the section | New guideline appears in the section after creation |
| should enable and disable a guideline toggle | Toggle state changes after clicking |
| should delete a guideline | Guideline disappears after deletion via the edit dialog |

## saas-knowledge.spec.ts

Tests knowledge CRUD operations on the Telaris support bot agent.
Each test is self-contained — created items are deleted after where possible.

| Test | What it checks |
|---|---|
| should show folder name input when New folder is clicked | Clicking New folder shows the folder name input |
| should create a new folder and show it in the list | New folder appears in the list after creation |
| should show upload area when Upload file is clicked | Clicking Upload file shows the drag & drop area and Cancel button |
| should close upload area when Cancel is clicked | Clicking Cancel hides the upload area |
| should upload a file and show it in the list | Uploaded file appears in the knowledge list |
| should show crawl form when Crawl website is clicked | Clicking Crawl website shows the URL input and Start crawling button |
| should not start crawling with empty URL | Start crawling button is disabled when URL is empty |
| should show Add pattern button in crawl form | Add pattern button is visible in the crawl form |

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

## saas-style-config.spec.ts

Tests the Branding page for chatbot logo and color customization.
Covers favicon and logo upload slots (light/dark theme, icon, vertical variants), primary/secondary color pickers for light and dark themes.

| Test | What it checks |
|---|---|
| should show Branding heading and description | Heading and description text visible |
| should show favicon upload slot | Favicon label visible |
| should show all 6 logo upload slots with correct labels | Light theme, Icon light, Vertical light, Dark theme, Icon dark, Vertical dark labels all visible |
| should show 7 upload buttons and 7 remove buttons | One Upload and one Remove button per slot including favicon |
| should have 7 file inputs accepting image formats | Favicon input accepts png, svg, ico; logo inputs accept png, jpeg, svg, webp |
| should show Light theme and Dark theme color sections with hex inputs | Primary/secondary colour labels visible, all 4 hex values match valid hex format |
| should show Save changes button | Save changes button visible and enabled |
| should update hex input when a new value is typed | Typing a new hex value updates the input |

## saas-analytics.spec.ts

Tests the Organization Analytics page at /dashboard/analytics.
Covers org-wide metrics, activity chart period switching, and guardrail trigger tracking.

| Test | What it checks |
|---|---|
| should navigate to analytics page and show Organization overview | Organization overview heading and description visible |
| should show Messages, Sessions and Tokens used metrics | All three metric labels visible in the overview section |
| should show percentage change indicators next to metrics | At least one percentage change indicator visible |
| should show Token usage this month card with progress bar | Token usage card with Input/Output breakdown visible |
| should show Activity over time chart with period toggle buttons | Chart heading and Weekly/Monthly/Yearly/All time buttons visible |
| should switch between time periods when toggle buttons are clicked | Clicking each period button updates the chart description |
| should show chart legend for Messages, Sessions and Tokens | Legend labels for all three metrics visible |
| should show Guardrail triggers table with correct headers | Table with Category, Count, Last triggered columns visible |
| should show a Review action for guardrail trigger rows | Review button visible when guardrail triggers exist |

## saas-model-config.spec.ts

Tests the Model & Logic page for chatbot model selection and output parameter configuration.

| Test | What it checks |
|---|---|
| should show Model & Logic heading and description | Heading and description text visible |
| should show all 5 sections | Output, Text to Image, Image to Image, Text Ranking, Feature Extraction headings visible |
| should show section descriptions | Description text for each model section visible |
| should show 5 model dropdowns with selected values | Each section has a combobox with a non-empty selected model |
| should show Output parameter inputs | Temperature, Top P, Presence penalty, Frequency penalty labels visible |
| should show parameter range descriptions | Range descriptions visible for Temperature and Top P |
| should show Reset to defaults link in Output section | Reset to defaults link visible |
| should show 5 Save and 5 Discard buttons | One Save and one Discard button per section |
| should update a parameter input value | Typing a new value updates the Temperature input |

## saas-attributes.spec.ts

Tests the Attributes page for creating and managing conversation tagging attributes.
Each test is self-contained — created attributes are deleted after.

| Test | What it checks |
|---|---|
| should show Attributes heading and description | Heading and description text visible |
| should show empty state when no attributes exist | No attributes yet message and description visible |
| should show Add attribute button | Add attribute button visible |
| should show attribute form when Add attribute is clicked | Type input, Add value, Save and Discard buttons visible |
| should show Delete type button in attribute form | Delete type button visible in open form |
| should show value and description inputs when Add value is clicked | Value and description inputs visible after clicking Add value |
| should hide form when Discard is clicked | Form not visible after clicking Discard |
| should create and delete an attribute | Attribute created and input value confirmed, deleted successfully |

## saas-conversations.spec.ts

Tests the Conversations inbox page at /dashboard/conversations.

| Test | What it checks |
|---|---|
| should navigate to conversations page | All chats label visible on page load |
| should show chatbot filter list in sidebar | Chatbot names visible in sidebar filter |
| should show conversation count next to All chats | Numeric count visible next to All chats label |
| should show empty state when no conversations exist | No conversations yet message visible |
| should show no conversation selected state in detail panel | No conversation selected and helper text visible in detail panel |
| should show search input | At least one search input visible |