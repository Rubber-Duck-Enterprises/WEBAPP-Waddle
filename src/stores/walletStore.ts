import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import localforage from "localforage";
import { 
  Section,
  Expense,
  ExpenseKind
} from "@/types";
import { createScopedStorage } from "@/lib/scopedStorage";

interface WalletStore {
  sections: Section[];
  hasFirstWallet: boolean;

  setFirstWalletWasCreated: () => void;
  addSection: (section: Omit<Section, "id" | "createdAt">) => void;
  updateSection: (id: string, updated: Partial<Omit<Section, "id" | "createdAt">>) => void;
  deleteSection: (id: string) => void;

  expenses: Expense[];

  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updatedExpense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  clearExpenses: () => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      sections: [],
      hasFirstWallet: false,

      setFirstWalletWasCreated: () => {
        set({ hasFirstWallet: true })
      },
      addSection: (section) => {
        const newSection: Section = {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          type: section.type ?? "standard",
          ...section,
        };
        set({ sections: [...get().sections, newSection] });
      },
      updateSection: (id, updated) => {
        set({
          sections: get().sections.map((s) =>
            s.id === id ? { ...s, ...updated } : s
          ),
        });
      },
      deleteSection: (id) => {
        set({ sections: get().sections.filter((s) => s.id !== id) });
      },

      expenses: [],
      
      addExpense: (expense) => {
        const kind: ExpenseKind =
          expense.kind ??
          (expense.amount < 0 ? "expense" : "income");

        const newExpense: Expense = {
          ...expense,
          id: nanoid(),
          kind,
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
      name: "waddle-wallet",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
    }
  )
);
