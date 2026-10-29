# Follow-up task contract

The backend owns `/api/v1/staff/tasks`. Its canonical contract is `backend/docs/api/tasks.openapi.yaml` in the companion repository; this repository keeps a verbatim [OpenAPI snapshot](tasks.openapi.yaml). [The feature specification](../../specs/follow-up-tasks/spec.md) defines verified frontend behavior and acceptance. Cross-repository implementation verification passed on 2026-10-29.

- **Reads:** GET collection with optional leadId/status/due/page/pageSize; GET detail by id. The list defaults to open tasks, earliest dueAt/id first, 20 per page. Maximum pageSize is 100.
- **Writes:** POST creates with submissionId, leadId, expectedLeadVersion, title, optional nullable notes and dueAt. PATCH detail replaces editable title/notes/dueAt using expectedVersion and expectedLeadVersion. PATCH status completes/cancels an open task using expectedVersion.
- **Responses:** detail/write `{ task, asOf }`; list `{ items, page, pageSize, total, asOf }`. Use generated types from `src/lib/api/generated/tasks.d.ts`; do not duplicate or hand-edit the schema.
- **Access:** Admin/Manager see all tasks. Agents see only tasks on currently assigned leads. Responsibility follows the lead's current assignment. New/edit tasks require a nonterminal lead and active assigned Agent; authorized completion/cancellation can resolve existing open tasks after eligibility changes.
- **Time:** persist UTC instants, enter/display Asia/Dubai. Overdue is strictly open and dueAt < server asOf. Today spans Dubai midnight to next midnight; Upcoming includes dueAt = asOf. Overdue filtering requires open status. Completed/cancelled tasks are never overdue.
- **Recovery:** retain submissionId through uncertain retries/corrections. An identical authorized replay returns the current task. A changed same-actor receipt returns TASK_RECEIPT_CONFLICT with an authorized existingTaskId; other actors and inaccessible tasks never receive that identifier. Updates are versioned, never blindly retried.
- **Privacy:** safe lead/Agent id/name summaries only; no lead contact details, property owner fields, staff email, creator credentials or receipt material.

After contract changes, copy the backend snapshot verbatim and run `bun run api:generate` and `bun run api:check`. Browser reconciliation uses same-origin `/api/v1`; Server Components and Actions use the server-only backend origin/session transport. Express remains authoritative for every request.
