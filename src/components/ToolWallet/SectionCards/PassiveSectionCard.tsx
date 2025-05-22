import React from "react";
import { parseISO, isWithinInterval } from "date-fns";
import { Section, Expense } from "@/types";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "@/components/UI/UIIncomeExpenseSummary";
import TransactionList from "@/components/ToolWallet/Home/TransactionList";
import UIButton from "@/components/UI/UIButton";

interface Props {
  section: Section;
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
  onAdd: (type: "income" | "expense", sectionId: string) => void;
}

const PassiveSectionCard: React.FC<Props> = ({
  section,
  expenses,
  startDate,
  endDate,
  onAdd,
}) => {

  const filteredExpenses = expenses.filter((e) => {
    const date = parseISO(e.date);
    return isWithinInterval(date, { start: startDate, end: endDate }) &&
      (e.category === section.id || e.source === section.id);
  });

  const income = 0;

  const totalExpenses = filteredExpenses
    .filter((e) => e.amount < 0)
    .reduce((acc, e) => acc + e.amount, 0);

  const balance = income + totalExpenses;
  const latest = [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

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
        {section.icon || "📁"} {section.name}
      </h2>

      <UIBalanceAmount amount={balance} />
      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />
      <TransactionList latest={latest} sections={[]} />

      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <UIButton variant="danger" fullWidth onClick={() => onAdd("expense", section.id)}>
          - Gasto
        </UIButton>
      </div>
    </div>
  );
};

export default PassiveSectionCard;
