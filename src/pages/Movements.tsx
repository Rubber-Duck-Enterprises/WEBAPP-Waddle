import React from "react";

import { Expense } from "../types";
import { useModal } from "../context/ModalContext";
import { useExpenseStore } from "../stores/expenseStore";
import { useSectionStore } from "../stores/sectionStore";
import MovementItem from "../components/Movements/MovementItem";
import TransferItem from "../components/Movements/TransferItem";
import EditExpenseModal from "../components/Modal/Presets/EditExpenseModal";

import DefaultLayout from "../layouts/DefaultLayout";

const Movements: React.FC = () => {
  const groupedTransfers = new Set<string>();
  const { expenses, deleteExpense, updateExpense } = useExpenseStore();
  const { sections } = useSectionStore();
  const { showModal, hideModal } = useModal();

  const isTransfer = (expense: Expense): boolean => {
    return (
      expense.description.startsWith("Transferencia a ") ||
      expense.description.startsWith("Transferencia desde ")
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este movimiento?")) {
      deleteExpense(id);
    }
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

  return (
    <DefaultLayout>
      <div style={{ padding: "1rem" }}>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {expenses
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((expense) => {
            // Mostrar transferencias agrupadas solo una vez
            if (isTransfer(expense) && !groupedTransfers.has(expense.notes || "")) {
              const pair = expenses.find(
                (e) =>
                  e.notes === expense.notes &&
                  e.id !== expense.id &&
                  isTransfer(e)
              );

              if (pair) {
                groupedTransfers.add(expense.notes || "");

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
                    key={expense.notes}
                    amount={Math.abs(expense.amount)}
                    fromLabel={fromLabel}
                    toLabel={toLabel}
                    date={expense.date}
                    notes={expense.notes}
                  />
                );
              }
            }

            // Si no es transferencia, mostrar como movimiento normal
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
      </div>
    </DefaultLayout>
  );
};

export default Movements;
