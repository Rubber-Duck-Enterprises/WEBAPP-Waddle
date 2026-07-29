import React, { useMemo, useRef } from "react";
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

/** Obtiene la key de agrupación por fecha */
function getDateGroupKey(dueDate: string | undefined): string {
  if (!dueDate) return "sin-fecha";
  const date = new Date(dueDate);
  const today = new Date(new Date().toDateString());
  if (date < today) return "vencidas";
  if (date.toDateString() === today.toDateString()) return "hoy";
  // Usar fecha local (no UTC) para la key de agrupación
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Obtiene el label de un grupo de fecha */
function getDateGroupLabel(key: string): string {
  if (key === "sin-fecha") return "📌 Sin fecha";
  if (key === "vencidas") return "⚠️ Vencidas";
  if (key === "hoy") return "📅 Hoy";

  // Parsear como fecha local (no UTC)
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const tomorrow = new Date(new Date().toDateString());
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return "📅 Mañana";

  return `📅 ${date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}

/** Orden de prioridad para los grupos de fecha */
function getDateGroupOrder(key: string): number {
  if (key === "vencidas") return 0;
  if (key === "hoy") return 1;
  if (key === "sin-fecha") return 999;
  // Parsear como fecha local para ordenar
  const [y, m, d] = key.split("-").map(Number);
  return 2 + new Date(y, m - 1, d).getTime() / 1e12;
}

/** Agrupa tareas por fecha de vencimiento */
function groupTasksByDate(tasks: Task[]): { key: string; label: string; tasks: Task[] }[] {
  const groups: Record<string, Task[]> = {};

  for (const task of tasks) {
    const key = getDateGroupKey(task.dueDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }

  return Object.entries(groups)
    .map(([key, tasks]) => ({
      key,
      label: getDateGroupLabel(key),
      tasks,
    }))
    .sort((a, b) => getDateGroupOrder(a.key) - getDateGroupOrder(b.key));
}

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

/** Renderiza una sección de tareas (con o sin virtualización) */
const TaskSection: React.FC<{
  tasks: Task[];
  taskLists: TaskList[];
  onToggleDone: (taskId: string) => void;
  onEdit: (task: Task) => void;
}> = ({ tasks, taskLists, onToggleDone, onEdit }) => {
  if (tasks.length > VIRTUALIZE_THRESHOLD) {
    return (
      <VirtualizedSection
        tasks={tasks}
        taskLists={taskLists}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div className={styles.sectionList}>
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => {
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

  // Agrupar por fecha de vencimiento
  const pendingGroups = useMemo(() => groupTasksByDate(pendingTasks), [pendingTasks]);
  const doneGroups = useMemo(() => groupTasksByDate(doneTasks), [doneTasks]);

  const totalVisible =
    (filter !== "done" ? pendingTasks.length : 0) +
    (filter !== "pending" ? doneTasks.length : 0);

  if (totalVisible === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className={styles.groupContainer}>
      {/* Pendientes agrupadas por fecha */}
      {filter !== "done" && pendingTasks.length > 0 && (
        <div>
          <h4 className={styles.sectionHeader}>
            🕐 Pendientes ({pendingTasks.length})
          </h4>

          {/* Mensaje si no hay tareas para hoy */}
          {!pendingGroups.some((g) => g.key === "hoy") && (
            <div className={styles.todayFree}>
              <span>🎉</span>
              <span>¡Hoy está todo libre!</span>
            </div>
          )}

          {pendingGroups.map((group) => (
            <div key={group.key} className={styles.dateGroup}>
              <div className={styles.dateGroupHeader}>
                <span className={styles.dateGroupLabel}>{group.label}</span>
                <span className={styles.dateGroupDivider} />
              </div>
              <TaskSection
                tasks={group.tasks}
                taskLists={taskLists}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
              />
            </div>
          ))}
        </div>
      )}

      {/* Completadas agrupadas por fecha */}
      {filter !== "pending" && doneTasks.length > 0 && (
        <div>
          <h4 className={styles.sectionHeader}>
            ✅ Completadas ({doneTasks.length})
          </h4>
          {doneGroups.map((group) => (
            <div key={group.key} className={styles.dateGroup}>
              <div className={styles.dateGroupHeader}>
                <span className={styles.dateGroupLabel}>{group.label}</span>
                <span className={styles.dateGroupDivider} />
              </div>
              <TaskSection
                tasks={group.tasks}
                taskLists={taskLists}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListGroup;
