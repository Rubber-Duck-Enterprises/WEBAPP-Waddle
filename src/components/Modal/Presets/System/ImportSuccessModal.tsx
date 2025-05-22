import React from "react";
import UIButton from "@/components/UI/UIButton";

type Props = {
  onConfirm: () => void;
};

export const getImportSuccessModal = ({ onConfirm }: Props) => {
  return <ImportSuccessModal onConfirm={onConfirm} />;
};

const ImportSuccessModal: React.FC<Props> = ({ onConfirm }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>✅ Importación exitosa</h3>
      <p style={{ color: "var(--text-secondary)" }}>
        Los datos fueron cargados correctamente. Se recargará la página para aplicar los cambios.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <UIButton variant="primary" onClick={onConfirm}>
          Entendido
        </UIButton>
      </div>
    </div>
  );
};

export default ImportSuccessModal;
