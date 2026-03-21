import React, { useState } from "react";
import UITextInput from "@/components/UI/UITextInput";
import UIButton from "@/components/UI/UIButton";
import { usePopUp } from "@/context/PopUpContext";

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
  const { showPopUp } = usePopUp();
  const [confirmText, setConfirmText] = useState("");

  const isValid = confirmText.trim() === sectionName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>💥 Cuidado vas a borrar "{sectionName}".</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Esta acción no se puede deshacer. Para confirmar, escribe el nombre del apartado:
        <br />
        <strong>{sectionName}</strong>
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
          onClick={() => {
            try {
              onConfirm();
              showPopUp("SUCCESS", `Apartado "${sectionName}" eliminado.`);
            } catch (error) {
              showPopUp("DANGER", "Error al eliminar el apartado.");
              console.error("DeleteSectionModal - Error:", error);
            }
          }}
          disabled={!isValid}
          variant="danger"
        >
          Eliminar
        </UIButton>
      </div>
    </div>
  );
};

export default DeleteSectionModal;
