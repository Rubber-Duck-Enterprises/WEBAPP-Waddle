// components/ToolList/Home/TaskListItem.tsx
import React from "react";
import UIButton from "../../UI/UIButton";
import { TaskList } from "../../../types";

interface Props {
  list: TaskList;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TaskListItem: React.FC<Props> = ({ list, onEdit, onDelete }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem",
      borderRadius: "12px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      background: `${list.color || "var(--surface)"}1A`,
      border: `1px solid ${list.color || "#ccc"}`,
      borderLeft: `16px solid ${list.color || "#ccc"}`,
      gap: "1rem",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
      <div style={{ fontSize: "2rem" }}>{list.icon || "📝"}</div>
      <h4 style={{ margin: 0, color: "var(--text-primary)" }}>{list.name}</h4>
    </div>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {onEdit && (
        <UIButton variant="secondary" onClick={onEdit}>
          Editar
        </UIButton>
      )}
      {onDelete && (
        <UIButton variant="danger" onClick={onDelete}>
          Eliminar
        </UIButton>
      )}
    </div>
  </div>
);

export default TaskListItem;
