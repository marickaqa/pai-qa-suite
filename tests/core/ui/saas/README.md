# SaaS UI Tests

Tests for the PAI SaaS dashboard at chat-dev.paicloud.ai.
Uses `reports/saas-session.json` for all authenticated tests. Auth tests use a
fresh context with no session. `global-setup.ts` logs the qa-saas session in
and switches its active org to **noctocode.dev** (it has real support bots,
conversations, and knowledge/guideline fixtures — the default org otherwise
has none). Several tests guard that repoint by asserting the active org.

**Test agents:**
- Support bot: Telaris, `77d5b55e-3326-4f2d-8380-b2bef6135552`
- Chatbot: noctocode-test, `edb91849-b4eb-4dbc-aa9f-5ae816833e56`
- Sandbox support bot (safe to mutate incl. handoff verification): marija test

**Known bugs surfaced by this suite** (see `test.fixme` in the relevant spec):
- API key creation on **Settings** and **API & Usage** both fail with an
  "Invalid origin" popup on submit (origin/CORS check), reported to dev.
- The **create-agent wizard** no longer auto-populates the slug from the name
  (regression vs. the old create form), reported to dev.
- **Features** page: the RAG toggle hydrates slowly and isn't reliably present
  within default timeouts — parked pending a longer-wait fix, not a product bug.

**Retired files:** `saas-support-bot.spec.ts` (relocated into `saas-team`,
`saas-widget`, `saas-danger-zone`), `saas-agent.spec.ts` and
`saas-ai-assistant.spec.ts` (fully duplicated by the dedicated specs below —
deleted).

---

## saas-auth.spec.ts

Authentication flows: sign in, sign up, the no-org empty state, OAuth button
presence, logout, and the organization picker. Google/Apple OAuth are deferred
— buttons are asserted present/linked, not exercised. Logout uses a throwaway
session so it can never invalidate the shared session file.

| Test | What it checks |
|---|---|
| should show sign in form | Email, password fields and Sign In button visible |
| should show Create an account link on login page | Link visible |
| should show Forgot password link on login page | Link visible |
| should render Google and Apple OAuth buttons | Buttons render, link to /api/auth/google and /api/auth/apple |
| should sign in with valid credentials | Redirects away from login |
| should show error with wrong password | "Invalid email or password" renders, stays on login |
| should not sign in with empty email | Does not authenticate |
| should not sign in with empty password | Does not authenticate |
| should show sign up form | Fields and Sign Up button visible |
| should show sign in link on signup page | Link visible |
| should navigate to signup from login page | Create an account link navigates to /signup |
| should not submit signup with empty fields | Stays on signup page |
| should not reveal whether an email is already registered | Neutral "check your email" confirmation, no existence-revealing error (anti-enumeration; API side tracked as BUG-020) |
| should show no-org empty state for user without organization | No-org screen visible (requires `SAAS_NO_ORG_EMAIL`/`PASSWORD`) |
| should show the organization picker with the current org | Picker shows noctocode.dev (also guards the global-setup repoint) |
| should switch active organization via the picker | Switches to Trump Media, restores noctocode.dev on teardown |
| should keep the session when logout is cancelled | Cancel keeps the user signed in |
| should log out and return to the login page | Confirming the logout dialog ends the session |

## saas-dashboard.spec.ts

The org overview page at `/dashboard/overview`. Numeric assertions are
value-agnostic consistency checks (total == breakdown == listed rows), so they
hold regardless of how many agents the active org has.

| Test | What it checks |
|---|---|
| should redirect unauthenticated users to login | No session redirects to login |
| should land on the overview page | Authenticated session reaches /dashboard/ |
| should show the four key metric cards | Total agents, messages, sessions, token usage cards visible |
| should keep TOTAL AGENTS consistent with the Support/Chatbot breakdown | total == support + chatbot |
| should list exactly as many agents as the counts claim | Listed rows match the breakdown and total |
| should show Support bots and Chatbots sections | Both sections visible; Chatbots carries "Coming soon" |
| should show the organization picker in the sidebar | Picker visible, shows active org |
| should show the primary navigation and coming-soon items | Nav items visible (Admin Panel included — qa-saas is a platform admin) |
| should toggle the Support bots nav dropdown when clicked | Toggles when enabled; asserts disabled state when the org has zero support bots |
| should show the New button | Visible |
| should show the theme toggle button | Visible |
| should toggle the theme and restore it | Toggles the `html` class, then restores it |

## saas-analytics.spec.ts

Org-wide analytics at `/dashboard/analytics`. The numeric checks never hardcode
a value — they assert relationships that only fail if two independently
computed figures actually disagree.

| Test | What it checks |
|---|---|
| should navigate to analytics and show the org overview | Heading and description visible |
| should show Messages, Sessions and Tokens used metrics | All three labels visible |
| should show percentage-change indicators next to metrics | At least one visible |
| should show the token-usage card with input/output breakdown | Card with Input/Output visible |
| token usage total equals input plus output | Exact integer sum check on the token card |
| overview month stats reconcile with the analytics page | Overview and analytics figures agree within a small tolerance |
| should show the Activity over time chart with metric and period toggles | All/Messages/Sessions/Tokens and Weekly/Monthly/Yearly/All time buttons visible |
| metric toggles are clickable and update the selection | Each metric toggle becomes the active selection |
| period toggles are clickable and update the selection | Each period toggle becomes the active selection |
| should show the chart legend for Messages, Sessions and Tokens | Legend labels visible |
| should show the Guardrail triggers table with correct headers | Table + Category/Count/Last triggered columns visible |
| should show a Review action for guardrail trigger rows when present | Review button visible if any rows exist |

## saas-conversations.spec.ts

Conversations inbox at `/dashboard/conversations`, tested against noctocode.dev
(populated with real support bots and conversations). Human handoff is
verified read-only on an **already** handed-off conversation — "Enable
Handoff" is one-way (no disable) and is never clicked in automation. Send is
never clicked either; typing into an active Reply field is enough to prove the
channel is live.

| Test | What it checks |
|---|---|
| should navigate to the conversations page | "All chats" visible |
| should show a numeric conversation count for All chats | Count is a valid number |
| should show support-bot filter pills | telaris pill visible |
| should select a support bot when its filter pill is clicked | Pill gains the selected (teal) styling |
| should show conversation rows once a bot is selected | Rows render after selecting marija test |
| should open the top conversation when a bot is selected | Detail panel populates (Started header, Send button) |
| should show the Enable Handoff control on a non-handed-off conversation | Button visible; NOT clicked |
| should allow replying on an already-handed-off conversation | Reply input active, Send disabled until typed, then enabled; Send never clicked |
| should show the search input | Visible |

## saas-knowledge.spec.ts

Files, folders, and website crawling on the Telaris support bot. Self-contained
CRUD with verified teardown (created folders/files are deleted and confirmed
gone — this matters: unswept `qa-*` files get RAG-indexed on Telaris, per
BUG-003 history).

Covers: heading/sections, New folder (create + validation + delete), Upload
file dialog, file upload + verified delete, Website URLs section, Crawl website
form (open, empty-URL validation, Add pattern — both include/exclude sections).

## saas-guidelines.spec.ts

Guideline sections (Communication style, Context and clarification, Content
and sources, Spam, etc.) on the Telaris support bot. Self-contained CRUD with
verified teardown.

Covers: heading/sections, New guideline form, section expand/collapse,
enable/disable toggle on an existing guideline, create-then-delete with
verified teardown, and choosing a **Prompt Template** to prefill the form
(read-only — Cancelled, never saved).

## saas-attributes.spec.ts

Custom conversation-tagging attributes on the noctocode-test chatbot. Cleanup
is `afterEach` and **scoped to `qa-*` attributes only** — it never touches a
pre-existing (real) attribute, and the empty-state test branches on whether
the agent currently has any.

| Test | What it checks |
|---|---|
| should show Attributes heading and description | Visible |
| should show either the empty state or an existing attribute list | Branches on current state — never assumes empty |
| should show Add attribute button | Visible |
| should show attribute form when Add attribute is clicked | Type input, Add value, Save, Discard visible |
| should show Delete type button in attribute form | Visible |
| should show value and description inputs when Add value is clicked | Visible |
| should hide form when Discard is clicked | Form disappears |
| should create and delete an attribute | Created, verified, deleted — only ever touches its own `qa-attr-*` card |

## saas-model-config.spec.ts

Model & Logic page: Output (model, temperature, top P, presence/frequency
penalty), Text to Image, Image to Image, Text Ranking, and Feature Extraction
sections, each with Save/Discard.

## saas-style-config.spec.ts

Branding page at `/agent/{id}/style-config` — a separate route from `/widget`
(no nav link; reachable only by direct URL). Favicon + 6 logo upload slots,
7 upload/remove button pairs, file-format-restricted inputs, Light/Dark theme
hex color inputs, Save changes.

## saas-bot-analytics.spec.ts

Per-bot analytics at `/agent/{id}/analytics` — same shape as org analytics,
scoped to one bot, brought to the same rigor.

| Test | What it checks |
|---|---|
| should show Bot overview heading and description | Rename-tolerant (chatbot/agent/bot) |
| should show Messages Sessions and Tokens used metrics | Visible |
| should show percentage change indicators | Visible |
| should show Token usage this month card | Card with Input/Output visible |
| bot token usage total equals input plus output | Exact integer sum check |
| should show Activity over time chart with period toggle buttons | Visible |
| should show Guardrail triggers table with correct headers | Rename-tolerant subtitle |
| should show Coming soon placeholder | Scoped to `main` (sidebar also has "Coming soon" nav badges) |

## saas-team.spec.ts

Per-agent Team page (`/agent/{id}/team`) — the full 7-permission model (Admin,
Analytics, Chats, Members, Guidance, Knowledge, Style). All actions are
mutation-safe: the Add-member dialog is opened, its structure and live
member-search filter are verified, then **Cancelled** — no member is added,
removed, or re-roled.

## saas-widget.spec.ts

Widget page (`/agent/{id}/widget`) — header text, welcome message, theme,
primary colour, launcher position, spacing, starter questions, live preview,
Save widget, embed code. Relocated from the retired `saas-support-bot.spec.ts`.

## saas-danger-zone.spec.ts

Archive/Delete on `/agent/{id}/danger-zone`. Visibility-only — both actions are
irreversible on a real agent and are never clicked. Button labels are matched
by verb (`/archive/i`, `/delete/i`) to survive renaming.

## saas-legal.spec.ts

Legal page (`/agent/{id}/legal`) — Data usage URL, Privacy policy URL, Terms
and conditions URL, Save legal links. Read-only: Save is never clicked (it
rewrites the real widget's legal links). One test types into a field and
confirms a reload discards the change.

**Deferred, tracked gap:** the actual widget-side consequence of these URLs
(the first-message consent line; the "⋯" menu showing Privacy/Terms only when
set) is not covered — it requires mutating these URLs and loading the embedded
widget on the dummy site.

## saas-features.spec.ts

Per-agent Features page — currently only the RAG toggle. **2 of 3 tests are
`test.fixme`**: the RAG row and switch hydrate slowly and aren't reliably
present within the default timeout (needs a longer wait, not a product fix).
The switch is never clicked even once un-parked — it persists immediately and
would change how the bot answers, so coverage is read-only by design.

## saas-api-usage.spec.ts

Per-agent API key page. Read-only coverage is live; the actual generate flow
is `test.fixme` — clicking "Generate API key" raises an "Invalid origin"
popup, reported to dev.

## saas-settings.spec.ts

Workspace Settings (`/dashboard/settings`) — Organization name/slug display,
workspace API keys. Same "Invalid origin" bug as API & Usage on key creation —
parked as `test.fixme`. Org name/slug assertions double as a guard on the
noctocode.dev repoint.

## saas-workspace-team.spec.ts

Workspace-level Team page (`/dashboard/team`) — distinct from the per-agent
Team page. 4-permission model (Admin/Chatbots/Members/Billing), Pending
Invitations section. The Invite dialog **sends a real email on submit**, so
every path through it ends in Cancel — no invite is ever sent.

## saas-create-agent.spec.ts

The 5-step creation wizard at `/new` (Type → Basics → Branding → Model →
Review). No type is preselected — the Support card must be clicked before
Continue enables. The "Conversational chatbot" type is the hidden Chatbots
product ("Coming soon") and is `test.fixme`. Header text is a required field on
the Branding step (Launch stays disabled at Review otherwise). The full
creation test walks all 5 steps, launches a real support agent, and deletes it
via `saasClient.deleteChatbot`.

| Test | What it checks |
|---|---|
| should show step 1 with Support and Conversational type cards | Both cards visible; Continue disabled until a type is chosen |
| should show the wizard step indicators | Type/Basics/Branding/Model/Review visible |
| should enable Continue once the Support type is selected | Disabled → click → enabled |
| should allow selecting the Conversational type | `fixme` — hidden Chatbots product |
| should advance to Basics with Name and Slug fields | Visible after selecting Support |
| should auto-populate the slug from the name in Basics | `fixme` — regression, slug no longer auto-populates |
| should create a support agent through the wizard and launch | Full 5-step walk, launches, redirects to `/agent/{id}`, deleted in teardown |

## saas-admin-organizations.spec.ts

Admin Panel → Organizations (`/dashboard/admin/organizations`). Requires an
admin session (qa-saas is a platform admin). **Highest-stakes spec in the
suite** — the live org list includes noctocode.dev and Trump Media, which the
whole SaaS suite depends on. Every delete is hard-guarded to `qa-org-*` rows
only (a helper throws rather than delete anything else), with an `afterEach`
sweep for any leftover `qa-org-*` from a crashed test.

## saas-admin-prompt-templates.spec.ts

Admin Panel → Prompt Templates (`/dashboard/admin/prompt-templates`). Platform-
wide templates — CRUD limited to `qa-template-*` names, verified teardown plus
an `afterEach` safety-net sweep.
