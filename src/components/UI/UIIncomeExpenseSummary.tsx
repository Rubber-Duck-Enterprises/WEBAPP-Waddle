import React, { useEffect, useRef, useState } from "react";
import "./UIBalanceAmount.css";

interface Props {
  income: number;
  totalExpenses: number;
}

const UIIncomeExpenseSummary: React.FC<Props> = ({ income, totalExpenses }) => {
  const [displayIncome, setDisplayIncome] = useState(income);
  const [displayExpenses, setDisplayExpenses] = useState(totalExpenses);

  const [incomeAnim, setIncomeAnim] = useState<"up" | "down" | "">("");
  const [expenseAnim, setExpenseAnim] = useState<"up" | "down" | "">("");

  const prevIncome = useRef(income);
  const prevExpense = useRef(totalExpenses);

  useEffect(() => {
    animateValue(prevIncome, income, setDisplayIncome, setIncomeAnim);
  }, [income]);

  useEffect(() => {
    animateValue(prevExpense, totalExpenses, setDisplayExpenses, setExpenseAnim);
  }, [totalExpenses]);

  const animateValue = (
    ref: React.MutableRefObject<number>,
    target: number,
    setDisplay: React.Dispatch<React.SetStateAction<number>>,
    setAnim: React.Dispatch<React.SetStateAction<"up" | "down" | "">>
  ) => {
    const diff = target - ref.current;
    if (diff === 0) return;

    setAnim(diff > 0 ? "up" : "down");

    const stepCount = 20;
    const step = diff / stepCount;
    let current = ref.current;
    let i = 0;

    const interval = setInterval(() => {
      current += step;
      i++;
      setDisplay(Math.round(current));
      if (i >= stepCount) {
        clearInterval(interval);
        setDisplay(target);
        setAnim("");
        ref.current = target;
      }
    }, 20);
  };

  return (
    <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
      <span className={incomeAnim}>
        <span style={{ color: "var(--success-color)" }}>
          + Ingresos: ${displayIncome.toLocaleString()}
        </span>
      </span>
      <span className={expenseAnim}>
        <span style={{ color: "var(--danger-color)" }}>
          - Gastos: ${Math.abs(displayExpenses).toLocaleString()}
        </span>
      </span>
    </div>
  );
};

export default UIIncomeExpenseSummary;
