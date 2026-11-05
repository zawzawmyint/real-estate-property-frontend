# November 5 browser UI verification

## Scope

This is a local development verification record. It supplements, and does not revise, the historical [November 4 project review](2026-11-04-project-review.md). It does not claim production deployment, external email delivery, or Phase 1 completion.

## Connected disposable-data journey

The connected browser journey used a fresh local SQLite database, media storage and test staff accounts. It covered 49 normal and abnormal scenarios across public browsing, inquiries, authentication, CRM properties, leads, viewings, tasks, permissions, recovery, mobile navigation and rate limiting.

- **48 scenarios were verified** after six focused rechecks corrected test-probe timing, access-denial wording, fault-fixture scoping, or a missing task-assignment prerequisite.
- **One application defect was confirmed.** With client JavaScript delayed, an enabled property-form **Save draft** action falls back to native `GET` submission before the React handler is ready. The title, owner name and owner phone then enter the URL and browser history, while the draft is not saved by the application handler. Reproduce by delaying client JavaScript, opening `/crm/properties/new`, entering fictional owner data, and clicking **Save draft**. The affected form is [property-form.tsx](../../src/features/properties/crm/property-form.tsx#L286).
- The initial connected run recorded 42 passes and seven failures: six probe failures and the confirmed application defect. The focused follow-up recorded 14 passes and no failures. The aggregate result above treats the six corrected probes as verified while retaining their raw evidence.
- The non-failing Next streaming diagnostic recurred in local development logs. Its cause remains unproven.

The raw report, traces, screenshots and videos are under ignored `.delivery-work/` paths and are local-only evidence. Application source was not changed during this verification.

## Visible localhost UI round

One slow, visible UI-only round used the normal local frontend on port 3100 and backend on port 4311. It created a clearly labelled fictional **UI Test Visitor** inquiry and verified it in the CRM as a Website lead. The record and its fictional related records remain in the normal local database for inspection.

- The Demo Manager assigned **Demo Agent**; an empty note was rejected and the labelled note was saved.
- The pipeline moved the lead to **Contacted**. Selecting **Won** displayed its confirmation, and cancelling retained **Contacted**.
- A past viewing date was rejected. A November 6 viewing was scheduled for 11:00–12:00 Dubai time, rescheduled to 13:00–14:00, found in the calendar, then cancelled. The cancelled appointment remains as history.
- An empty follow-up task displayed required title, date and time errors. A labelled task was created, edited to 15:30 Dubai time, completed, and found through the Completed-task filter.

This UI round exercised the running local application only; it does not replace the disposable-data journey or the recorded full-suite checks.

## Follow-up

Do not treat the browser evidence as a fix for the property-form hydration defect. Keep the defect open until create and edit property forms prevent input and submission before client readiness, with delayed-loading browser coverage for both flows.
