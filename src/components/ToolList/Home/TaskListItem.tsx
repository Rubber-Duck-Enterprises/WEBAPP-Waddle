// components/ToolList/TaskItem.tsx
import React from "react";
import { TaskList, Task } from "../../../types";
import { motion } from "framer-motion";
import { FiEdit } from "react-icons/fi";

interface Props {
  task: Task;
  list?: TaskList;
  onToggleDone: () => void;
  onEdit: () => void;
}

const TaskItem: React.FC<Props> = ({ task, list, onToggleDone, onEdit }) => {
  const baseColor = list?.color || "#ccc";
  const backgroundColor = `${baseColor}1A`;
  const borderColor = baseColor;

  return (
    <motion.label
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, padding: 0, border: 0, margin: 0 }}
      layout="position"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: backgroundColor,
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        border: `1px solid ${borderColor}`,
        borderLeft: `8px solid ${borderColor}`,
        marginBottom: "1rem",
        overflowY: "hidden",
      }}
    >
      <input type="checkbox" checked={task.isDone} onChange={onToggleDone} />

      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            marginBottom: "8px",
            textDecoration: task.isDone ? "line-through" : "none",
            color: task.isDone ? "var(--text-secondary)" : "var(--text-primary)",
          }}
        >
          {task.title}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
          {task.priority && (
            <span>
              ⚠️ {{
                low: "Baja",
                medium: "Media",
                high: "Alta",
              }[task.priority]}
            </span>
          )}
          {task.repeat && <span>🔁 {task.repeat}</span>}
          {task.tags && task.tags.length > 0 && <span>🏷️ {task.tags.join(", ")}</span>}
          {list && <span>{list.icon || "📁"} {list.name}</span>}
        </div>
      </div>

      {/* Botón de edición */}
      {task.isDone ? null : (
        <button
          onClick={onEdit}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          aria-label="Editar tarea"
        >
          <FiEdit size={24} />
        </button>
      )}
    </motion.label>
  );
};

export default TaskItem;
