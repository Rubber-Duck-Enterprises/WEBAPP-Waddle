// components/Modal/Presets/Wallet/AddCreditCardExpenseModal.tsx
import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";
import { Section } from "@/types";

interface Props {
  section: Section;
  available: number;
  onCancel: () => void;
  onConfirm: (data: { amount: number; description: string; notes?: string }) => void;
}

export const getAddCreditCardExpenseModal = ({
  section,
  available,
  onCancel,
  onConfirm,
}: Props) => (
  <AddCreditCardExpenseModal
    section={section}
    available={available}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

const AddCreditCardExpenseModal: React.FC<Props> = ({
  section,
  available,
  onCancel,
  onConfirm,
}) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = Number(amount) > 0 && Number(amount) <= available && description.trim() !== "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>Nuevo gasto con tarjeta {section.name}</h3>

      <UITextInput
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <UITextInput
        type="number"
        placeholder="Monto"
        value={amount}
        min={0.01}
        max={available}
        step={0.01}
        onChange={(e) => setAmount(e.target.value)}
      />

      <UITextInput
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        Disponible: <strong>${available.toLocaleString()}</strong>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton variant="default" onClick={onCancel}>
          Cancelar
        </UIButton>
        <UIButton
          variant="danger"
          disabled={!isValid}
          onClick={() => onConfirm({ amount: Number(amount), description, notes })}
        >
          Agregar gasto
        </UIButton>
      </div>
    </div>
  );
};

export default AddCreditCardExpenseModal;
