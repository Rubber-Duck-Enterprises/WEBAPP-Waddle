import React, { useState } from "react";
import { Task } from "@/types";
import UITextInput from "./UITextInput";

interface Props {
  subtasks: Task[];
  onAdd: (title: string) => void;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
}

const UISubtaskList: React.FC<Props> = ({ subtasks, onAdd, onToggle, onDelete }) => {
  const [newTitle, setNewTitle] = useState("");

  const completedCount = subtasks.filter((s) => s.isDone).length;

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewTitle("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>
        📝 Subtareas {subtasks.length > 0 && (
          <span style={{ fontWeight: "normal" }}>({completedCount}/{subtasks.length})</span>
        )}
      </label>

      {/* Lista de subtareas existentes */}
      {subtasks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.5rem",
                borderRadius: "6px",
                backgroundColor: sub.isDone ? "var(--success-bg)" : "var(--background)",
                border: "1px solid var(--border-color)",
              }}
            >
              <input
                type="checkbox"
                checked={sub.isDone}
                onChange={() => onToggle(sub.id)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "var(--success-color)",
                  flexShrink: 0,
                }}
                aria-label={`Marcar subtarea "${sub.title}" como ${sub.isDone ? "pendiente" : "completada"}`}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "0.85rem",
                  color: sub.isDone ? "var(--text-secondary)" : "var(--text-primary)",
                  textDecoration: sub.isDone ? "line-through" : "none",
                }}
              >
                {sub.title}
              </span>
              <button
                type="button"
                onClick={() => onDelete(sub.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "0 0.25rem",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label={`Eliminar subtarea "${sub.title}"`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input para agregar nueva subtarea */}
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <UITextInput
          placeholder="Agregar subtarea..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          style={{ flex: 1, fontSize: "0.85rem" }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          style={{
            padding: "0.4rem 0.6rem",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            backgroundColor: newTitle.trim() ? "var(--success-bg)" : "var(--surface)",
            color: newTitle.trim() ? "var(--success-color)" : "var(--text-secondary)",
            cursor: newTitle.trim() ? "pointer" : "default",
            fontSize: "0.85rem",
            fontWeight: "600",
            flexShrink: 0,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default UISubtaskList;
