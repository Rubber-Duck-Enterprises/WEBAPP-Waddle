import React from "react";
import UIButton from "../../UI/UIButton";

type Props = {
  onClose: () => void;
};

export const getSavedSettingsModal = ({ onClose }: Props) => (
  <SavedSettingsModal onClose={onClose} />
);

const SavedSettingsModal: React.FC<Props> = ({ onClose }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    <h3>💾 Configuración guardada</h3>
    <p style={{ color: "var(--text-secondary)" }}>
      Tus cambios se han guardado correctamente.
    </p>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <UIButton onClick={onClose} variant="secondary">Cerrar</UIButton>
    </div>
  </div>
);
