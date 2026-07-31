import React, { useState } from "react";
import { TimeBlock } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useTimeBlockStore } from "@/stores/timeBlockStore";
import UIButton from "@/components/UI/UIButton";
import UIBulletItem from "@/components/UI/UIBulletItem";
import { triggerCelebration } from "@/components/UI/UIFullScreenEffectLayer";
import styles from "./TimeBlocks.module.css";

interface TimeBlockTaskCardProps {
  selectedBlock: TimeBlock | null;
  onEditBlock?: (block: TimeBlock) => void;
  onAddNewBlock?: () => void;
}

export const TimeBlockTaskCard: React.FC<TimeBlockTaskCardProps> = ({
  selectedBlock,
  onEditBlock,
  onAddNewBlock,
}) => {
  const { tasks, addTask, toggleTaskDone, deleteTask } = useListStore();
  const { blocks } = useTimeBlockStore();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filter, setFilter] = useState<"pending" | "done" | "all">("pending");

  if (!selectedBlock) {
    return (
      <div className={styles.tasksCard}>
        <div className={styles.tasksHeader}>
          <h4 className={styles.tasksTitle}>📝 Tareas del Bloque</h4>
          {onAddNewBlock && (
            <UIButton
              variant="primary"
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
              onClick={onAddNewBlock}
            >
              + Nuevo Bloque
            </UIButton>
          )}
        </div>
        <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
          <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>👆</span>
          Selecciona un bloque de tiempo arriba para ver o agregar sus tareas pendientes.
        </div>
      </div>
    );
  }

  // Comprobar si hay otros bloques compartiendo este mismo grupo (categoryKey)
  const sharedBlocks = selectedBlock.categoryKey
    ? blocks.filter(
        (b) =>
          b.id !== selectedBlock.id &&
          b.categoryKey &&
          b.categoryKey.toLowerCase() === selectedBlock.categoryKey?.toLowerCase()
      )
    : [];

  // Filtrar tareas pertenecientes a este bloque o su grupo compartido
  const blockTasks = tasks.filter((t) => {
    if (t.blockId === selectedBlock.id) return true;
    if (
      selectedBlock.categoryKey &&
      t.blockCategory &&
      t.blockCategory.toLowerCase() === selectedBlock.categoryKey.toLowerCase()
    ) {
      return true;
    }
    if (selectedBlock.listId && t.listId === selectedBlock.listId) return true;
    return false;
  });

  const filteredTasks = blockTasks.filter((t) => {
    if (filter === "pending") return !t.isDone;
    if (filter === "done") return t.isDone;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      blockId: selectedBlock.id,
      blockCategory: selectedBlock.categoryKey,
      listId: selectedBlock.listId,
      priority: "medium",
    });

    setNewTaskTitle("");
  };

  return (
    <div className={styles.tasksCard}>
      {/* Header con nombre del bloque */}
      <div className={styles.tasksHeader}>
        <div className={styles.tasksTitleGroup}>
          <span
            className={styles.blockBadge}
            style={{
              backgroundColor: selectedBlock.color || "#3b82f6",
              color: "#ffffff",
            }}
          >
            {selectedBlock.icon} {selectedBlock.name}
          </span>
        </div>

        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {onEditBlock && (
            <UIButton
              variant="secondary"
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
              onClick={() => onEditBlock(selectedBlock)}
            >
              ✏️ Editar
            </UIButton>
          )}
          {onAddNewBlock && (
            <UIButton
              variant="primary"
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
              onClick={onAddNewBlock}
            >
              + Bloque
            </UIButton>
          )}
        </div>
      </div>

      {/* Indicador de Tareas Compartidas */}
      {sharedBlocks.length > 0 && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            backgroundColor: "var(--background)",
            border: "1px solid var(--border-color)",
            padding: "4px 8px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <span>🔗 <strong>Grupo de tareas compartido:</strong> <em>{selectedBlock.categoryKey}</em></span>
          <span style={{ opacity: 0.8 }}>
            ({sharedBlocks.map((b) => b.name).join(", ")})
          </span>
        </div>
      )}

      {/* Input de nueva tarea directa al bloque */}
      <form onSubmit={handleCreateTask} className={styles.addQuickTaskRow}>
        <input
          type="text"
          className={styles.quickInput}
          placeholder={`+ Agregar tarea a ${selectedBlock.name}...`}
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <UIButton
          type="submit"
          variant="primary"
          style={{ padding: "0.5rem 0.85rem", fontSize: "0.82rem", flexShrink: 0 }}
        >
          Agregar
        </UIButton>
      </form>

      {/* Filtros de tareas idénticos a la vista principal de listas */}
      <div className={styles.filterRow}>
        <UIBulletItem
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
          color="#f39c12"
          className={styles.filterBullet}
        >
          Pendientes ({blockTasks.filter((t) => !t.isDone).length})
        </UIBulletItem>
        <UIBulletItem
          active={filter === "done"}
          onClick={() => setFilter("done")}
          color="#2ecc71"
          className={styles.filterBullet}
        >
          Completadas ({blockTasks.filter((t) => t.isDone).length})
        </UIBulletItem>
        <UIBulletItem
          active={filter === "all"}
          onClick={() => setFilter("all")}
          color="#cccccc"
          className={styles.filterBullet}
        >
          Todas
        </UIBulletItem>
      </div>

      {/* Lista de tareas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {filter === "pending"
              ? "✨ ¡No hay tareas pendientes en este bloque!"
              : "No hay tareas registradas en esta vista."}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={styles.taskItemRow}
              style={{
                opacity: task.isDone ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={task.isDone}
                onChange={() => {
                  toggleTaskDone(task.id);
                  if (!task.isDone) triggerCelebration();
                }}
                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--success-color)", flexShrink: 0 }}
              />

              <div style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    textDecoration: task.isDone ? "line-through" : "none",
                    wordBreak: "break-word",
                  }}
                >
                  {task.title}
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "2px" }}>
                  {task.isOverdueFromPreviousPeriod && (
                    <span className={styles.overdueBadge}>
                      🔥 Pendiente semana pasada
                    </span>
                  )}
                  {task.priority === "high" && !task.isOverdueFromPreviousPeriod && (
                    <span style={{ fontSize: "0.7rem", color: "var(--danger-color)", fontWeight: 700 }}>
                      ⚡ Alta Prioridad
                    </span>
                  )}
                  {task.repeat && (
                    <span style={{ fontSize: "0.7rem", color: "var(--information-color)" }}>
                      🔁 {task.repeat}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  flexShrink: 0,
                  padding: "4px",
                }}
                title="Eliminar tarea"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default TimeBlockTaskCard;
