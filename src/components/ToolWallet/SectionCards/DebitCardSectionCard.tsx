import React from "react";
import { parseISO, isWithinInterval } from "date-fns";
import { Section, Expense } from "@/types";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "@/components/UI/UIIncomeExpenseSummary";
import UIProgressBar from "@/components/UI/UIProgressBar";
import UIButton from "@/components/UI/UIButton";
import TransactionList from "@/components/ToolWallet/Home/TransactionList";
import AdjustBalanceModal from "@/components/Modal/Presets/Wallet/AdjustBalanceModal";
import { getTransferFundsModal } from "@/components/Modal/Presets/Wallet/TransferFundsModal";

import { useModal } from "@/context/ModalContext";
import { useExpenseStore } from "@/stores/expenseStore";
import { useSectionStore } from "@/stores/sectionStore";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string) => void;
}

const DebitCardSectionCard: React.FC<Props> = ({
  section,
  expenses,
  startDate,
  endDate,
  onAdd,
}) => {
  const { showModal, hideModal } = useModal();
  const { addExpense } = useExpenseStore();
  const { sections } = useSectionStore();

  const filteredExpenses = expenses.filter((e) => {
    const date = parseISO(e.date);
    return isWithinInterval(date, { start: startDate, end: endDate }) &&
      (e.category === section.id || e.source === section.id);
  });

  const income = filteredExpenses
    .filter((e) => e.amount > 0 && e.category === section.id)
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = filteredExpenses
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const balance = income + totalExpenses;
  const goal = section.goal || 0;
  const progress = goal > 0 ? Math.min((balance / goal) * 100, 100) : 0;

  const latest = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const handleAdjust = () => {
    showModal(
      <AdjustBalanceModal
        currentBalance={balance}
        onCancel={hideModal}
        onConfirm={(target) => {
          const diff = target - balance;
          if (diff === 0) return;

          addExpense({
            description: "Ajuste manual",
            amount: diff,
            category: section.id,
            date: new Date().toISOString(),
            notes: "Ajuste de balance",
            adjustment: true,
          });

          hideModal();
        }}
      />
    );
  };

  return (
    <div
      style={{
        background: `${section.color || "var(--surface)"}1A`,
        borderRadius: "12px",
        padding: "1rem",
        border: `1px solid ${section.color || "var(--border-color)"}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h2>
        {section.icon || "💳"} {section.name}
      </h2>

      {goal > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Progreso</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
              ${balance.toLocaleString()} / ${goal.toLocaleString()}
            </span>
          </div>
          <UIProgressBar value={progress} max={100} />
        </>
      )}

      <UIBalanceAmount amount={balance} />
      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />
      <TransactionList latest={latest} sections={[]} />

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            width: "100%",
          }}
        > 
          <UIButton variant="primary" fullWidth onClick={() => onAdd("income", section.id)}>
            + Ingreso
          </UIButton>
          <UIButton variant="danger" fullWidth onClick={() => onAdd("expense", section.id)}>
            - Gasto
          </UIButton>
        </div>
        <UIButton
          variant="secondary"
          fullWidth
          onClick={() =>
            showModal(
              getTransferFundsModal({
                fromSection: section,
                onCancel: hideModal,
                onConfirm: ({ toId, amount, notes }) => {
                  const now = new Date().toISOString();
                  const toSection = sections.find((s) => s.id === toId);

                  addExpense({
                    description: `Transferencia a ${toSection?.icon || "📁"} ${toSection?.name || toId}`,
                    amount: -Math.abs(amount),
                    category: section.id,
                    notes,
                    date: now,
                  });

                  addExpense({
                    description: `Transferencia desde ${section.icon || "📁"} ${section.name}`,
                    amount: Math.abs(amount),
                    category: toId,
                    notes,
                    date: now,
                  });

                  hideModal();
                },
              })
            )
          }
        >
          Transferir
        </UIButton>
        <UIButton variant="default" fullWidth onClick={handleAdjust}>
          Ajustar balance
        </UIButton>
      </div>
    </div>
  );
};

export default DebitCardSectionCard;
