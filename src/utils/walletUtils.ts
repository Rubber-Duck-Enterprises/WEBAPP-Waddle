import React from "react";
import { Section, Expense } from "@/types";
import AdjustBalanceModal from "@/components/Modal/Presets/Wallet/AdjustBalanceModal";

/**
 * Creates two expense entries for a transfer between sections:
 * one negative from `fromSection` and one positive to `toSection`.
 * If `amount <= 0`, no expenses are created.
 */
export function createTransferExpenses(
  fromSection: Section,
  toSection: Section,
  amount: number,
  notes: string,
  addExpense: (expense: Omit<Expense, "id">) => void
): void {
  if (amount <= 0) return;

  const now = new Date().toISOString();

  addExpense({
    description: `Transferencia a ${toSection.icon || "📁"} ${toSection.name}`,
    amount: -Math.abs(amount),
    category: fromSection.id,
    notes,
    date: now,
  });

  addExpense({
    description: `Transferencia desde ${fromSection.icon || "📁"} ${fromSection.name}`,
    amount: Math.abs(amount),
    category: toSection.id,
    notes,
    date: now,
  });
}

/**
 * Returns a handler that opens `AdjustBalanceModal`.
 * On confirm, creates an adjustment expense with `amount = target - balance`.
 * If `target === balance`, no expense is created.
 */
export function createAdjustBalanceHandler(params: {
  balance: number;
  sectionId: string;
  addExpense: (expense: Omit<Expense, "id">) => void;
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
}): () => void {
  const { balance, sectionId, addExpense, showModal, hideModal } = params;

  return () => {
    showModal(
      React.createElement(AdjustBalanceModal, {
        currentBalance: balance,
        onCancel: hideModal,
        onConfirm: (target: number) => {
          const diff = target - balance;
          if (diff === 0) return;

          addExpense({
            description: "Ajuste manual",
            amount: diff,
            category: sectionId,
            date: new Date().toISOString(),
            notes: "Ajuste de balance",
            adjustment: true,
          });

          hideModal();
        },
      })
    );
  };
}
