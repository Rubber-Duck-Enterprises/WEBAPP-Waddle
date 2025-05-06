import React, { useState, useEffect } from "react";
import { Section } from "../../../types";
import { useExpenseStore } from "../../../stores/expenseStore";

import UITextInput from "../../UI/UITextInput";
import UITextArea from "../../UI/UITextArea";
import UISelect from "../../UI/UISelect";
import UIButton from "../../UI/UIButton";

type Props = {
  sections: Section[];
  onCancel: () => void;
  onConfirm: (transfer: {
    from: string;
    to: string;
    amount: number;
    notes?: string;
  }) => void;
  mode: "general" | "to-this";
  destinationId?: string;
};

const TransferFundsModal: React.FC<Props> = ({
  sections,
  onCancel,
  onConfirm,
  mode,
  destinationId,
}) => {
  const isToThis = mode === "to-this";
  const { expenses: allExpenses } = useExpenseStore();

  const [from, setFrom] = useState("general");
  const [to, setTo] = useState(isToThis ? destinationId! : "general");
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [available, setAvailable] = useState(0);

  const computeBalance = (category: string) => {
    const filtered = allExpenses.filter((e) => e.category === category);
    const income = filtered.filter((e) => e.amount > 0).reduce((a, e) => a + e.amount, 0);
    const expense = filtered.filter((e) => e.amount < 0).reduce((a, e) => a + e.amount, 0);
    return income + expense;
  };

  useEffect(() => {
    if (from === to) {
      const fallback = sections.find((s) => s.id !== to)?.id || "general";
      setFrom(fallback);
    }
  }, [to]);

  useEffect(() => {
    if (isToThis && destinationId) {
      setTo(destinationId);
    }
  }, [isToThis, destinationId]);

  useEffect(() => {
    setAvailable(computeBalance(from));
  }, [from, allExpenses]);

  const handleConfirm = () => {
    if (amount <= 0 || amount > available || from === to) return;
    onConfirm({ from, to, amount, notes: notes || undefined });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>Mover fondos</h3>

      <label style={{ color: "var(--text-primary)" }}>Desde:</label>
      <UISelect value={from} onChange={(e) => setFrom(e.target.value)}>
        <option value="general" disabled={to === "general"}>General</option>
        {sections
          .filter((s) => s.id !== to)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon || "📁"} {s.name}
            </option>
          ))}
      </UISelect>

      <label style={{ color: "var(--text-primary)" }}>Hacia:</label>
      <UISelect
        disabled={isToThis}
        value={to}
        onChange={(e) => setTo(e.target.value)}
      >
        <option value="general">General</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon || "📁"} {s.name}
          </option>
        ))}
      </UISelect>

      <label style={{ color: "var(--text-primary)" }}>Monto:</label>
      <UITextInput
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Cantidad"
      />

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        Disponible en origen: <strong>${available.toLocaleString()}</strong>
      </div>

      <UITextArea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton
          onClick={handleConfirm}
          variant="secondary"
          disabled={!from || !to || amount <= 0 || from === to || amount > available}
        >
          Confirmar transferencia
        </UIButton>
      </div>
    </div>
  );
};

export default TransferFundsModal;
