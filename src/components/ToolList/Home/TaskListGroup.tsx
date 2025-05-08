// components/ToolList/TaskListGroup.tsx
import React from "react";
import { AnimatePresence } from "framer-motion";
import TaskItem from "./TaskListItem";
import { Task, TaskList } from "../../../types";

interface Props {
  tasks: Task[];
  taskLists: TaskList[];
  activeListId: string | "all";
  filter: "all" | "done" | "pending";
  onToggleDone: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const TaskListGroup: React.FC<Props> = ({
  tasks,
  taskLists,
  filter,
  onToggleDone,
  onEdit,
}) => {
  const getVisible = (section: "pending" | "done" | "all") =>
    filter === "all" || filter === section;

  const sectionTasks = {
    pending: tasks.filter((t) => !t.isDone),
    done: tasks.filter((t) => t.isDone),
    all: tasks,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {(["pending", "done", ...(filter !== "all" ? ["all"] : [])] as ("pending" | "done" | "all")[]).map((section) =>
        getVisible(section) ? (
          <div key={section}>
            <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              {section === "pending" && "🕐 Pendientes"}
              {section === "done" && "✅ Completadas"}
              {section === "all" && "📋 Todas"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <AnimatePresence mode="popLayout">
                {sectionTasks[section].map((task) => {
                  const list = taskLists.find((l) => l.id === task.listId);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      list={list}
                      onToggleDone={() => onToggleDone(task.id)}
                      onEdit={() => onEdit(task)}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default TaskListGroup;
