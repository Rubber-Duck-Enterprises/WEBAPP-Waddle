import React, { useState } from "react";
import { TaskList, Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit, FiChevronDown } from "react-icons/fi";
import { useListStore } from "@/stores/listStore";
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

/** Determina si la tarea tiene contenido expandible (notas largas o subtareas) */
const hasExpandableContent = (task: Task): boolean => {
  const hasLongNotes = (task.notes?.length || 0) > 60;
  const hasSubtasks = (task.subtasks?.length || 0) > 0;
  return hasLongNotes || hasSubtasks;
};

const TaskItem: React.FC<Props> = ({ task, list, onToggleDone, onEdit }) => {
  const baseColor = list?.color || "#ccc";
  const overdue = task.dueDate && !task.isDone && isOverdue(task.dueDate);
  const [expanded, setExpanded] = useState(false);
  const expandable = hasExpandableContent(task);

  // Subtareas con estado local para reactividad inmediata
  const [localSubtasks, setLocalSubtasks] = useState<Task[]>(task.subtasks || []);
  const subtasks = localSubtasks;

  const handleToggleSubtask = (subtaskId: string) => {
    setLocalSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, isDone: !s.isDone } : s))
    );
    useListStore.getState().toggleSubtask(task.id, subtaskId);
  };

  const completedCount = subtasks.filter((s) => s.isDone).length;

  return (
    <motion.div
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
      {/* Fila principal: checkbox + contenido + editar */}
      <div className={styles.taskRow}>
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

          {/* Notas: colapsadas si son largas y no está expandido */}
          {task.notes && (
            <p
              className={`${styles.taskNotes} ${task.isDone ? styles.taskNotesDone : ""} ${!expanded && (task.notes.length > 60) ? styles.taskNotesClamped : ""}`}
            >
              {task.notes}
            </p>
          )}

          {/* Indicadores — SIEMPRE visibles */}
          <div className={styles.taskMeta}>
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

            {task.repeat && (
              <span style={{ opacity: 0.8 }}>
                {repeatLabels[task.repeat]}
              </span>
            )}

            {task.isDone && task.completedAt && (
              <span style={{ opacity: 0.7 }}>
                ✅ {new Date(task.completedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <span>🏷️ {task.tags.join(", ")}</span>
            )}

            {/* Badge de subtareas (clickeable para expandir) */}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={styles.badge}
                style={{
                  backgroundColor: completedCount === subtasks.length
                    ? "var(--success-bg)"
                    : "var(--surface)",
                  border: `1px solid ${completedCount === subtasks.length
                    ? "var(--success-color)"
                    : "var(--border-color)"}`,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
              >
                📝 {completedCount}/{subtasks.length}
              </button>
            )}

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
          <FiEdit size={22} />
        </button>
      </div>

      {/* Contenido expandible: subtareas */}
      <AnimatePresence initial={false}>
        {expanded && subtasks.length > 0 && (
          <motion.div
            key="subtasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.subtaskList}>
              {subtasks.map((sub) => (
                <label
                  key={sub.id}
                  className={`${styles.subtaskItem} ${sub.isDone ? styles.subtaskDone : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={sub.isDone}
                    onChange={() => handleToggleSubtask(sub.id)}
                    className={styles.subtaskCheckbox}
                    aria-label={`Marcar subtarea "${sub.title}" como ${sub.isDone ? "pendiente" : "completada"}`}
                  />
                  <span className={styles.subtaskTitle}>
                    {sub.title}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón expandir/colapsar — solo si hay contenido expandible */}
      {expandable && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={styles.expandButton}
          aria-label={expanded ? "Colapsar detalles" : "Expandir detalles"}
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <FiChevronDown size={14} />
          </motion.span>
          <span>{expanded ? "Menos" : "Más"}</span>
        </button>
      )}
    </motion.div>
  );
};

export default TaskItem;
