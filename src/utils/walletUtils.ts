
import { parseISO, isWithinInterval } from "date-fns";
import { Expense, Section } from "@/types";

export function getBalanceExpenses(
  section: Section,
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): Expense[] {
  return expenses.filter((e) => {
    const date = parseISO(e.date);
    return (
      isWithinInterval(date, { start: startDate, end: endDate }) &&
      (e.category === section.id || e.source === section.id)
    );
  });
}

export function calculateIncome(section: Section, expenses: Expense[]): number {
  return expenses
    .filter((e) => e.amount > 0 && e.category === section.id)
    .reduce((acc, e) => acc + e.amount, 0);
}

export function calculateExpenses(section: Section, expenses: Expense[]): number {
  return expenses
    .filter((e) => e.amount < 0 && (e.category === section.id || e.source === section.id))
    .reduce((acc, e) => acc + e.amount, 0);
}

export function getLatestTransactions(expenses: Expense[], count: number = 3): Expense[] {
  return [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}
