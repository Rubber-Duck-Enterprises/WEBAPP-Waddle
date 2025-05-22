import React, { useEffect, useRef, useState } from "react";
import "./UIBalanceAmount.css";

interface Props {
  used: number;
  limit: number;
  cutoffDays: number;
  paymentDays: number;
}

const UICreditInfoSummary: React.FC<Props> = ({ used, limit, cutoffDays, paymentDays }) => {
  const [displayUsed, setDisplayUsed] = useState(used);
  const [displayCutoff, setDisplayCutoff] = useState(cutoffDays);
  const [displayPayment, setDisplayPayment] = useState(paymentDays);

  const prevUsed = useRef(used);
  const prevCutoff = useRef(cutoffDays);
  const prevPayment = useRef(paymentDays);

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
      setDisplay(Math.round(current));
      if (i >= stepCount) {
        clearInterval(interval);
        setDisplay(target);
        ref.current = target;
      }
    }, 20);
  };

  useEffect(() => animate(prevUsed, used, setDisplayUsed), [used]);
  useEffect(() => animate(prevCutoff, cutoffDays, setDisplayCutoff), [cutoffDays]);
  useEffect(() => animate(prevPayment, paymentDays, setDisplayPayment), [paymentDays]);

  return (
    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
      <div>Uso: <strong>{percentUsed}%</strong></div>
      <div>Límite total: <strong>${limit.toLocaleString()}</strong></div>
      <div>Días para corte: <strong>{displayCutoff}</strong></div>
      <div>Días para pago: <strong>{displayPayment}</strong></div>
    </div>
  );
};

export default UICreditInfoSummary;
