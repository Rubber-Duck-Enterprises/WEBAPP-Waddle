import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UISelect from "../../UI/UISelect";
import UIButton from "../../UI/UIButton";
import { useSectionStore } from "../../../stores/sectionStore";

interface Props {
  type: "income" | "expense";
  sectionId?: string;
  needsSource?: boolean;
  onConfirm: (data: {
    description: string;
    amount: number;
    notes?: string;
    source?: string;
  }) => void;
  onCancel: () => void;
}

export const getAddGeneralExpenseModal = ({ type, sectionId, needsSource = false, onConfirm, onCancel }: Props) => {
  return <AddGeneralExpenseModal type={type} sectionId={sectionId} needsSource={needsSource} onConfirm={onConfirm} onCancel={onCancel} />;
};

const AddGeneralExpenseModal: React.FC<Props> = ({ type, sectionId, needsSource, onConfirm, onCancel }) => {
  const { sections } = useSectionStore();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<string>("");

  const availableSources = sections.filter((s) => s.id !== sectionId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>
        {type === "income" ? "Agregar ingreso" : "Agregar gasto"}
      </h3>

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

      {needsSource && (
        <UISelect value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Selecciona origen</option>
          <option value="general">General</option>
          {availableSources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon || "📁"} {s.name}
            </option>
          ))}
        </UISelect>
      )}

      <UITextInput
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
            onConfirm({
              description,
              amount,
              notes,
              source: needsSource ? source : undefined,
            })
          }
          variant="primary"
          disabled={!description || amount <= 0 || (needsSource && !source)}
        >
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

export default AddGeneralExpenseModal;
