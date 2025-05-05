import React from "react";
import { parseISO, isWithinInterval } from "date-fns";

import UIButton from "../UI/UIButton";
import UIBalanceAmount from "../UI/UIBalanceAmount";
import UIProgressBar from "../UI/UIProgressBar";

import { useModal } from "../../context/ModalContext";
import TransferFundsModal from "../Modal/Presets/TransferFundsModal";
import TransactionList from "./TransactionList";

import { Expense, Section } from "../../types";
import { useExpenseStore } from "../../stores/expenseStore";
import { useSectionStore } from "../../stores/sectionStore";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string) => void;
}

const SectionBalanceCard: React.FC<Props> = ({ 
  section, 
  expenses, 
  startDate,
  endDate,
  onAdd
}) => {
  const { showModal, hideModal } = useModal();
  const { addExpense } = useExpenseStore();
  const { sections } = useSectionStore();

  const filtered = expenses.filter((e) => {
    const date = parseISO(e.date);
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  const income = filtered.filter((e) => e.amount > 0).reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = filtered.filter((e) => e.amount < 0).reduce((acc, e) => acc + e.amount, 0);
  const balance = income + totalExpenses;
  const latest = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const bgColor = `${section.color || "#ccc"}1A`;
  const goal = section.goal || 0;
  const progress = goal > 0 ? Math.min((balance / goal) * 100, 100) : 0;

  const openTransferToThisModal = () => {
    showModal(
      <TransferFundsModal
        mode="to-this"
        destinationId={section.id}
        sections={sections}
        onCancel={hideModal}
        onConfirm={({ from, to, amount, notes }) => {
          const fromLabel = from === "general"
            ? "General"
            : sections.find((s) => s.id === from)?.name || from;

          const toLabel = to === "general"
            ? "General"
            : sections.find((s) => s.id === to)?.name || to;

          addExpense({
            description: `Transferencia a ${toLabel}`,
            amount: -amount,
            category: from,
            date: new Date().toISOString(),
            notes,
          });

          addExpense({
            description: `Transferencia desde ${fromLabel}`,
            amount,
            category: to,
            date: new Date().toISOString(),
            notes,
          });

          hideModal();
        }}
      />
    );
  };

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "12px",
        padding: "1rem",
        border: `1px solid ${section.color || "#ccc"}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h2>
        {section.icon || "📁"} {section.name}
      </h2>

      {goal > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.85rem" }}>Progreso</span>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
              ${balance.toLocaleString()} / ${goal.toLocaleString()}
            </span>
          </div>
          <UIProgressBar value={progress} max={100} />
        </div>
      )}

      <UIBalanceAmount amount={balance} />

      <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
        <span style={{ color: "#4caf50" }}>+ Ingresos: ${income.toLocaleString()}</span>
        <span style={{ color: "#f44336" }}>- Gastos: ${Math.abs(totalExpenses).toLocaleString()}</span>
      </div>

      <TransactionList latest={latest} sections={[]} />

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <UIButton
          variant="primary"
          fullWidth
          onClick={() => onAdd("income", section.id)}
        >
          + Ingreso
        </UIButton>

        <UIButton
          variant="secondary"
          style={{ width: "64px" }}
          onClick={openTransferToThisModal}
        >
          ↔
        </UIButton>

        <UIButton
          variant="danger"
          fullWidth
          onClick={() => onAdd("expense", section.id)}
        >
          + Gasto
        </UIButton>
      </div>
    </div>
  );
};

export default SectionBalanceCard;
