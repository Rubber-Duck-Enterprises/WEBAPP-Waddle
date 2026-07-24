import { useMemo } from "react";
import { Expense } from "@/types";

/**
 * Pre-indexa los expenses por sección para evitar O(n) lookups
 * en cada SectionCard. Retorna un Map<sectionId, Expense[]>.
 *
 * Un expense aparece bajo la sección de su `category` y de su `source` (si tiene).
 */
export function useExpensesBySection(expenses: Expense[]): Map<string, Expense[]> {
  return useMemo(() => {
    const map = new Map<string, Expense[]>();

    for (const expense of expenses) {
      // Indexar por category
      if (expense.category) {
        const list = map.get(expense.category);
        if (list) {
          list.push(expense);
        } else {
          map.set(expense.category, [expense]);
        }
      }

      // Indexar también por source (para gastos que se pagan desde otra sección)
      if (expense.source && expense.source !== expense.category) {
        const list = map.get(expense.source);
        if (list) {
          list.push(expense);
        } else {
          map.set(expense.source, [expense]);
        }
      }
    }

    return map;
  }, [expenses]);
}
