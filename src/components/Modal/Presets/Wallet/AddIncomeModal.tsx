// components/Modal/Presets/Wallet/AddIncomeModal.tsx
import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";

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
  const { showPopUp } = usePopUp();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>🤑 Agregar ingreso</h3>

      <UITextInput
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <UITextInput
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
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
          disabled={false}
          onClick={() => {
            try {
              if (!description.trim()) {
                showPopUp("DANGER", "Escribe una descripción.");
                return;
              }
              if (Number(amount) <= 0) {
                showPopUp("DANGER", "El monto debe ser mayor a 0.");
                return;
              }
              onConfirm({
                description,
                amount: Math.abs(Number(amount)),
                notes,
                category: sectionId,
              });
              showPopUp("SUCCESS", "Ingreso agregado.");
            } catch (error) {
              showPopUp("DANGER", "Error al agregar el ingreso.");
              console.error("AddIncomeModal - Error:", error);
            }
          }}
        >
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

export default AddIncomeModal;
