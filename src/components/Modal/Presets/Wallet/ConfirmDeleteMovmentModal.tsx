import React from "react";
import UIButton from "@/components/UI/UIButton";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export const getConfirmDeleteMovmentModal = ({ onConfirm, onCancel }: Props) => {
  return (
    <ConfirmDeleteMovmentModal
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

const ConfirmDeleteMovmentModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>
        💥 Cuidado!
      </h3>

      <p style={{ color: "var(--text-secondary)" }}>
        Estás a punto de eliminar un movimiento, esto afecta tu balance!
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton variant="default" onClick={onCancel}>
          Cancelar
        </UIButton>

        <UIButton variant="danger" onClick={onConfirm}>
          Eliminar
        </UIButton>
      </div>
    </div>
  );
};

export default ConfirmDeleteMovmentModal;