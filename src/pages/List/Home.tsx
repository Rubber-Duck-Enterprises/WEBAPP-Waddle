import React, { useState } from "react";
import { useTaskStore } from "../../stores/TaskStore";
import { useTaskListStore } from "../../stores/TaskListStore";

import ListLayout from "../../layouts/ListLayout";
import UIButton from "../../components/UI/UIButton";

const ListHome: React.FC = () => {
  const { tasks, toggleTaskDone } = useTaskStore();
  const { taskLists } = useTaskListStore();

  const [activeListId, setActiveListId] = useState<string | "all">("all");
  const [filter, setFilter] = useState<"all" | "done" | "pending">("all");

  const filteredTasks = tasks.filter((task) => {
    const inList = activeListId === "all" || task.listId === activeListId;
    const matchesFilter =
      filter === "all" ||
      (filter === "done" && task.isDone) ||
      (filter === "pending" && !task.isDone);
    return inList && matchesFilter;
  });

  return (
    <ListLayout>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Select de listas */}
        <div>
          <select
            value={activeListId}
            onChange={(e) => setActiveListId(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--surface)",
              color: "var(--text-primary)",
              width: "100%",
            }}
          >
            <option value="all">🗂️ Todas las listas</option>
            {taskLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.icon} {list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtros de tarea */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <UIButton onClick={() => setFilter("all")} variant={filter === "all" ? "primary" : "default"}>
            Todas
          </UIButton>
          <UIButton onClick={() => setFilter("pending")} variant={filter === "pending" ? "primary" : "default"}>
            Pendientes
          </UIButton>
          <UIButton onClick={() => setFilter("done")} variant={filter === "done" ? "primary" : "default"}>
            Completadas
          </UIButton>
        </div>

        {/* Lista de tareas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredTasks.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No hay tareas para mostrar.</p>
          ) : (
            filteredTasks.map((task) => (
              <label
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "var(--surface)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <input
                  type="checkbox"
                  checked={task.isDone}
                  onChange={() => toggleTaskDone(task.id)}
                />
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      textDecoration: task.isDone ? "line-through" : "none",
                      color: task.isDone ? "var(--text-secondary)" : "var(--text-primary)",
                    }}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <small style={{ color: "var(--text-secondary)" }}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </small>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
      </div>
    </ListLayout>
  );
};

export default ListHome;
