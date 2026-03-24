import React from "react";
import useAnimatedNumber from "../../hooks/useAnimatedNumber";
import "./UIBalanceAmount.css";

interface Props {
  amount: number;
}

const UIBalanceAmount: React.FC<Props> = ({ amount }) => {
  const { displayValue, animation } = useAnimatedNumber(amount);

  const color =
    amount > 0
      ? "var(--success-color)"
      : amount < 0
      ? "var(--danger-color)"
      : "var(--text-primary)";

  return (
    <div style={{ color }}>
      <div
        className={`balance-amount ${animation}`}
        style={{
          color,
          width: "fit-content",
        }}
      >
        ${displayValue.toLocaleString()}
      </div>
    </div>
  );
};

export default UIBalanceAmount;
