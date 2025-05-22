import React, { useEffect, useRef, useState } from "react";

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
  const [displayUsed, setDisplayUsed] = useState(used);
  const [displayCutoff ] = useState(cutoffDays);
  const [displayPayment ] = useState(paymentDays);

  const prevUsed = useRef(used);

  const percentUsed = limit > 0 ? Math.round((displayUsed / limit) * 100) : 0;

  const animate = (
    ref: React.MutableRefObject<number>,
    target: number,
    setDisplay: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const diff = target - ref.current;
    if (diff === 0) return;
    const stepCount = 20;
    const step = diff / stepCount;
    let current = ref.current;
    let i = 0;

    const interval = setInterval(() => {
      current += step;
      i++;
      setDisplay(current);
      if (i >= stepCount) {
        clearInterval(interval);
        setDisplay(target);
        ref.current = target;
      }
    }, 20);
  };

  useEffect(() => animate(prevUsed, used, setDisplayUsed), [used]);

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            gap: "0.5rem",
          }}
        >
          <div>
            <div>Uso: <strong>{percentUsed}%</strong></div>
            <div>de <strong>${limit.toLocaleString()}</strong></div>
          </div>
          <div>
            <div>Días para corte: <strong>{displayCutoff}</strong></div>
            <div>Días para pago: <strong>{displayPayment}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UICreditInfoSummary;
