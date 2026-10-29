export function dubaiDate(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function shiftDay(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function weekDays(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = shiftDay(date, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDay(monday, i)) as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
}
export function weekQuery(date: string, status = "", leadId = "", page = 1) {
  const days = weekDays(date);
  const query = new URLSearchParams({
    from: `${days[0]}T00:00:00+04:00`,
    to: `${shiftDay(days[6], 1)}T00:00:00+04:00`,
    page: String(page),
    pageSize: "50",
  });
  if (status) query.set("status", status);
  if (leadId) query.set("leadId", leadId);
  return query.toString();
}
export function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
export function viewingHref(
  pathname: string,
  date: string,
  status: string,
  existing: string,
) {
  const query = new URLSearchParams(existing);
  query.set("date", date);
  if (status) query.set("status", status);
  else query.delete("status");
  return `${pathname}?${query}`;
}
export function endDayLabel(startsAt: string, endsAt: string) {
  return dubaiDate(startsAt) === dubaiDate(endsAt)
    ? ""
    : `Ends ${dayLabel(dubaiDate(endsAt))} (${dubaiDate(endsAt)})`;
}
export function dayLabel(date: string, full = false) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: full ? "long" : "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00+04:00`));
}
