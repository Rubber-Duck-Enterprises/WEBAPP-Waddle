import React, { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import TaskItem from "./TaskListItem";
import { Task, TaskList } from "@/types";
import styles from "./TaskList.module.css";

interface Props {
  tasks: Task[];
  taskLists: TaskList[];
  activeListId: string | "all";
  filter: "all" | "done" | "pending";
  onToggleDone: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

const VIRTUALIZE_THRESHOLD = 50;

const EmptyState: React.FC<{ filter: string }> = ({ filter }) => {
  const messages: Record<string, { emoji: string; title: string; subtitle: string }> = {
    pending: {
      emoji: "🎉",
      title: "¡Sin tareas pendientes!",
      subtitle: "Agrega una nueva tarea con el botón +",
    },
    done: {
      emoji: "📋",
      title: "Sin tareas completadas",
      subtitle: "Completa tareas para verlas aquí",
    },
    all: {
      emoji: "📝",
      title: "No hay tareas",
      subtitle: "Presiona + para crear tu primera tarea",
    },
  };

  const msg = messages[filter] || messages.all;

  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmoji}>{msg.emoji}</span>
      <p className={styles.emptyTitle}>{msg.title}</p>
      <p className={styles.emptySubtitle}>{msg.subtitle}</p>
    </div>
  );
};

/** Lista virtualizada para cuando hay muchas tareas */
const VirtualizedSection: React.FC<{
  tasks: Task[];
  taskLists: TaskList[];
  onToggleDone: (taskId: string) => void;
  onEdit: (task: Task) => void;
}> = ({ tasks, taskLists, onToggleDone, onEdit }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      style={{ maxHeight: "60vh", overflowY: "auto" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const task = tasks[virtualItem.index];
          const list = taskLists.find((l) => l.id === task.listId);

          return (
            <div
              key={task.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TaskItem
                task={task}
                list={list}
                onToggleDone={() => onToggleDone(task.id)}
                onEdit={() => onEdit(task)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskListGroup: React.FC<Props> = ({
  tasks,
  taskLists,
  filter,
  onToggleDone,
  onEdit,
}) => {
  const pendingTasks = tasks.filter((t) => !t.isDone);
  const doneTasks = tasks.filter((t) => t.isDone);

  const sections: { key: string; title: string; tasks: Task[] }[] = [];

  if (filter === "all") {
    sections.push({ key: "pending", title: "🕐 Pendientes", tasks: pendingTasks });
    sections.push({ key: "done", title: "✅ Completadas", tasks: doneTasks });
  } else if (filter === "pending") {
    sections.push({ key: "pending", title: "🕐 Pendientes", tasks: pendingTasks });
  } else {
    sections.push({ key: "done", title: "✅ Completadas", tasks: doneTasks });
  }

  const totalVisible = sections.reduce((acc, s) => acc + s.tasks.length, 0);
  if (totalVisible === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className={styles.groupContainer}>
      {sections.map((section) => (
        <div key={section.key}>
          <h4 className={styles.sectionHeader}>
            {section.title} ({section.tasks.length})
          </h4>
          {section.tasks.length > VIRTUALIZE_THRESHOLD ? (
            <VirtualizedSection
              tasks={section.tasks}
              taskLists={taskLists}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
            />
          ) : (
            <div className={styles.sectionList}>
              <AnimatePresence mode="popLayout">
                {section.tasks.map((task) => {
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
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskListGroup;
