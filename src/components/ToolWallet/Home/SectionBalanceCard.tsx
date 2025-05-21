import React from "react";
import { parseISO, isWithinInterval } from "date-fns";

import UIButton from "../../UI/UIButton";
import UIBalanceAmount from "../../UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "../../UI/UIIncomeExpenseSummary";
import UIProgressBar from "../../UI/UIProgressBar";

import TransactionList from "./TransactionList";

import { Expense, Section } from "../../../types";

interface Capabilities {
  canAddIncome: boolean;
  canAddExpense: boolean;
  canTransfer: boolean;
  needsSource: boolean;
}

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string) => void;
  capabilities: Capabilities;
}

const SectionBalanceCard: React.FC<Props> = ({ 
  section, 
  expenses, 
  startDate,
  endDate,
  onAdd,
  capabilities
}) => {
  const balanceExpenses = expenses.filter((e) => {
    const date = parseISO(e.date);
    return isWithinInterval(date, { start: startDate, end: endDate }) &&
      (e.category === section.id || e.source === section.id);
  });

  const income = balanceExpenses
    .filter((e) => e.amount > 0 && e.category === section.id)
    .reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = balanceExpenses
    .filter((e) => e.amount < 0 && (e.category === section.id || e.source === section.id))
    .reduce((acc, e) => acc + e.amount, 0);

  const balance = income + totalExpenses;
  const latest = [...balanceExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const goal = section.goal || 0;
  const progress = goal > 0 ? Math.min((balance / goal) * 100, 100) : 0;

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
        {section.icon || "\ud83d\udcc1"} {section.name}
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

      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />

      <TransactionList latest={latest} sections={[]} />

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        {capabilities.canAddIncome && (
          <UIButton
            variant="primary"
            fullWidth
            onClick={() => onAdd("income", section.id)}
          >
            + Ingreso
          </UIButton>
        )}

        {capabilities.canAddExpense && (
          <UIButton
            variant="danger"
            fullWidth
            onClick={() => onAdd("expense", section.id)}
          >
            + Gasto
          </UIButton>
        )}

        {capabilities.canTransfer && (
          <UIButton
            variant="secondary"
            fullWidth
            onClick={() => console.log("Abrir modal de transferencia")}
          >
            Transferir
          </UIButton>
        )}
      </div>
    </div>
  );
};

export default SectionBalanceCard;
