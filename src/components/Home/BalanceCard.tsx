import React from "react";

import UIButton from "../UI/UIButton";
import UIToggle from "../UI/UIToggle";
import UIBalanceAmount from "../UI/UIBalanceAmount";
import UIIncomeExpenseSummary from "../UI/UIIncomeExpenseSummary";
import { useModal } from "../../context/ModalContext";
import TransferFundsModal from "../Modal/Presets/TransferFundsModal";
import TransactionList from "./TransactionList";

import { Expense, Section } from "../../types";
import { useExpenseStore } from "../../stores/expenseStore";

interface Props {
  income: number;
  totalExpenses: number;
  balance: number;
  latest: Expense[];
  sections: Section[];
  onlyGeneral: boolean;
  expenses: Expense[];
  setOnlyGeneral: (value: boolean) => void;
  openModal: (type: "income" | "expense") => void;
}

const BalanceCard: React.FC<Props> = ({ 
  income, 
  totalExpenses, 
  balance, 
  latest,
  sections,
  onlyGeneral,
  setOnlyGeneral,
  openModal 
}) => {
  const { showModal, hideModal } = useModal();
  const { addExpense } = useExpenseStore();

  const openTransferModal = () => {
    showModal(
      <TransferFundsModal
        mode="general"
        sections={sections}
        destinationId={undefined}
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
        {/* <UIToggle
          label="Solo generales"
          checked={onlyGeneral}
          onChange={setOnlyGeneral}
        /> */}
      </div>

      <UIBalanceAmount amount={balance} />

      <UIIncomeExpenseSummary income={income} totalExpenses={totalExpenses} />

      <TransactionList latest={latest} sections={sections} />

      {/* <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <UIButton
          variant="primary"
          fullWidth
          onClick={() => openModal("income")}
        >
          + Ingreso
        </UIButton>

        <UIButton
          variant="secondary"
          style={{ width: "64px" }}
          onClick={openTransferModal}
        >
          ↔
        </UIButton>

        <UIButton
          variant="danger"
          fullWidth
          onClick={() => openModal("expense")}
        >
          + Gasto
        </UIButton>
      </div> */}
    </div>
  );
};

export default BalanceCard;
