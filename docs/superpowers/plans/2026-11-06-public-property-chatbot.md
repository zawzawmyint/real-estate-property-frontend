# 🤖 Phase 2 Public Property Chatbot Implementation Plan

> **Goal:** Help public visitors find properties and get sourced agency answers through chat, with an easy path to the existing inquiry form.

---

## 🎯 Objective

Deliver P2-08 as an opt-in portfolio demo. A visitor should be able to ask about an agency process in their own words or describe a property and receive live matches.

---

## 📦 Scope

**In scope**

- Public chat panel, semantic FAQ search, validated live listing filters, source links and inquiry handoff.
- OpenRouter for both models and a JSON FAQ vector index, with independent replacement points for chat generation, embeddings and retrieval.

**Out of scope**

- CRM and client portal assistants, saved chat history, booking or submitting inquiries in chat, and installing a vector database.
- Completing P2-03, which covers staff matching properties to CRM leads.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Express owns chat and listing access. Next.js calls the existing same-origin API boundary and uses generated types. SQLite remains the source of listing facts.
- Chat is disabled by default. `OPENROUTER_API_KEY` is backend-only. The first release treats each request independently and keeps the displayed transcript in frontend memory.

**Product / Business**

- Use clearly labeled demo FAQs and existing demo listings. Use the existing Contact and property inquiry flows for personal details and submission.

**Dependencies**

- Defaults are `nvidia/nemotron-3-embed-1b:free` and `nvidia/nemotron-3.5-lightning:free`. The provider calls use OpenRouter `/api/v1/embeddings` and `/api/v1/chat/completions`. The earlier Gemma candidate repeatedly returned HTTP 429 during the bounded smoke.
- Read the [frontend specification](../../../specs/public-property-chatbot/spec.md). The companion checkout owns `backend/specs/public-property-chatbot/spec.md` and its `contract.md`.

---

## 🧩 Proposed Approach

- **Index preparation.** Store approved FAQ text with stable source IDs and allowlisted `/contact` and `/properties` paths. Run `bun run chat:index` after changing FAQ text, embedding settings or the store migration input. It embeds changed content and writes a versioned JSON index atomically. Restart Express after the index is ready because it loads and validates the index at startup.
- **FAQ turn.** Express classifies the message, embeds it with the configured model, and ranks JSON vectors by cosine similarity. Pass up to three relevant passages to the chat model and verify its cited IDs against those passages. Return a Contact fallback when retrieval yields insufficient evidence.
- **Listing turn.** The model proposes filters. Express validates them and uses the existing property service in `backend/src/modules/properties/properties.service.ts` to read up to three published, available matches. Check exact bedroom requests before limiting, and clarify ambiguous rent periods. Use returned DTOs for facts and links.
- **Boundary.** The planned backend module at `backend/src/modules/public-chat/` owns generation, embedding and FAQ retrieval interfaces. Keep provider and store details behind those interfaces. Switch a chat model via configuration and a regression check. Switch an embedding model with a rebuilt index. Import compatible vectors and source metadata when replacing the store.
- **Contract and UI.** Add `POST /api/v1/public/chat` with `{ message }` and typed `faq`, `properties`, `clarify` and `no_answer` results. Add the backend OpenAPI operation, generate the frontend snapshot, and mount a feature-owned panel from the [public layout](<../../../src/app/(public)/layout.tsx>). Reuse listing formatters and existing inquiry destinations.

---

## 🚀 Execution Plan

1. **Build FAQ retrieval and provider calls** — _(role: backend)_ — Completed with independently replaceable generation, embedding and JSON retrieval interfaces, a 0.20 relevance cutoff and a 10-second provider deadline.
2. **Wire chat and property search** — _(role: backend)_ — Completed with the validated route, exact-bedroom filtering before limiting, trusted ingress, five requests per client per minute, and 45 upstream calls per rolling day per instance.
3. **Build the chat panel** — _(role: frontend)_ — Completed with generated types, safe result rendering, listing/contact handoff, keyboard focus behavior, 320px coverage and duplicate suppression.
4. **Verify and document rollout** — _(role: fullstack)_ — Completed for the opt-in demo. The live smoke indexed five 2048-dimensional vectors and returned a sourced FAQ answer plus an eligible two-bedroom listing. No real CRM or visitor data was sent to the provider.

---

## ✅ Acceptance Criteria

**Functional**

- [x] A paraphrased agency question returns a sourced FAQ answer. Weak matches offer Contact.
- [x] A natural-language listing request returns up to three eligible properties with correct prices, links and access to the existing inquiry flow.
- [x] Ambiguous budget units, no listings and provider outages produce distinct UI states.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Model and store substitutions are covered independently, and incompatible indexes fail safely.
- [x] Anonymous requests are bounded and throttled. Provider errors expose only safe messages, and CRM data stays outside the chat pipeline.
- [x] The panel works at 320px and with a keyboard. A duplicate submit makes one request.

---

## 🧪 Validation Plan

**Manual tests**

- Try one paraphrased FAQ, one exact listing search, one ambiguous rent budget, and an inquiry handoff. Verify focus and layout on desktop and mobile.
- Run a small hosted-model smoke with synthetic messages and inspect the configured quota behavior.

**Automated tests**

- Backend lint, typecheck and build passed with 151 tests. Frontend API drift, lint, type generation, typecheck and 300 unit tests passed. The isolated production Webpack build produced 18 static outputs. Six targeted desktop/mobile browser cases passed with deterministic provider adapters.

**Rollback / mitigation**

- Disable the feature. Keep listing and Contact navigation available. Rebuild the FAQ index before using a new embedding model or vector configuration.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Provider availability or quota interrupts a demo — _Mitigation:_ enforce a timeout and shared call budget, and show direct links during outages.
- **Risk:** Similar text can retrieve a weak match — _Mitigation:_ check the relevance cutoff with paraphrased and unrelated questions and validate source IDs before showing links.

**Open questions** _(blockers for implementation)_

- _N/A for a local demo with labeled sample content._ Approve public FAQ text and visitor data handling before enabling for real customers.
