import React, { useState } from "react";
import { useWalletStore } from "@/stores/walletStore";

import UITextInput from "@/components/UI/UITextInput";
import UISelect from "@/components/UI/UISelect";
import UIButton from "@/components/UI/UIButton";

import { Section } from "@/types";
import { usePopUp } from "@/context/PopUpContext";

interface Props {
  fromSection: Section;
  onCancel: () => void;
  onConfirm: (data: {
    toId: string;
    amount: number;
    notes?: string;
  }) => void;
}

export const getTransferFundsModal = (props: Props) => <TransferFundsModal {...props} />;

const TransferFundsModal: React.FC<Props> = ({ fromSection, onCancel, onConfirm }) => {
  const { sections, expenses } = useWalletStore();
  const { showPopUp } = usePopUp();

  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const calculateBalance = (sectionId: string): number => {
    const related = expenses.filter(
      (e) => e.category === sectionId || e.source === sectionId
    );
    return related.reduce((acc, e) => acc + e.amount, 0);
  };

  const balanceAvailable = calculateBalance(fromSection.id);

  const isFromCard = fromSection.type === "card";

  const validDestinations = sections.filter((s) => {
    if (s.id === fromSection.id) return false;
    if (s.type === "passive") return false;
    if (isFromCard && fromSection.cardSettings?.mode === "credit") return false;
    if (isFromCard && fromSection.cardSettings?.mode === "both") {
      return s.type === "standard" || (s.type === "card" && s.cardSettings?.mode === "debit");
    }
    return true;
  });

  const isValid = toId && Number(amount) > 0 && Number(amount) <= balanceAvailable;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>🛫 Transferir desde {fromSection.icon || "📁"} {fromSection.name}</h3>

      <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
        Saldo disponible: ${balanceAvailable.toLocaleString()}
      </div>

      <UISelect value={toId} onChange={(e) => setToId(e.target.value)}>
        <option value="">Selecciona destino</option>
        {validDestinations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.icon || "📁"} {s.name}
          </option>
        ))}
      </UISelect>

      <UITextInput
        type="number"
        min={0.01}
        placeholder="Monto a transferir"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <UITextInput
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          onClick={() => {
            try {
              if (!toId) {
                showPopUp("DANGER", "Selecciona un destino.");
                return;
              }
              if (Number(amount) <= 0) {
                showPopUp("DANGER", "El monto debe ser mayor a 0.");
                return;
              }
              if (Number(amount) > balanceAvailable) {
                showPopUp("DANGER", `Fondos insuficientes. Disponible: $${balanceAvailable.toLocaleString()}.`);
                return;
              }
              onConfirm({ toId, amount: Number(amount), notes });
              showPopUp("SUCCESS", "Transferencia realizada.");
              onCancel();
            } catch (error) {
              showPopUp("DANGER", "Error al realizar la transferencia.");
              console.error("TransferFundsModal - Error:", error);
            }
          }}
          variant="primary"
          disabled={false}
        >
          Transferir
        </UIButton>
      </div>
    </div>
  );
};

export default TransferFundsModal;
