import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UITextArea from "../../UI/UITextArea";
import UIButton from "../../UI/UIButton";

type Props = {
  type: "income" | "expense";
  onConfirm: (data: { description: string; amount: number; notes?: string }) => void;
  onCancel: () => void;
};

export const getAddGeneralExpenseModal = ({ type, onConfirm, onCancel }: Props) => {
  return <AddGeneralExpenseModal type={type} onConfirm={onConfirm} onCancel={onCancel} />;
};

const AddGeneralExpenseModal: React.FC<Props> = ({ type, onConfirm, onCancel }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const isIncome = type === "income";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>
        {isIncome ? "Agregar ingreso" : "Agregar gasto"} general
      </h3>

      <UITextInput
        type="text"
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <UITextInput
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

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
          onClick={() => onConfirm({ description, amount, notes: notes || undefined })}
          variant={isIncome ? "primary" : "danger"}
          disabled={!description || amount <= 0}
        >
          Agregar
        </UIButton>
      </div>
    </div>
  );
};

export default AddGeneralExpenseModal;
