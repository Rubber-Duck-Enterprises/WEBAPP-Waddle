import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";
import { useWalletStore } from "@/stores/walletStore";
import { Section } from "@/types";
import { usePopUp } from "@/context/PopUpContext";

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
  const { sections } = useWalletStore();
  const { showPopUp } = usePopUp();
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
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
        <UIButton variant="default" onClick={onCancel}>Cancelar</UIButton>
        <UIButton
          variant="primary"
          disabled={false}
          onClick={() => {
            try {
              if (!sourceId) {
                showPopUp("DANGER", "Selecciona un origen.");
                return;
              }
              if (Number(amount) <= 0) {
                showPopUp("DANGER", "El monto debe ser mayor a 0.");
                return;
              }
              onConfirm({ sourceId, amount: Number(amount), notes });
              showPopUp("SUCCESS", "Pago registrado.");
            } catch (error) {
              showPopUp("DANGER", "Error al registrar el pago.");
              console.error("PayCreditCardModal - Error:", error);
            }
          }}
        >
          Confirmar pago
        </UIButton>
      </div>
    </div>
  );
};

export default PayCreditCardModal;
