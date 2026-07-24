import React, { useState, useMemo } from "react";
import { useListStore } from "@/stores/listStore";

import ListLayout from "@/layouts/ListLayout";
import TaskListGroup from "@/components/ToolList/Home/TaskListGroup";
import FloatingActionButton from "@/components/Navigation/FloatingActionButton";
import UIButton from "@/components/UI/UIButton";
import UIBulletItem from "@/components/UI/UIBulletItem";
import UITextInput from "@/components/UI/UITextInput";
import { useModal } from "@/context/ModalContext";
import { getEditTaskModal } from "@/components/Modal/Presets/List/EditTaskModal";
import { getCreateTaskListModal } from "@/components/Modal/Presets/List/CreateTaskListModal";
import { getDeleteTaskListModal } from "@/components/Modal/Presets/List/DeleteTaskListModal";
import { triggerCelebration } from "@/components/UI/UIFullScreenEffectLayer";
import styles from "@/components/ToolList/Home/TaskList.module.css";

const ListHome: React.FC = () => {
  const {
    taskLists,
    activeListId,
    activeFilter,
    tasks, 
    addTaskList,
    deleteTaskList,
    setActiveListId,
    setActiveFilter,
    toggleTaskDone, 
    updateTask, 
    deleteTask,
  } = useListStore();
  const { showModal, hideModal } = useModal();

  const [search, setSearch] = useState("");

  // Filtrar por lista activa y búsqueda
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => activeListId === "all" || t.listId === activeListId);

    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Ordenamiento: prioridad > fecha de vencimiento > fecha de creación
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    result = [...result].sort((a, b) => {
      const pa = priorityOrder[a.priority || "low"];
      const pb = priorityOrder[b.priority || "low"];
      if (pa !== pb) return pa - pb;

      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tasks, activeListId, search]);

  return (
    <ListLayout floating={<FloatingActionButton activeListId={activeListId} />}>
      <div className={styles.homeContainer}>
        {/* Select de listas */}
        <div className={styles.listSelector}>
          <select
            value={activeListId}
            onChange={(e) => setActiveListId(e.target.value)}
            className={styles.listSelect}
          >
            <option value="all">🗂️ Todas las listas ({tasks.filter(t => !t.isDone).length})</option>
            {taskLists.map((list) => {
              const pendingCount = tasks.filter(t => t.listId === list.id && !t.isDone).length;
              return (
                <option key={list.id} value={list.id}>
                  {list.icon} {list.name} {pendingCount > 0 ? `(${pendingCount})` : ""}
                </option>
              );
            })}
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

        {/* Búsqueda */}
        <UITextInput
          placeholder="🔍 Buscar tareas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filtros */}
        <div className={styles.filterRow}>
          <UIBulletItem
            active={activeFilter === "pending"}
            onClick={() => setActiveFilter("pending")}
            color="#f39c12"
            className={styles.filterBullet}
          >
            Pendientes
          </UIBulletItem>
          <UIBulletItem
            active={activeFilter === "done"}
            onClick={() => setActiveFilter("done")}
            color="#2ecc71"
            className={styles.filterBullet}
          >
            Completadas
          </UIBulletItem>
          <UIBulletItem
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            color="#cccccc"
            className={styles.filterBullet}
          >
            Todas
          </UIBulletItem>
        </div>

        {/* Lista de tareas */}
        <TaskListGroup
          tasks={filteredTasks}
          taskLists={taskLists}
          activeListId={activeListId}
          filter={activeFilter}
          onToggleDone={(id) => {
            toggleTaskDone(id);
            const task = tasks.find((t) => t.id === id);
            if (task && !task.isDone) triggerCelebration();
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
