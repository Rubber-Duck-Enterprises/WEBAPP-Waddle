import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import { useSectionStore } from "@/stores/sectionStore";
import { Section } from "@/types";

interface Props {
  section: Section;
  onCancel: () => void;
  onConfirm: (data: {
    sourceId: string;
    amount: number;
    notes?: string;
  }) => void;
}

export const getPayCreditCardModal = ({ section, onCancel, onConfirm }: Props) => (
  <PayCreditCardModal section={section} onCancel={onCancel} onConfirm={onConfirm} />
);

const PayCreditCardModal: React.FC<Props> = ({ section, onCancel, onConfirm }) => {
  const { sections } = useSectionStore();
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const availableSources = sections.filter(
    (s) =>
      s.id !== section.id &&
      !(s.type === "card" && s.cardSettings?.mode === "credit")
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>Pagar tarjeta {section.name}</h3>

      <UISelect value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
        <option value="">Selecciona origen</option>
        {availableSources.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon || "📁"} {s.name}
          </option>
        ))}
      </UISelect>

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
        <UIButton variant="default" onClick={onCancel}>Cancelar</UIButton>
        <UIButton
          variant="primary"
          disabled={!sourceId || amount <= 0}
          onClick={() => onConfirm({ sourceId, amount, notes })}
        >
          Confirmar pago
        </UIButton>
      </div>
    </div>
  );
};

export default PayCreditCardModal;
