export function getNextDueDate(current: string, repeat: "daily" | "weekly" | "monthly"): string {
  const date = new Date(current);
  if (repeat === "daily") date.setDate(date.getDate() + 1);
  if (repeat === "weekly") date.setDate(date.getDate() + 7);
  if (repeat === "monthly") date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}
