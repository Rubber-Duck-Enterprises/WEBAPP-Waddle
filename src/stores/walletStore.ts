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
  /** Elimina sección y migra sus gastos a otra sección */
  deleteSectionWithMigration: (sectionId: string, targetSectionId: string) => void;

  expenses: Expense[];

  addExpense: (expense: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updatedExpense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  clearExpenses: () => void;

  /** Crea una transferencia atómica entre dos secciones (dos expenses con transferId compartido) */
  createTransfer: (params: {
    fromSectionId: string;
    toSectionId: string;
    amount: number;
    notes?: string;
  }) => void;
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
      deleteSectionWithMigration: (sectionId, targetSectionId) => {
        const { expenses, sections } = get();
        const updatedExpenses = expenses.map((e) => {
          const updates: Partial<Expense> = {};
          if (e.category === sectionId) updates.category = targetSectionId;
          if (e.source === sectionId) updates.source = targetSectionId;
          return Object.keys(updates).length > 0 ? { ...e, ...updates } : e;
        });
        set({
          sections: sections.filter((s) => s.id !== sectionId),
          expenses: updatedExpenses,
        });
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
      createTransfer: ({ fromSectionId, toSectionId, amount, notes }) => {
        if (amount <= 0) return;
        const { sections, expenses } = get();
        const fromSection = sections.find((s) => s.id === fromSectionId);
        const toSection = sections.find((s) => s.id === toSectionId);
        if (!fromSection || !toSection) return;

        const now = new Date().toISOString();
        const transferId = nanoid();

        const fromExpense: Expense = {
          id: nanoid(),
          description: `Transferencia a ${toSection.icon || "📁"} ${toSection.name}`,
          amount: -Math.abs(amount),
          category: fromSectionId,
          notes: notes || "",
          date: now,
          transferId,
          kind: "expense",
        };

        const toExpense: Expense = {
          id: nanoid(),
          description: `Transferencia desde ${fromSection.icon || "📁"} ${fromSection.name}`,
          amount: Math.abs(amount),
          category: toSectionId,
          notes: notes || "",
          date: now,
          transferId,
          kind: "income",
        };

        set({ expenses: [...expenses, fromExpense, toExpense] });
      },
    }), 
    {
      name: "waddle-wallet",
      storage: createJSONStorage(() => createScopedStorage(localforage)),
    }
  )
);
