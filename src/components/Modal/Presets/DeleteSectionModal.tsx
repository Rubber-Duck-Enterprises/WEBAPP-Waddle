import React, { useState } from "react";
import UITextInput from "../../UI/UITextInput";
import UIButton from "../../UI/UIButton";

type Props = {
  sectionName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const getDeleteSectionModal = ({ sectionName, onConfirm, onCancel }: Props) => {
  return (
    <DeleteSectionModal
      sectionName={sectionName}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

const DeleteSectionModal: React.FC<Props> = ({ sectionName, onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState("");

  const isValid = confirmText === sectionName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3>¿Eliminar apartado?</h3>
      <p>
        Esta acción no se puede deshacer. Para confirmar, escribe el nombre del
        apartado: <strong>{sectionName}</strong>
      </p>

      <UITextInput
        type="text"
        placeholder="Escribe el nombre del apartado"
        value={confirmText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmText(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton onClick={onCancel} variant="default">
          Cancelar
        </UIButton>
        <UIButton
          onClick={onConfirm}
          disabled={!isValid}
          variant="danger"
          style={{
            background: isValid ? "#f44336" : "#ccc",
            cursor: isValid ? "pointer" : "not-allowed",
          }}
        >
          Eliminar
        </UIButton>
      </div>
    </div>
  );
};
