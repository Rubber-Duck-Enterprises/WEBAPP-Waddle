import React from "react";

import UIBalanceAmount from "@/components/UI/UIBalanceAmount";

import "./UIBalanceAmount.css";

interface Props {
  amount: number;
  used: number;
  limit: number;
  cutoffDays: number;
  paymentDays: number;
}

const UICreditInfoSummary: React.FC<Props> = ({ amount, used, limit, cutoffDays, paymentDays }) => {
  const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return (
    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <UIBalanceAmount amount={amount} />
        <div>
          <div>Uso: <strong>{percentUsed}%</strong></div>
          <div>de <strong>${limit.toLocaleString()}</strong></div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          gap: "0.5rem",
        }}
      >
        <div>Días para corte: <strong>{cutoffDays}</strong></div>
        <div>Días para pago: <strong>{paymentDays}</strong></div>
      </div>
    </div>
  );
};

export default UICreditInfoSummary;
