import React, { useState } from "react";
import { useTaskStore } from "@/stores/TaskStore";
import { useTaskListStore } from "@/stores/TaskListStore";

import ListLayout from "@/layouts/ListLayout";
import TaskListGroup from "@/components/ToolList/Home/TaskListGroup";
import UIButton from "@/components/UI/UIButton";
import UIBulletItem from "@/components/UI/UIBulletItem";
import { useModal } from "@/context/ModalContext";
import { getEditTaskModal } from "@/components/Modal/Presets/List/EditTaskModal";
import { getCreateTaskListModal } from "@/components/Modal/Presets/List/CreateTaskListModal";
import { getDeleteTaskListModal } from "@/components/Modal/Presets/List/DeleteTaskListModal";

const ListHome: React.FC = () => {
  const { tasks, toggleTaskDone, updateTask, deleteTask } = useTaskStore();
  const { taskLists, addTaskList, deleteTaskList, activeListId, setActiveListId } = useTaskListStore();
  const { showModal, hideModal } = useModal();

  const [filter, setFilter] = useState<"all" | "done" | "pending">("pending");

  const deleteTasksFromList = (listId: string) => {
    tasks.forEach((task) => {
      if (task.listId === listId) deleteTask(task.id);
    });
  };

  return (
    <ListLayout activeListId={activeListId}>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Select de listas */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
          }}
        >
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

          {activeListId !== "all" && (
            <UIButton
              variant="danger"
              onClick={() => {
                const list = taskLists.find((l) => l.id === activeListId);
                if (!list) return;

                showModal(
                  getDeleteTaskListModal({
                    listName: list.name,
                    onClose: hideModal,
                    onConfirm: () => {
                      deleteTaskList(list.id);
                      deleteTasksFromList(list.id);
                      setActiveListId("all");
                      hideModal();
                    },
                  })
                );
              }}
            >
              Eliminar
            </UIButton>
          )}

          <UIButton
            variant="primary"
            onClick={() => {
              showModal(
                getCreateTaskListModal({
                  onCancel: hideModal,
                  onConfirm: ({ name, color, icon }) => {
                    addTaskList({ name, color, icon });
                    hideModal();
                  }
                })
              );
            }}
          >
            Nueva
          </UIButton>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <UIBulletItem
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            color="#f39c12"
          >
            Pendientes
          </UIBulletItem>
          <UIBulletItem
            active={filter === "done"}
            onClick={() => setFilter("done")}
            color="#2ecc71"
          >
            Completadas
          </UIBulletItem>
          <UIBulletItem
            active={filter === "all"}
            onClick={() => setFilter("all")}
            color="#cccccc"
          >
            Todas
          </UIBulletItem>
        </div>

        {/* Lista de tareas */}
        <TaskListGroup
          tasks={tasks.filter((t) => activeListId === "all" || t.listId === activeListId)}
          taskLists={taskLists}
          activeListId={activeListId}
          filter={filter}
          onToggleDone={(id) => {
            toggleTaskDone(id);
            const task = tasks.find((t) => t.id === id);
            if (task && !task.isDone) (window as any).triggerCelebration?.();
          }}
          onEdit={(task) => {
            showModal(
              getEditTaskModal({
                task,
                activeListId,
                onCancel: hideModal,
                onConfirm: (updatedTask) => {
                  updateTask(task.id, updatedTask);
                  hideModal();
                },
                onDelete: () => {
                  deleteTask(task.id);
                  hideModal();
                },
              })
            );
          }}
        />
      </div>
    </ListLayout>
  );
};

export default ListHome;
