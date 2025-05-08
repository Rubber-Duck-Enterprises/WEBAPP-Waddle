import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UITextArea from "../../UI/UITextArea";
import UISelect from "../../UI/UISelect";
import UIButton from "../../UI/UIButton";

import { useSectionStore } from "../../../stores/sectionStore";

type Props = {
  type: "income" | "expense";
  sectionId?: string;
  onConfirm: (data: {
    description: string;
    amount: number;
    notes?: string;
    source?: string;
  }) => void;
  onCancel: () => void;
};

export const getAddGeneralExpenseModal = ({
  type,
  onConfirm,
  onCancel,
  sectionId,
}: Props) => {
  return (
    <AddGeneralExpenseModal
      type={type}
      onConfirm={onConfirm}
      onCancel={onCancel}
      sectionId={sectionId}
    />
  );
};

const AddGeneralExpenseModal: React.FC<Props> = ({
  type,
  onConfirm,
  onCancel,
  sectionId,
}) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");

  const isIncome = type === "income";

  const sections = useSectionStore((state) => state.sections);
  const sourceOptions = sections.filter((s) => s.id !== sectionId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
        value={amount ?? ""}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      {type === "expense" && sourceOptions.length > 0 && (
        <UISelect
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">Selecciona fuente de pago</option>
          {sourceOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </UISelect>
      )}

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
          onClick={() =>
            amount !== null &&
            onConfirm({
              description,
              amount,
              notes: notes || undefined,
              source: source || undefined,
            })
          }
          variant={isIncome ? "primary" : "danger"}
          disabled={!description || amount === null || amount <= 0}
        >
          Agregar
        </UIButton>
      </div>
    </div>
  );
};

export default AddGeneralExpenseModal;
