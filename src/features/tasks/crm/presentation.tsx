import type { LeadDetail } from "@/features/leads/data/types";
import type { Task } from "../data/types";

export function taskEligibility(
  lead: Pick<LeadDetail, "stage" | "assignedAgent">,
) {
  if (["won", "lost"].includes(lead.stage))
    return "Won or lost leads cannot receive new or edited tasks.";
  if (!lead.assignedAgent?.available)
    return "Assign an active Agent on the lead before creating or editing a task.";
  return "";
}

export function TaskDate({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dubai",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))}
    </time>
  );
}

export function TaskState({ task }: { task: Task }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${task.isOverdue ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
    >
      {task.isOverdue
        ? "Overdue"
        : task.status === "open"
          ? "Open"
          : task.status === "completed"
            ? "Completed"
            : "Cancelled"}
    </span>
  );
}
