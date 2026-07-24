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
  /** Ingresos del período seleccionado */
  income: number;
  /** Gastos del período seleccionado */
  totalExpenses: number;
  /** Balance acumulado total (todas las fechas) — representa el saldo real */
  balance: number;
  /** Balance solo del período filtrado */
  periodBalance: number;
  goal: number | null;
  progress: number;
  latest: Expense[];
}

export function computeSectionFinancials(
  params: UseSectionFinancialsParams
): UseSectionFinancialsResult {
  const { section, expenses, startDate, endDate } = params;

  // Todos los gastos de esta sección (sin filtro de fecha) para el balance real
  const allSectionExpenses = expenses.filter(
    (e) => e.category === section.id || e.source === section.id
  );

  // Gastos filtrados por período (para income/expenses del período y últimos movimientos)
  const filteredExpenses = allSectionExpenses.filter((e) => {
    const date = parseISO(e.date);
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  // Income/expenses del período seleccionado
  const income =
    section.type === "passive"
      ? 0
      : filteredExpenses
          .filter((e) => e.amount > 0 && e.category === section.id)
          .reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = filteredExpenses
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const periodBalance = income + totalExpenses;

  // Balance acumulado real (sin filtro de fecha)
  const allIncome =
    section.type === "passive"
      ? 0
      : allSectionExpenses
          .filter((e) => e.amount > 0 && e.category === section.id)
          .reduce((acc, e) => acc + e.amount, 0);

  const allExpenses = allSectionExpenses
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const balance = allIncome + allExpenses;

  const goal = section.goal || null;
  const progress = goal && goal > 0 ? Math.min((balance / goal) * 100, 100) : 0;

  const latest = [...filteredExpenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return { filteredExpenses, income, totalExpenses, balance, periodBalance, goal, progress, latest };
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
