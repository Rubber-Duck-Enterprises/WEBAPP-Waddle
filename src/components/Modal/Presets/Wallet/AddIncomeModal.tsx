// components/Modal/Presets/Wallet/AddIncomeModal.tsx
import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";

interface Props {
  sectionId?: string;
  onConfirm: (data: {
    description: string;
    amount: number;
    notes?: string;
    category: string;
  }) => void;
  onCancel: () => void;
}

export const getAddIncomeModal = (props: Props) => <AddIncomeModal {...props} />;

const AddIncomeModal: React.FC<Props> = ({ sectionId = "general", onConfirm, onCancel }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Agregar ingreso</h3>

      <UITextInput
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <UITextInput
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        min={0.01}
        step={0.01}
      />

      <UITextInput
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          variant="primary"
          disabled={!description || amount <= 0}
          onClick={() =>
            onConfirm({
              description,
              amount: Math.abs(amount),
              notes,
              category: sectionId,
            })
          }
        >
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

export default AddIncomeModal;
