import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";

interface Props {
  currentBalance: number;
  onConfirm: (adjustedBalance: number) => void;
  onCancel: () => void;
}

const AdjustBalanceModal: React.FC<Props> = ({ currentBalance, onConfirm, onCancel }) => {
  const { showPopUp } = usePopUp();
  const [target, setTarget] = useState<number>(currentBalance);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>⚙️ Ajustar balance</h3>
      <p>Balance actual: <strong>${currentBalance.toLocaleString()}</strong></p>
      <UITextInput
        type="number"
        placeholder="Nuevo balance deseado"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        min={0}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">Cancelar</UIButton>
        <UIButton
          onClick={() => {
            try {
              if (target === currentBalance) {
                showPopUp("INFO", "El balance es igual al actual, no hay cambios.");
                return;
              }
              onConfirm(target);
              showPopUp("SUCCESS", "Balance ajustado.");
            } catch (error) {
              showPopUp("DANGER", "Error al ajustar el balance.");
              console.error("AdjustBalanceModal - Error:", error);
            }
          }}
          disabled={false}
          variant="primary"
        >
          Ajustar
        </UIButton>
      </div>
    </div>
  );
};

export default AdjustBalanceModal;
