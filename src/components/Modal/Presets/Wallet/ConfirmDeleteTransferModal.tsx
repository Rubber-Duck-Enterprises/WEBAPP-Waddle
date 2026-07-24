import React from "react";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export const getConfirmDeleteTransferModal = ({ onConfirm, onCancel }: Props) => {
  return (
    <ConfirmDeleteTransferModal
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

const ConfirmDeleteTransferModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const { showPopUp } = usePopUp();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>
        💥 Cuidado!
      </h3>

      <p style={{ color: "var(--text-secondary)" }}>
        Estás a punto de eliminar una transferencia. Se eliminarán ambos movimientos (origen y destino), esto afecta tu balance!
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton variant="default" onClick={onCancel}>
          Cancelar
        </UIButton>

        <UIButton variant="danger" onClick={() => {
          try {
            onConfirm();
            showPopUp("SUCCESS", "Transferencia eliminada.");
          } catch (error) {
            showPopUp("DANGER", "Error al eliminar la transferencia.");
            console.error("ConfirmDeleteTransferModal - Error:", error);
          }
        }}>
          Eliminar
        </UIButton>
      </div>
    </div>
  );
};

export default ConfirmDeleteTransferModal;
