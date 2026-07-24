import React from "react";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "@/components/UI/UIIncomeExpenseSummary";
import TransactionList from "./TransactionList";

import { Expense, Section } from "@/types";
import styles from "./BalanceCard.module.css";

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
    <div className={styles.card}>
      <div className={styles.header}>
        <h2>Balance general</h2>
      </div>

      <UIBalanceAmount amount={balance} />

      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />

      {latest.length === 0 ? (
        <p className={styles.emptyState}>
          No hay movimientos en este período.
        </p>
      ) : (
        <TransactionList latest={latest} sections={sections} defaultOpen />
      )}
    </div>
  );
};

export default BalanceCard;
