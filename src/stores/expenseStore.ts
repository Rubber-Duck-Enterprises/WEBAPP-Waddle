import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { Expense } from "../types";

interface ExpenseStore {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updatedExpense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  clearExpenses: () => void;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: nanoid(),
        };
        set({ expenses: [...get().expenses, newExpense] });
      },
      updateExpense: (id, updatedExpense) => {
        set({
          expenses: get().expenses.map((exp) =>
            exp.id === id ? { ...exp, ...updatedExpense } : exp
          ),
        });
      },
      deleteExpense: (id) => {
        set({ expenses: get().expenses.filter((e) => e.id !== id) });
      },
      clearExpenses: () => {
        set({ expenses: [] });
      },
    }),
    {
      name: "waddle-expenses",
      storage: createJSONStorage(() => localforage),
    }
  )
);
