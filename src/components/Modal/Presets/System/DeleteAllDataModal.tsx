import React, { useState } from "react";
import UIButton from "@/components/UI/UIButton";
import UITextInput from "@/components/UI/UITextInput";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export const getDeleteAllDataModal = ({ onConfirm, onCancel }: Props) => {
  return <DeleteAllDataModal onConfirm={onConfirm} onCancel={onCancel} />;
};

const DeleteAllDataModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState("");

  const isValid = confirmText.trim().toLowerCase() === "eliminar todo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>⚠️ Eliminar todos los datos</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Esta acción eliminará permanentemente todos tus apartados y movimientos. No se puede deshacer.<br />
        Para confirmar, escribe: <strong>eliminar todo</strong>
      </p>

      <UITextInput
        type="text"
        placeholder="eliminar todo"
        value={confirmText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmText(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton onClick={onConfirm} variant="danger" disabled={!isValid}>
          Borrar todo
        </UIButton>
      </div>
    </div>
  );
};

export default DeleteAllDataModal;
