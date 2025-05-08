import React from "react";
import UIButton from "../../UI/UIButton";

type Props = {
  count: number;
  onClose: () => void;
};

export const getTasksDeletedModal = ({ count, onClose }: Props) => (
  <TasksDeletedModal count={count} onClose={onClose} />
);

const TasksDeletedModal: React.FC<Props> = ({ count, onClose }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    <h3>🧹 Limpieza realizada</h3>
    <p style={{ color: "var(--text-secondary)" }}>
      {count > 0
        ? `Se elimin${count > 1 ? "aron" : "ó"} ${count} tarea${count > 1 ? "s" : ""} completada${count > 1 ? "s" : ""}. ¡Buen trabajo!`
        : `No había tareas completadas para borrar. ¡Sigue adelante!`}
    </p>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <UIButton onClick={onClose} variant="secondary">Cerrar</UIButton>
    </div>
  </div>
);
