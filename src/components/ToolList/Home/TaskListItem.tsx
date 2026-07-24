import React from "react";
import { TaskList, Task } from "@/types";
import { motion } from "framer-motion";
import { FiEdit } from "react-icons/fi";
import styles from "./TaskList.module.css";

interface Props {
  task: Task;
  list?: TaskList;
  onToggleDone: () => void;
  onEdit: () => void;
}

const priorityConfig = {
  high: { emoji: "🔴", label: "Alta", color: "#f44336" },
  medium: { emoji: "🟡", label: "Media", color: "#f39c12" },
  low: { emoji: "🟢", label: "Baja", color: "#4caf50" },
};

const repeatLabels: Record<string, string> = {
  daily: "📅 Diario",
  weekly: "📆 Semanal",
  monthly: "🗓️ Mensual",
};

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date(new Date().toDateString());
};

const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate);
  const today = new Date(new Date().toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === tomorrow.toDateString()) return "Mañana";

  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const TaskItem: React.FC<Props> = ({ task, list, onToggleDone, onEdit }) => {
  const baseColor = list?.color || "#ccc";
  const overdue = task.dueDate && !task.isDone && isOverdue(task.dueDate);

  return (
    <motion.label
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, padding: 0, border: 0, margin: 0 }}
      layout="position"
      className={styles.taskItem}
      style={{
        background: `${baseColor}1A`,
        border: `1px solid ${baseColor}`,
        borderLeft: `8px solid ${baseColor}`,
      }}
    >
      <input
        className={styles.taskCheckbox}
        style={{ accentColor: baseColor, opacity: task.isDone ? "1" : ".5" }}
        type="checkbox"
        checked={task.isDone}
        onChange={onToggleDone}
        aria-label={`Marcar "${task.title}" como ${task.isDone ? "pendiente" : "completada"}`}
      />

      <div className={styles.taskContent}>
        <p
          className={`${styles.taskTitle} ${task.isDone ? styles.taskTitleDone : ""}`}
          style={{ color: task.isDone ? undefined : "var(--text-primary)" }}
        >
          {task.title}
        </p>

        {task.notes && (
          <p className={`${styles.taskNotes} ${task.isDone ? styles.taskNotesDone : ""}`}>
            {task.notes}
          </p>
        )}

        {/* Indicadores */}
        <div className={styles.taskMeta}>
          {/* Prioridad */}
          {task.priority && (
            <span
              className={styles.badge}
              style={{
                backgroundColor: `${priorityConfig[task.priority].color}1A`,
                border: `1px solid ${priorityConfig[task.priority].color}`,
              }}
            >
              {priorityConfig[task.priority].emoji} {priorityConfig[task.priority].label}
            </span>
          )}

          {/* Fecha de vencimiento */}
          {task.dueDate && (
            <span
              className={styles.badge}
              style={{
                backgroundColor: overdue ? "#f443361A" : "var(--information-bg)",
                border: `1px solid ${overdue ? "#f44336" : "var(--information-color)"}`,
                fontWeight: overdue ? "700" : "normal",
                color: overdue ? "#f44336" : "var(--text-secondary)",
              }}
            >
              {overdue ? "⚠️" : "📅"} {formatDueDate(task.dueDate)}
            </span>
          )}

          {/* Recurrencia */}
          {task.repeat && (
            <span style={{ opacity: 0.8 }}>
              {repeatLabels[task.repeat]}
            </span>
          )}

          {/* Completada el */}
          {task.isDone && task.completedAt && (
            <span style={{ opacity: 0.7 }}>
              ✅ {new Date(task.completedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <span>🏷️ {task.tags.join(", ")}</span>
          )}

          {/* Subtareas */}
          {task.subtasks && task.subtasks.length > 0 && (
            <span
              className={styles.badge}
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-color)",
              }}
            >
              📝 {task.subtasks.filter(s => s.isDone).length}/{task.subtasks.length}
            </span>
          )}

          {/* Lista */}
          {list && (
            <span>{list.icon || "📁"} {list.name}</span>
          )}
        </div>
      </div>

      {/* Botón de edición */}
      <button
        onClick={onEdit}
        className={styles.editButton}
        style={{ opacity: task.isDone ? 0.5 : 1 }}
        aria-label={`Editar tarea: ${task.title}`}
      >
        <FiEdit size={24} />
      </button>
    </motion.label>
  );
};

export default TaskItem;
