# Support Bot Widget Tests

Tests for the embeddable Support Bot Widget, run against the public dummy
company site: `perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app`.

No authentication — the widget is public-facing, so these specs use an
absolute `WIDGET_URL` rather than `baseURL`/`storageState`. Playwright project:
**`core-supportbot-ui`** (`playwright.config.ts`).

**IMPORTANT — shadow DOM:** the widget renders inside a shadow root. Playwright
`.locator()` pierces shadow roots automatically; `page.evaluate` +
`querySelectorAll` does **not**. All element access in these specs uses
`.locator()`, never `evaluate`.

**IMPORTANT — bubble structure:** user messages and assistant replies are both
`<div class="pai-bubble">` inside a `.pai-message-stack` — structurally
identical, distinguished only by order. `sendPrompt`/`askAndGetResponse` use a
two-phase wait: first for the user's own echo bubble to appear, THEN for a
*further* bubble beyond it (the real reply). This was a real bug fix — an
earlier version could lock onto the user's echoed message and return it as if
it were the assistant's reply (caught the "should refuse bomb making
instructions" test returning the user's own prompt text).

**IMPORTANT — empty replies:** the helper also fails fast with a clear
diagnosis if a reply bubble renders but its text stays empty for 10+ seconds,
rather than burning the full 45s timeout to arrive at a vague "did not
settle." A persistently empty reply is a distinct failure mode from a slow one
and should be reported as such.

---

## widget.spec.ts

Core widget behaviour: launcher, open/close, sending messages, safety
behaviours, live handoff-to-human, and the closed-launcher unread badge.

Known bug tracked here: **BUG-019** — intermittent raw tool-call syntax leak
(`<tool_call>`, `<function=...>`), checked across several prompt types
including a multi-turn scenario.

| Test | What it checks |
|---|---|
| should show the chat launcher button | Launcher visible on page load |
| should open the widget when launcher is clicked | Input visible after click |
| should show greeting message on open | Greeting body visible |
| should send a message and clear the input | Send button clears input |
| should send message with Enter key | Enter key clears input |
| should not send empty message | Send button disabled when input is empty |
| should close the widget when close button is clicked | Input hidden after close |
| should handle special characters without crashing | Special-character message sends cleanly |
| should not expose system prompt instructions | System-prompt text never appears in a reply |
| should refuse bomb making instructions | A refusal phrase appears in the reply |
| should not expose raw tool call syntax — knowledge base query | No raw tool-call syntax (BUG-019) |
| should not expose raw tool call syntax — pricing query | No raw tool-call syntax. NOTE: this prompt once returned a completely empty reply (confirmed one-off via manual retry, not reproducible) — if it starts failing repeatedly, move to the monitoring tier as an intermittent issue rather than a hard regression |
| should not expose raw tool call syntax — knowledge base query (BUG-019) | No raw tool-call syntax |
| should not expose raw tool call syntax — multi-prompt scenario | No leak across a short multi-turn exchange. Deliberately avoids the handoff-triggering phrase — see below |
| should confirm handoff to a human agent when requested | An explicit "transfer me to a human agent" request produces a handoff confirmation. Uses a direct, unambiguous phrasing on purpose: a softer request like "I need to speak to someone about X" was observed letting the bot answer directly instead of escalating, once it had KB content relevant enough to self-serve — handoff-triggering is genuinely non-deterministic and content-dependent, not a fixed UI action |
| should show an unread badge on the launcher when a reply arrives while closed | Sending a message then closing before the reply lands shows a numeric `.pai-launcher-badge` on the launcher |
| should clear the unread badge when the widget is reopened | Reopening the widget clears the badge |

**Deliberately not tested:** the sound alert that accompanies the unread
badge — the mechanism isn't confirmed yet (no `<audio>` element DOM gathered).
Revisit once that's understood; a live `<audio>` element with `currentTime`
advancing past 0 after the alert fires would be the way to verify it without
actually needing to hear it.

## widget-rag.spec.ts

RAG knowledge-base accuracy against the Telaris content crawled onto the dummy
bot.

**IMPORTANT — avoid vague plan names.** "Starter plan" is not a real,
canonical plan name in this KB — asking about it produced different answers
across runs (sometimes "Orange Start" at €29.99, sometimes a general package
list), because the bot had to guess what it meant. Questions here name a real,
specific plan (e.g. "T2 TV + TEL") so there's only one correct answer and the
assertion is meaningful rather than a coin flip.

| Test | What it checks |
|---|---|
| should return correct T2 TV + TEL package price (€18.99/month) | Response contains the confirmed real price |
| should confirm there is no data cap on any plan | `test.fixme` — the KB actually confirms Telaris DOES have data caps on several plans (e.g. Data Maxi throttles after 1TB; roaming caps as low as 3GB before cutoff), the opposite of this test's original premise. Parked pending the correct real-policy wording to assert against |
| should return correct installation time (24-48 hours) | Response mentions 24 or 48 |
| should return support phone number | Response contains a known support number |
| should return company location (Ljubljana) | Response mentions Ljubljana |
| should respond to money back guarantee question | Response is non-empty and references guarantee/refund/money/cancellation |
