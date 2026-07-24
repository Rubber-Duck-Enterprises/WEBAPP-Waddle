import { useMemo } from "react";
import { parseISO, isWithinInterval } from "date-fns";
import { Expense } from "@/types";

export interface WalletSummary {
  income: number;
  totalExpenses: number;
  balance: number;
  latest: Expense[];
  allExpensesInRange: Expense[];
}

/**
 * Hook que calcula el resumen financiero general del wallet
 * filtrando por rango de fechas y excluyendo transferencias internas.
 */
export function useWalletSummary(
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): WalletSummary {
  return useMemo(() => {
    const allExpensesInRange = expenses.filter((e) => {
      const date = parseISO(e.date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const income = allExpensesInRange
      .filter((e) => {
        if (e.amount <= 0) return false;
        // Excluir transferencias internas del income
        if (e.transferId) return false;
        if (e.description.startsWith("Transferencia desde ")) return false;
        return true;
      })
      .reduce((acc, e) => acc + e.amount, 0);

    const totalExpenses = allExpensesInRange
      .filter((e) => {
        if (e.amount >= 0) return false;
        // Excluir transferencias internas
        if (e.transferId) return false;
        if (e.description.startsWith("Transferencia a ")) return false;
        return true;
      })
      .reduce((acc, e) => acc + e.amount, 0);

    const balance = income + totalExpenses;

    const latest = [...allExpensesInRange]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return { income, totalExpenses, balance, latest, allExpensesInRange };
  }, [expenses, startDate, endDate]);
}
