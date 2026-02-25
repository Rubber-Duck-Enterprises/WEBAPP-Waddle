import React from "react";
import UIButton from "@/components/UI/UIButton";

type Props = {
  listName: string;
  onConfirm: () => void;
  onClose: () => void;
};

export const getDeleteTaskListModal = ({ listName, onConfirm, onClose }: Props) => (
  <DeleteTaskListModal listName={listName} onConfirm={onConfirm} onClose={onClose} />
);

const DeleteTaskListModal: React.FC<Props> = ({ listName, onConfirm, onClose }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    <h3>💥Cuidado!</h3>
    <p style={{ color: "var(--text-secondary)" }}>
      {`Estas a punto de eliminar la lista "${listName}" y todas sus tareas`}
    </p>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
      <UIButton onClick={onClose} variant="secondary">Cancelar</UIButton>
      <UIButton onClick={onConfirm} variant="danger">Eliminar</UIButton>
    </div>
  </div>
);