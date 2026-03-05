import React from "react";
import UIButton from "@/components/UI/UIButton";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export const getMigrateAnonDataModal = ({ onConfirm, onCancel }: Props) => {
  return <MigrateAnonDataModal onConfirm={onConfirm} onCancel={onCancel} />;
};

const MigrateAnonDataModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ color: "var(--text-primary)" }}>💥 ¿Migrar tus datos?</h3>

      <p style={{ color: "var(--text-secondary)" }}>
        Detectamos datos creados en modo anónimo<br />
        ¿Quieres copiarlos a tu cuenta para conservarlos?
      </p>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", opacity: 0.9 }}>
        Si eliges “No”, se borrarán los datos anónimos para evitar duplicados.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <UIButton variant="default" onClick={onCancel}>
          No, borrar
        </UIButton>

        <UIButton variant="primary" onClick={onConfirm}>
          Sí, migrar
        </UIButton>
      </div>
    </div>
  );
};

export default MigrateAnonDataModal;