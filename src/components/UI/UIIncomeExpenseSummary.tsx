import React from "react";
import useAnimatedNumber from "../../hooks/useAnimatedNumber";
import "./UIBalanceAmount.css";

interface Props {
  income: number;
  totalExpenses: number;
}

const UIIncomeExpenseSummary: React.FC<Props> = ({ income, totalExpenses }) => {
  const { displayValue: displayIncome, animation: incomeAnim } = useAnimatedNumber(income);
  const { displayValue: displayExpenses, animation: expenseAnim } = useAnimatedNumber(totalExpenses);

  return (
    <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
      <span className={incomeAnim}>
        <span style={{ color: "var(--success-color)" }}>
          + Ingresos: ${Math.round(displayIncome).toLocaleString()}
        </span>
      </span>
      <span className={expenseAnim}>
        <span style={{ color: "var(--danger-color)" }}>
          - Gastos: ${Math.abs(Math.round(displayExpenses)).toLocaleString()}
        </span>
      </span>
    </div>
  );
};

export default UIIncomeExpenseSummary;
