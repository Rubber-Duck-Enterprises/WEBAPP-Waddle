import React, { useMemo, useState } from "react";

import { Expense } from "@/types";
import { useModal } from "@/context/ModalContext";
import { useWalletStore } from "@/stores/walletStore";
import MovementItem from "@/components/ToolWallet/Movements/MovementItem";
import TransferItem from "@/components/ToolWallet/Movements/TransferItem";
import EditExpenseModal from "@/components/Modal/Presets/Wallet/EditExpenseModal";
import { getConfirmDeleteMovmentModal } from "@/components/Modal/Presets/Wallet/ConfirmDeleteMovmentModal";
import UIButton from "@/components/UI/UIButton";

import WalletLayout from "@/layouts/WalletLayout";

const PAGE_SIZE = 30;

const Movements: React.FC = () => {
  const { sections, expenses, deleteExpense, updateExpense } = useWalletStore();
  const { showModal, hideModal } = useModal();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses]
  );

  const isTransfer = (expense: Expense): boolean => {
    if (expense.transferId) return true;
    return (
      expense.description.startsWith("Transferencia a ") ||
      expense.description.startsWith("Transferencia desde ")
    );
  };

  const findTransferPair = (expense: Expense): Expense | undefined => {
    if (expense.transferId) {
      return expenses.find(
        (e) => e.transferId === expense.transferId && e.id !== expense.id
      );
    }
    return expenses.find(
      (e) =>
        e.notes === expense.notes &&
        e.id !== expense.id &&
        isTransfer(e)
    );
  };

  const handleDelete = (id: string) => {
    showModal(
      getConfirmDeleteMovmentModal({
        onCancel: hideModal,
        onConfirm: () => {
          deleteExpense(id);
          hideModal();
        },
      })
    );
  };

  const handleEdit = (expenseToEdit: Expense) => {
    showModal(
      <EditExpenseModal
        expense={expenseToEdit}
        sections={sections}
        onCancel={hideModal}
        onConfirm={(updatedData) => {
          updateExpense(expenseToEdit.id, updatedData);
          hideModal();
        }}
      />
    );
  };

  const visibleExpenses = sortedExpenses.slice(0, visibleCount);
  const hasMore = visibleCount < sortedExpenses.length;
  const groupedTransfers = new Set<string>();

  return (
    <WalletLayout>
      <div style={{ padding: "1rem" }}>
        {expenses.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1rem",
            color: "var(--text-secondary)",
            textAlign: "center",
            gap: "0.5rem",
          }}>
            <span style={{ fontSize: "2.5rem" }}>🧾</span>
            <p style={{ fontWeight: 600 }}>Sin movimientos</p>
            <p style={{ fontSize: "0.85rem" }}>
              Agrega ingresos o gastos desde el inicio para verlos aquí.
            </p>
          </div>
        ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {visibleExpenses.map((expense) => {
              // Mostrar transferencias agrupadas solo una vez
              if (isTransfer(expense)) {
                const groupKey = expense.transferId || expense.notes || "";
                if (!groupedTransfers.has(groupKey)) {
                  const pair = findTransferPair(expense);

                  if (pair) {
                    groupedTransfers.add(groupKey);

                    const from = expense.amount < 0 ? expense : pair;
                    const to = expense.amount > 0 ? expense : pair;

                    const fromLabel = from.category === "general"
                      ? "General"
                      : `${sections.find(s => s.id === from.category)?.icon || "📁"} ${sections.find(s => s.id === from.category)?.name}`;

                    const toLabel = to.category === "general"
                      ? "General"
                      : `${sections.find(s => s.id === to.category)?.icon || "📁"} ${sections.find(s => s.id === to.category)?.name}`;

                    return (
                      <TransferItem
                        key={expense.transferId || expense.notes}
                        amount={Math.abs(expense.amount)}
                        fromLabel={fromLabel}
                        toLabel={toLabel}
                        date={expense.date}
                        notes={expense.notes}
                      />
                    );
                  }
                } else {
                  return null;
                }
              }

              if (!isTransfer(expense)) {
                const section = sections.find((s) => s.id === expense.category);
                return (
                  <MovementItem
                    key={expense.id}
                    expense={expense}
                    section={section}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                );
              }

              return null;
            })}
          </ul>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
              <UIButton
                variant="secondary"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              >
                Cargar más ({sortedExpenses.length - visibleCount} restantes)
              </UIButton>
            </div>
          )}
        </>
        )}
      </div>
    </WalletLayout>
  );
};

export default Movements;
