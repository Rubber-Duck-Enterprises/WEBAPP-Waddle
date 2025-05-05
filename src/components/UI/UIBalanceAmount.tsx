// components/UI/BalanceAmount.tsx
import React from "react";

interface Props {
  amount: number;
}

const UIBalanceAmount: React.FC<Props> = ({ amount }) => (
  <div
    style={{
      fontSize: "2rem",
      fontWeight: "bold",
      color: amount >= 0 ? "#4caf50" : "#f44336",
    }}
  >
    ${amount.toLocaleString()}
  </div>
);

export default UIBalanceAmount;
