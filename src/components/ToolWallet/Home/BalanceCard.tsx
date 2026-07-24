import React from "react";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "@/components/UI/UIIncomeExpenseSummary";
import TransactionList from "./TransactionList";

import { Expense, Section } from "@/types";

interface Props {
  income: number;
  totalExpenses: number;
  balance: number;
  latest: Expense[];
  sections: Section[];
}

const BalanceCard: React.FC<Props> = ({ 
  income, 
  totalExpenses, 
  balance, 
  latest,
  sections,
}) => {
  return (
    <div
      style={{
        background: "var(--surface)",
        color: "var(--text-primary)",
        borderRadius: "12px",
        padding: "1rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Balance general</h2>
      </div>

      <UIBalanceAmount amount={balance} />

      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />

      {latest.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center", margin: "0.5rem 0" }}>
          No hay movimientos en este período.
        </p>
      ) : (
        <TransactionList latest={latest} sections={sections} />
      )}
    </div>
  );
};

export default BalanceCard;
