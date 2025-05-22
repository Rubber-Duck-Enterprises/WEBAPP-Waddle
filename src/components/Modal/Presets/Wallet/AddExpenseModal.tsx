import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import { useSectionStore } from "@/stores/sectionStore";

interface Props {
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

export const getAddExpenseModal = (props: Props) => <AddExpenseModal {...props} />;

const AddExpenseModal: React.FC<Props> = ({
  sectionId,
  needsSource = false,
  onConfirm,
  onCancel,
}) => {
  const { sections } = useSectionStore();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"credit" | "debit">("debit");

  const availableSources = sections.filter((s) => s.id !== sectionId);

  const selectedSource = sections.find((s) => s.id === source);
  const isBothCard = selectedSource?.type === "card" && selectedSource.cardSettings?.mode === "both";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>Agregar gasto</h3>

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
        <>
          <UISelect value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Selecciona origen</option>
            <option value="general">General</option>
            {availableSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon || "📁"} {s.name}
              </option>
            ))}
          </UISelect>

          {isBothCard && (
            <UISelect
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as "credit" | "debit")}
            >
              <option value="debit">Pagar con Débito</option>
              <option value="credit">Pagar con Crédito</option>
            </UISelect>
          )}
        </>
      )}

      <UITextInput
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          variant="primary"
          disabled={!description || amount <= 0 || (needsSource && !source)}
          onClick={() =>
            onConfirm({
              description,
              amount: -Math.abs(amount),
              source: needsSource ? source : undefined,
              notes: `${notes}${isBothCard ? ` [modo: ${paymentMode}]` : ""}`,
            })
          }
        >
          Guardar
        </UIButton>
      </div>
    </div>
  );
};

export default AddExpenseModal;
