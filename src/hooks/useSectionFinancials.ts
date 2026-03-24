import { useMemo } from "react";
import { parseISO, isWithinInterval } from "date-fns";
import { Section, Expense } from "@/types";

export interface UseSectionFinancialsParams {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
}

export interface UseSectionFinancialsResult {
  filteredExpenses: Expense[];
  income: number;
  totalExpenses: number;
  balance: number;
  goal: number | null;
  progress: number;
  latest: Expense[];
}

export function computeSectionFinancials(
  params: UseSectionFinancialsParams
): UseSectionFinancialsResult {
  const { section, expenses, startDate, endDate } = params;

  const filteredExpenses = expenses.filter((e) => {
    const date = parseISO(e.date);
    return (
      isWithinInterval(date, { start: startDate, end: endDate }) &&
      (e.category === section.id || e.source === section.id)
    );
  });

  const income =
    section.type === "passive"
      ? 0
      : filteredExpenses
          .filter((e) => e.amount > 0 && e.category === section.id)
          .reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = filteredExpenses
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const balance = income + totalExpenses;
  const goal = section.goal || null;
  const progress = goal && goal > 0 ? Math.min((balance / goal) * 100, 100) : 0;

  const latest = [...filteredExpenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return { filteredExpenses, income, totalExpenses, balance, goal, progress, latest };
}

export function useSectionFinancials(
  params: UseSectionFinancialsParams
): UseSectionFinancialsResult {
  const { section, expenses, startDate, endDate } = params;

  return useMemo(
    () => computeSectionFinancials({ section, expenses, startDate, endDate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section, expenses, startDate, endDate]
  );
}
