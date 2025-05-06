import React, { useEffect, useRef, useState } from "react";
import "./UIBalanceAmount.css";

interface Props {
  amount: number;
}

const UIBalanceAmount: React.FC<Props> = ({ amount }) => {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [animation, setAnimation] = useState<"up" | "down" | "">("");
  const previousAmount = useRef(amount);

  useEffect(() => {
    const diff = amount - previousAmount.current;
    if (diff === 0) return;
  
    setAnimation(diff > 0 ? "up" : "down");
  
    const duration = 500;
    const start = performance.now();
    const startValue = previousAmount.current;
  
    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
  
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * ease;
  
      setDisplayAmount(Math.round(currentValue));
  
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimation("");
        previousAmount.current = amount;
      }
    };
  
    requestAnimationFrame(animate);
  }, [amount]);

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
        ${displayAmount.toLocaleString()}
      </div>
    </div>
  );
};

export default UIBalanceAmount;
